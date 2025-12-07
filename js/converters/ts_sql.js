/**
 * SQLからTypeScript型定義を生成する
 * @param {Object} sqlState - SQL Builderのステート
 * @param {Array} parsedTables - パース済みのテーブル定義
 * @param {String} selectClause - SELECT句の文字列
 * @param {Boolean} isSelectEdited - SELECT句が手動編集されているかどうか
 * @returns {Array} 生成されたファイルのリスト [{path, content}]
 */
function generateTsSql(sqlState, parsedTables, selectClause, isSelectEdited) {
  const result = [];

  if (sqlState.selectedTables.length === 0) {
    return result;
  }

  // 1. カラムの解析
  const columnDefs = parseSelectClauseForTs(selectClause, sqlState, parsedTables);

  // 2. 基本名の決定
  const baseName = determineBaseNameForTs(sqlState);
  const typeName = `${baseName}Dto`;

  // 3. 型定義の生成
  result.push({
    path: `models/ts/${typeName}.ts`,
    content: generateTsInterface(typeName, columnDefs)
  });

  return result;
}

/**
 * SELECT句を解析してカラム定義のリストを返す (TS用)
 */
function parseSelectClauseForTs(selectClause, sqlState, parsedTables) {
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
    let tsType = 'any';
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
              tsType = mapPostgresToTsType(colDef.type);
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
      alias,
      tsType,
      originalColName: originalColName || alias
    };
  });
}

/**
 * ファイル名のベースとなる名前を決定 (TS用 - Javaとロジック合わせる)
 */
function determineBaseNameForTs(sqlState) {
  if (sqlState.selectedTables.length === 1) {
    return toPascalCase(sqlState.selectedTables[0].tableName);
  }
  if (sqlState.selectedTables.length > 0) {
    return toPascalCase(sqlState.selectedTables[0].tableName) + "Custom";
  }
  return "CustomQuery";
}

/**
 * TypeScriptインターフェースの生成
 */
function generateTsInterface(typeName, columnDefs) {
  let content = `/**\n * SQL query result DTO\n */\n`;
  content += `export interface ${typeName} {\n`;

  columnDefs.forEach(col => {
    const propName = toCamelCase(col.alias);
    const type = col.tsType;
    // 全てオプショナルにするか、NN制約を見るかは議論があるが、
    // ここでは使い勝手優先で既存のtypescript.jsに合わせてオプショナルにする
    content += `  ${propName}?: ${type};\n`;
  });

  content += `}\n`;
  return content;
}
