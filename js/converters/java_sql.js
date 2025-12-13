/**
 * SQLからJavaコード（DTO/Repository/Service/Controller）を生成する
 * @param {Object} sqlState - SQL Builderのステート
 * @param {Array} parsedTables - パース済みのテーブル定義
 * @param {String} selectClause - SELECT句の文字列
 * @param {Boolean} isSelectEdited - SELECT句が手動編集されているかどうか
 * @returns {Array} 生成されたファイルのリスト [{path, content}]
 */
function generateJavaSql(sqlState, parsedTables, selectClause, isSelectEdited) {
  const result = [];

  if (sqlState.selectedTables.length === 0) {
    return result;
  }

  // 1. カラムの解析
  const columnDefs = parseSelectClause(selectClause, sqlState, parsedTables);

  // 2. 戻り値の型判定 (Model vs DTO)
  const returnType = determineReturnType(columnDefs, parsedTables, sqlState, isSelectEdited);

  // 3. 基本名の決定
  const baseName = determineBaseName(sqlState, returnType);

  // 単一カラム判定
  const isSingleColumn = !returnType.isModel && columnDefs.length === 1;

  let dtoName, modelDtoType;
  if (returnType.isModel) {
    dtoName = returnType.modelName;
    modelDtoType = returnType.modelName;
  } else if (isSingleColumn) {
    dtoName = "";
    modelDtoType = columnDefs[0].javaType;
  } else {
    dtoName = `${baseName}Dto`;
    modelDtoType = dtoName;
  }

  // 4. DTO生成 (必要な場合)
  if (!returnType.isModel && !isSingleColumn) {
    result.push({
      path: `models/dto/${dtoName}.java`,
      content: generateDto(dtoName, columnDefs)
    });
  }

  // パラメータ解析
  let fullSqlForParams = "";
  if (returnType.isModel) {
    fullSqlForParams = buildSqlForModel(sqlState);
  } else {
    fullSqlForParams = buildSqlForDto(sqlState, selectClause);
  }
  const parameters = analyzeParameters(fullSqlForParams);

  // 5. Repository生成
  const repoName = `${baseName}SqlRepository`;
  result.push({
    path: `repository/${repoName}.java`,
    content: generateSqlRepository(repoName, modelDtoType, returnType.isModel, isSingleColumn, sqlState, selectClause, columnDefs, parameters)
  });

  // 6. Service生成
  const serviceName = `${baseName}SqlService`;
  result.push({
    path: `services/${serviceName}.java`,
    content: generateSqlService(serviceName, repoName, modelDtoType, baseName, returnType.isModel, isSingleColumn, parameters)
  });

  // 7. Controller生成
  const controllerName = `${baseName}SqlController`;
  result.push({
    path: `controllers/${controllerName}.java`,
    content: generateSqlController(controllerName, serviceName, modelDtoType, baseName, returnType.isModel, parameters)
  });

  return result;
}

/**
 * SELECT句を解析してカラム定義のリストを返す
 */
function parseSelectClause(selectClause, sqlState, parsedTables) {
  // 簡易的なパーサー: "t0.id as t0_id, t0.name" のような形式
  const parts = selectClause.split(',').map(p => p.trim()).filter(p => p);

  return parts.map(part => {
    const asMatch = part.match(/(.+?)\s+(?:AS|as)\s+(.+)/i);
    let expr = part;
    let alias = '';

    if (asMatch) {
      expr = asMatch[1].trim();
      alias = asMatch[2].trim();
    }

    const dotMatch = expr.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_*]+)/);

    let tableAlias = '';
    let colName = '';
    let javaType = 'String';
    let originalColName = '';
    let colNameJP = '';  // Added for Japanese Comment

    if (dotMatch) {
      tableAlias = dotMatch[1];
      colName = dotMatch[2];

      const tableState = sqlState.selectedTables.find(t => t.alias === tableAlias);
      if (tableState) {
        const tableDef = parsedTables.find(t => t.tableName === tableState.tableName);
        if (tableDef) {
          if (colName !== '*') {
            const colDef = tableDef.columns.find(c => c.colName === colName);
            if (colDef) {
              javaType = mapPostgresToJavaType(colDef.type);
              originalColName = colDef.colName;
              colNameJP = colDef.colNameJP; // Extract Japanese Name
            }
          }
        }
      }
    }

    if (!alias) {
      alias = colName || expr.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    return {
      expr,
      alias,
      javaType,
      originalColName: originalColName || alias,
      colNameJP: colNameJP || "" // Return Japanese Name with default
    };
  });
}

/**
 * 戻り値の型（既存Modelか新規DTOか）を判定する
 */
function determineReturnType(columnDefs, parsedTables, sqlState, isSelectEdited) {
  // SELECT句が編集されておらず、かつテーブルが1つだけの場合は既存Modelを使用
  if (!isSelectEdited && sqlState.selectedTables.length === 1) {
    const table = parsedTables.find(t => t.tableName === sqlState.selectedTables[0].tableName);
    return { isModel: true, modelName: toPascalCase(table.tableName) };
  }

  return { isModel: false };
}

/**
 * ファイル名のベースとなる名前を決定
 */
function determineBaseName(sqlState, returnType) {
  if (returnType.isModel) {
    return returnType.modelName;
  }
  if (sqlState.selectedTables.length > 0) {
    return toPascalCase(sqlState.selectedTables[0].tableName) + "Custom";
  }
  return "CustomQuery";
}

/**
 * SQLからパラメータ変数を解析する
 * returns: { name: string, type: string, isDerived: boolean, derivedFrom: string | null }[]
 */
function analyzeParameters(sql) {
  const matches = sql.match(/:([a-zA-Z0-9_]+)/g);
  if (!matches) return [];

  const rawNames = [...new Set(matches.map(m => m.substring(1)))];

  // 1. IN句で使用されている変数を検出する
  // 簡易的なRegex: "IN (:foo)" な形式
  // 注意: 空白文字の扱いや、カッコ内の空白などを考慮
  const listVariables = new Set();
  const inClauseRegex = /IN\s*\(\s*:([a-zA-Z0-9_]+)\s*\)/gi;
  let match;
  while ((match = inClauseRegex.exec(sql)) !== null) {
    listVariables.add(match[1]);
  }

  // Detect Integer variables (LIMIT/OFFSET)
  const intVariables = new Set();
  const limitOffsetRegex = /(?:LIMIT|OFFSET)\s+:([a-zA-Z0-9_]+)/gi;
  while ((match = limitOffsetRegex.exec(sql)) !== null) {
    intVariables.add(match[1]);
  }

  const parameters = [];

  // まず基本的な変数をリストアップ
  rawNames.forEach(name => {
    const isList = listVariables.has(name);
    parameters.push({
      name: name,
      type: isList ? 'List<String>' : 'String',
      isDerived: false,
      derivedFrom: null
    });
  });

  // Derived (Size) 変数の判定と修正
  // もし "fooSize" というパラメータがあり、かつ "foo" がList<String>として存在する場合、
  // "fooSize" は derivedFrom: "foo" とする
  parameters.forEach(param => {
    if (param.name.endsWith('Size')) {
      const contentName = param.name.substring(0, param.name.length - 4); // remove "Size"
      const parentParam = parameters.find(p => p.name === contentName && p.type === 'List<String>');
      if (parentParam) {
        param.isDerived = true;
        param.derivedFrom = contentName;
        param.type = 'Integer'; // サイズなのでInteger
      }
    }
  });

  return parameters;
}


/**
 * DTOクラスの生成
 */
function generateDto(className, columnDefs) {
  let content = `package models.dto;\n\n`;
  content += `import lombok.Data;\n`;
  content += `import java.time.Instant;\n`;
  content += `import io.ebean.annotation.Sql;\n\n`;

  content += `/**\n * SQL検索結果用DTO\n */\n`;
  content += `@Data\n`;
  content += `public class ${className} {\n`;

  columnDefs.forEach(col => {
    const fieldName = toCamelCase(col.alias);
    const type = col.javaType;
    if (col.colNameJP) {
      content += `    /** ${col.colNameJP} */\n`;
    }
    content += `    private ${type} ${fieldName};\n`;
  });

  content += `}\n`;
  return content;
}

/**
 * Repositoryの生成
 */
function generateSqlRepository(repoName, modelDtoType, isModel, isSingleColumn, sqlState, selectClause, columnDefs, parameters) {
  let packageImport = "";
  if (isModel) {
    packageImport = `models.${modelDtoType}`;
  } else if (!isSingleColumn) {
    packageImport = `models.dto.${modelDtoType}`;
  } else {
    if (modelDtoType === 'BigDecimal') packageImport = 'java.math.BigDecimal';
    else if (modelDtoType === 'UUID') packageImport = 'java.util.UUID';
    else if (['LocalDate', 'LocalTime', 'LocalDateTime', 'Instant'].includes(modelDtoType)) {
      packageImport = `java.time.${modelDtoType}`;
    }
  }

  // SQLの構築
  let sql = "";
  if (isModel) {
    sql = buildSqlForModel(sqlState);
  } else {
    sql = buildSqlForDto(sqlState, selectClause);
  }

  // メソッド引数: isDerived=trueのものは除外
  const signatureParams = parameters.filter(p => !p.isDerived);
  const methodArgs = signatureParams.map(p => `${p.type} ${p.name}`).join(', ');

  let content = `package repository;\n\n`;
  content += `import io.ebean.DB;\n`;
  if (!isModel) {
    content += `import io.ebean.SqlRow;\n`;
  }
  if (packageImport) {
    content += `import ${packageImport};\n`;
  }
  content += `import java.util.List;\n`;
  content += `import java.util.concurrent.CompletionStage;\n`;
  content += `import static java.util.concurrent.CompletableFuture.supplyAsync;\n`;
  content += `import javax.inject.Inject;\n\n`;

  content += `public class ${repoName} {\n\n`;

  content += `    private final DatabaseExecutionContext executionContext;\n\n`;
  content += `    @Inject\n`;
  content += `    public ${repoName}(DatabaseExecutionContext executionContext) {\n`;
  content += `        this.executionContext = executionContext;\n`;
  content += `    }\n\n`;

  content += `    /**\n`;
  content += `     * ${repoName} の検索結果を取得します。\n`;
  content += `     * @return CompletionStage<List<${modelDtoType}>>\n`;
  content += `     */\n`;
  content += `    public CompletionStage<List<${modelDtoType}>> search(${methodArgs}) {\n`;
  content += `        return supplyAsync(() -> {\n`;

  content += `            String sql = """\n${sql}\n            """;\n\n`;

  if (isModel || isSingleColumn) {
    content += `            return DB.findNative(${modelDtoType}.class, sql)\n`;
  } else {
    content += `            return DB.findDto(${modelDtoType}.class, sql)\n`;
  }

  // パラメータ設定
  parameters.forEach(p => {
    if (p.isDerived && p.derivedFrom) {
      // Derived parameter (e.g. fooSize -> foo.size())
      content += `                .setParameter("${p.name}", ${p.derivedFrom}.size())\n`;
    } else {
      // Normal parameter
      content += `                .setParameter("${p.name}", ${p.name} != null ? ${p.name} : "")\n`;
    }
  });

  content += `                .findList();\n`;

  content += `        }, executionContext);\n`;
  content += `    }\n`;

  content += `}\n`;

  return content;
}

/**
 * Model用にSQLを構築（SELECT t0.* とする）
 */
function buildSqlForModel(sqlState) {
  let sql = '                SELECT\n';
  // エイリアス付きのテーブル全カラム指定
  // e.g. t0.*
  const first = sqlState.selectedTables[0];
  sql += `                    ${first.alias}.*`;

  sql += '\n                FROM\n';
  sql += `                    ${first.tableName} AS ${first.alias}`;

  // Joins (Modelの場合は通常1テーブルだが、将来拡張のため)
  sqlState.joins.forEach(join => {
    const rightTbl = sqlState.selectedTables.find(t => t.alias === join.rightAlias);
    const rightName = rightTbl ? rightTbl.tableName : '???';
    sql += `\n                ${join.type} ${rightName} AS ${join.rightAlias} ON ${join.condition.replace(/\n/g, '\n                    ')}`;
  });

  const validFilters = sqlState.filters.filter(f => f.trim() !== '');
  if (validFilters.length > 0) {
    sql += '\n                WHERE\n';
    sql += validFilters.map(f => `                    ${f}`).join(' AND\n');
  }

  if (sqlState.sorts.length > 0) {
    sql += '\n                ORDER BY\n';
    sql += '                    ' + sqlState.sorts.map(s => `${s.alias}.${s.column} ${s.direction}`).join(',\n                    ');
  }

  if (sqlState.limit && sqlState.limit.trim() !== '') {
    sql += `\n                LIMIT ${sqlState.limit.trim()}`;
  }

  if (sqlState.offset && sqlState.offset.trim() !== '') {
    sql += `\n                OFFSET ${sqlState.offset.trim()}`;
  }

  return sql;
}


/**
 * DTO用にSQLを構築（ユーザー指定のSELECT句を使用）
 */
function buildSqlForDto(sqlState, selectClause) {
  let sql = '                SELECT\n';
  sql += '                    ' + (selectClause || '*').replace(/\n/g, '\n                    ');
  sql += '\n                FROM\n';

  const first = sqlState.selectedTables[0];
  sql += `                    ${first.tableName} AS ${first.alias}`;

  sqlState.joins.forEach(join => {
    const rightTbl = sqlState.selectedTables.find(t => t.alias === join.rightAlias);
    const rightName = rightTbl ? rightTbl.tableName : '???';
    sql += `\n                ${join.type} ${rightName} AS ${join.rightAlias} ON ${join.condition.replace(/\n/g, '\n                    ')}`;
  });

  const validFilters = sqlState.filters.filter(f => f.trim() !== '');
  if (validFilters.length > 0) {
    sql += '\n                WHERE\n';
    sql += validFilters.map(f => `                    ${f}`).join(' AND\n');
  }

  if (sqlState.sorts.length > 0) {
    sql += '\n                ORDER BY\n';
    sql += '                    ' + sqlState.sorts.map(s => `${s.alias}.${s.column} ${s.direction}`).join(',\n                    ');
  }

  if (sqlState.limit && sqlState.limit.trim() !== '') {
    sql += `\n                LIMIT ${sqlState.limit.trim()}`;
  }

  if (sqlState.offset && sqlState.offset.trim() !== '') {
    sql += `\n                OFFSET ${sqlState.offset.trim()}`;
  }

  return sql;
}

/**
 * Serviceの生成
 */
function generateSqlService(serviceName, repoName, modelDtoType, baseName, isModel, isSingleColumn, parameters) {
  const signatureParams = parameters.filter(p => !p.isDerived);
  const methodArgs = signatureParams.map(p => `${p.type} ${p.name}`).join(', ');
  const callArgs = signatureParams.map(p => p.name).join(', ');

  let content = `package services;\n\n`;
  if (isModel) {
    content += `import models.${modelDtoType};\n`;
  } else if (!isSingleColumn) {
    content += `import models.dto.${modelDtoType};\n`;
  } else {
    let typeImport = "";
    if (modelDtoType === 'BigDecimal') typeImport = 'java.math.BigDecimal';
    else if (modelDtoType === 'UUID') typeImport = 'java.util.UUID';
    else if (['LocalDate', 'LocalTime', 'LocalDateTime', 'Instant'].includes(modelDtoType)) {
      typeImport = `java.time.${modelDtoType}`;
    }
    if (typeImport) {
      content += `import ${typeImport};\n`;
    }
  }
  content += `import repository.${repoName};\n`;
  content += `import java.util.List;\n`;
  content += `import java.util.concurrent.CompletionStage;\n`;
  content += `import javax.inject.Inject;\n\n`;

  content += `public class ${serviceName} {\n\n`;
  content += `    private final ${repoName} repository;\n\n`;
  content += `    @Inject\n`;
  content += `    public ${serviceName}(${repoName} repository) {\n`;
  content += `        this.repository = repository;\n`;
  content += `    }\n\n`;

  content += `    /**\n`;
  content += `     * ${serviceName} の検索結果をJSONで取得します。\n`;
  content += `     * @return CompletionStage<List<${modelDtoType}>>\n`;
  content += `     */\n`;
  content += `    public CompletionStage<List<${modelDtoType}>> search(${methodArgs}) {\n`;
  content += `        return repository.search(${callArgs});\n`;
  content += `    }\n`;
  content += `}\n`;
  return content;
}

/**
 * Controllerの生成
 */
function generateSqlController(controllerName, serviceName, modelDtoType, baseName, isModel, parameters) {
  const signatureParams = parameters.filter(p => !p.isDerived);
  const callArgs = signatureParams.map(p => p.name).join(', ');

  let content = `package controllers.api;\n\n`;
  content += `import services.${serviceName};\n`;
  content += `import play.mvc.Controller;\n`;
  content += `import play.mvc.Http;\n`;
  content += `import play.mvc.Result;\n`;
  content += `import javax.inject.Inject;\n`;
  content += `import java.util.concurrent.CompletionStage;\n`;
  content += `import controllers.actions.Authenticated;\n`;
  content += `import java.util.List;\n\n`;

  content += `@Authenticated\n`;
  content += `public class ${controllerName} extends Controller {\n\n`;
  content += `    private final ${serviceName} service;\n`;

  content += `    @Inject\n`;
  content += `    public ${controllerName}(${serviceName} service) {\n`;
  content += `        this.service = service;\n`;
  content += `    }\n\n`;

  content += `    /**\n`;
  content += `     * ${controllerName} の検索結果をJSONで取得します。\n`;
  content += `     * @return JSON形式の検索結果\n`;
  content += `     */\n`;
  content += `    public CompletionStage<Result> search(Http.Request request) {\n`;

  if (signatureParams.length > 0) {
    signatureParams.forEach(p => {
      if (p.type === 'List<String>') {
        // 配列パラメータの取得 (Play framework: ?foo=1&foo=2 -> Map<String, String[]> get(key))
        // 注意: request.queryString() returns Map<String, String[]>
        // getOrDefaultなどで安全に取得する
        content += `        List<String> ${p.name} = request.queryString().containsKey("${p.name}") ? java.util.Arrays.asList(request.queryString().get("${p.name}")) : java.util.Collections.emptyList();\n`;
      } else {
        content += `        String ${p.name} = request.queryString("${p.name}").orElse(null);\n`;
      }
    });
    content += `\n`;
  }

  content += `        return service.search(${callArgs}).thenApplyAsync(list -> ok(play.libs.Json.toJson(list)));\n`;
  content += `    }\n`;
  content += `}\n`;
  return content;
}
