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
  const dtoName = returnType.isModel ? returnType.modelName : `${baseName}Dto`;
  const modelDtoType = returnType.isModel ? returnType.modelName : dtoName;

  // 4. DTO生成 (必要な場合)
  if (!returnType.isModel) {
    result.push({
      path: `models/dto/${dtoName}.java`,
      content: generateDto(dtoName, columnDefs)
    });
  }

  // 5. Repository生成
  const repoName = `${baseName}SqlRepository`;
  result.push({
    path: `repository/${repoName}.java`,
    content: generateSqlRepository(repoName, modelDtoType, returnType.isModel, sqlState, selectClause, columnDefs)
  });

  // Extract parameters from all potential SQL parts to pass to Service/Controller
  // Note: generateSqlRepository calculates parameters internally, but we need them here too to pass down
  // or we can recalculate them. For simplicity, let's recalculate or use a helper that does it on state.
  // Actually, let's look at how generateSqlRepository generates SQL. 
  // It calls buildSqlForModel or buildSqlForDto. We can do that here to parse params.
  let fullSqlForParams = "";
  if (returnType.isModel) {
    fullSqlForParams = buildSqlForModel(sqlState);
  } else {
    fullSqlForParams = buildSqlForDto(sqlState, selectClause);
  }
  const parameters = extractParameters(fullSqlForParams);

  // 6. Service生成
  const serviceName = `${baseName}SqlService`;
  result.push({
    path: `services/${serviceName}.java`,
    content: generateSqlService(serviceName, repoName, modelDtoType, baseName, returnType.isModel, parameters)
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
      originalColName: originalColName || alias
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
 * SQLからパラメータ変数（:variableName）を抽出する
 */
function extractParameters(sql) {
  const matches = sql.match(/:([a-zA-Z0-9_]+)/g);
  if (!matches) return [];
  // 重複を除去して名前だけ返す
  return [...new Set(matches.map(m => m.substring(1)))];
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
  content += `@Sql\n`;
  content += `public class ${className} {\n`;

  columnDefs.forEach(col => {
    const fieldName = toCamelCase(col.alias);
    const type = col.javaType;
    content += `    private ${type} ${fieldName};\n`;
  });

  content += `}\n`;
  return content;
}

/**
 * Repositoryの生成
 */
function generateSqlRepository(repoName, modelDtoType, isModel, sqlState, selectClause, columnDefs) {
  const packageImport = isModel ? `models.${modelDtoType}` : `models.dto.${modelDtoType}`;

  // SQL構築とパラメータ抽出
  let sql = "";
  if (isModel) {
    sql = buildSqlForModel(sqlState);
  } else {
    sql = buildSqlForDto(sqlState, selectClause);
  }
  const parameters = extractParameters(sql);

  // パラメータ引数文字列の作成 (e.g., "String foo, String bar")
  const methodArgs = parameters.map(p => `String ${p}`).join(', ');

  let content = `package repository;\n\n`;
  content += `import io.ebean.DB;\n`;
  if (!isModel) {
    content += `import io.ebean.SqlRow;\n`;
  }
  content += `import ${packageImport};\n`;
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

  if (isModel) {
    content += `            return DB.findNative(${modelDtoType}.class, sql)\n`;
  } else {
    content += `            return DB.findDto(${modelDtoType}.class, sql)\n`;
  }

  // パラメータ設定
  parameters.forEach(p => {
    content += `                .setParameter("${p}", ${p})\n`;
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

  return sql;
}

/**
 * Serviceの生成
 */
function generateSqlService(serviceName, repoName, modelDtoType, baseName, isModel, parameters) {
  const methodArgs = parameters.map(p => `String ${p}`).join(', ');
  const callArgs = parameters.join(', ');

  let content = `package services;\n\n`;
  if (isModel) {
    content += `import models.${modelDtoType};\n`;
  } else {
    content += `import models.dto.${modelDtoType};\n`;
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
  const callArgs = parameters.join(', ');

  let content = `package controllers.api;\n\n`;
  content += `import services.${serviceName};\n`;
  content += `import play.mvc.Controller;\n`;
  content += `import play.mvc.Http;\n`;
  content += `import play.mvc.Result;\n`;
  content += `import javax.inject.Inject;\n`;
  content += `import java.util.concurrent.CompletionStage;\n`;
  content += `import controllers.actions.Authenticated;\n\n`;

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

  if (parameters.length > 0) {
    parameters.forEach(p => {
      content += `        String ${p} = request.getQueryString("${p}");\n`;
    });
    content += `\n`;
  }

  content += `        return service.search(${callArgs}).thenApplyAsync(list -> ok(play.libs.Json.toJson(list)));\n`;
  content += `    }\n`;
  content += `}\n`;
  return content;
}
