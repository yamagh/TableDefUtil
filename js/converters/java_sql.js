/**
 * SQLからJavaコード（DTO/Repository/Service/Controller）を生成する
 * @param {Object} sqlState - SQL Builderのステート
 * @param {Array} parsedTables - パース済みのテーブル定義
 * @param {String} selectClause - SELECT句の文字列
 * @param {Boolean} isSelectEdited - SELECT句が手動編集されているかどうか
 * @returns {Object} 生成されたファイルのマップ { 'path/filename': 'content' }
 */
function generateJavaSql(sqlState, parsedTables, selectClause, isSelectEdited) {
  const result = {};

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
    result[`models/dto/${dtoName}.java`] = generateDto(dtoName, columnDefs);
  }

  // 5. Repository生成
  const repoName = `${baseName}SqlRepository`;
  result[`repository/${repoName}.java`] = generateSqlRepository(repoName, modelDtoType, returnType.isModel, sqlState, selectClause, columnDefs);

  // 6. Service生成
  const serviceName = `${baseName}SqlService`;
  result[`services/${serviceName}.java`] = generateSqlService(serviceName, repoName, modelDtoType, baseName, returnType.isModel);

  // 7. Controller生成
  const controllerName = `${baseName}SqlController`;
  result[`controllers/${controllerName}.java`] = generateSqlController(controllerName, serviceName, modelDtoType, baseName, returnType.isModel);

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
 * DTOクラスの生成
 */
function generateDto(className, columnDefs) {
  let content = `// --- FileName: ${className}.java ---\n`;
  content += `package models.dto;\n\n`;
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

  let content = `// --- FileName: ${repoName}.java ---\n`;
  content += `package repository;\n\n`;
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
  content += `    public CompletionStage<List<${modelDtoType}>> search() {\n`;
  content += `        return supplyAsync(() -> {\n`;

  if (isModel) {
    // Modelの場合は、DB.findNative(Model.class, sql) を使用する
    // デフォルトのSELECT句 (alias付き) はModelマッピングに適さないため、
    // ここでは t0.* を使用してクエリを再構築する
    let sql = buildSqlForModel(sqlState);
    content += `            String sql = """\n${sql}\n            """;\n\n`;
    content += `            return DB.findNative(${modelDtoType}.class, sql).findList();\n`;
  } else {
    // DTOの場合は元のロジック
    let sql = buildSqlForDto(sqlState, selectClause);
    content += `            String sql = """\n${sql}\n            """;\n\n`;
    content += `            return DB.findDto(${modelDtoType}.class, sql).findList();\n`;
  }

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
function generateSqlService(serviceName, repoName, modelDtoType, baseName, isModel) {
  let content = `// --- FileName: ${serviceName}.java ---\n`;
  content += `package services;\n\n`;
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
  content += `    public CompletionStage<List<${modelDtoType}>> search() {\n`;
  content += `        return repository.search();\n`;
  content += `    }\n`;
  content += `}\n`;
  return content;
}

/**
 * Controllerの生成
 */
function generateSqlController(controllerName, serviceName, modelDtoType, baseName, isModel) {
  let content = `// --- FileName: ${controllerName}.java ---\n`;
  content += `package controllers.api;\n\n`;
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
  content += `        return service.search().thenApplyAsync(list -> ok(play.libs.Json.toJson(list)));\n`;
  content += `    }\n`;
  content += `}\n`;
  return content;
}
