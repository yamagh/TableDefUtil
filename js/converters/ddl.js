/**
 * DDL (PostgreSQL) 生成
 */
function generateDDL(tables) {
  let ddl = '';
  tables.forEach(table => {
    const tableName = table.tableName;
    const pkColumns = table.columns.filter(c => c.pkfk === 'PK').map(c => c.colName);
    const akColumns = table.columns.filter(c => c.pkfk === 'AK').map(c => c.colName);

    // テーブル削除
    ddl += `DROP TABLE IF EXISTS ${tableName};\n\n`;

    // テーブル作成
    ddl += `CREATE TABLE ${tableName} (\n`;
    const columnDefs = table.columns.map(col => {
      let def = `    ${col.colName}`;

      if (col.type === 'varchar' && col.length) {
        def += ` VARCHAR(${col.length})`;
      } else if (col.type === 'char' && col.length) {
        def += ` CHAR(${col.length})`;
      } else {
        def += ` ${col.type.toUpperCase()}`;
      }

      if (col.constraint) {
        if (col.constraint.includes('NN')) {
          def += ' NOT NULL';
        }
        if (col.constraint.includes('U')) {
          def += ' UNIQUE';
        }
      }

      if (col.default) {
        def += ` DEFAULT ${col.default}`;
      }
      return def;
    });

    ddl += columnDefs.join(',\n');

    // 主キー
    if (pkColumns.length > 0) {
      ddl += `,\n    PRIMARY KEY (${pkColumns.join(', ')})`;
    }

    // 代替キー（ユニーク制約）
    if (akColumns.length > 0) {
      ddl += `,\n    CONSTRAINT ${tableName}_ak UNIQUE (${akColumns.join(', ')})`;
    }

    ddl += '\n);\n\n';

    // コメント
    ddl += `COMMENT ON TABLE ${tableName} IS '${table.tableNameJP}';\n`;
    table.columns.forEach(col => {
      ddl += `COMMENT ON COLUMN ${tableName}.${col.colName} IS '${col.colNameJP}';\n`;
    });
    ddl += '\n';

    // インデックス
    const indexes = getIndexes(table);
    Object.keys(indexes).forEach(idxKey => {
      const index = indexes[idxKey];
      const indexName = `${tableName}_${idxKey.toLowerCase()}`;
      const indexColumns = index.map(i => i.colName).join(', ');
      ddl += `CREATE INDEX ${indexName} ON ${tableName} (${indexColumns});\n`;
    });
    ddl += '\n-- --------------------------------------------------\n\n';
  });

  return [{ path: 'schema.sql', content: ddl }];
}

/**
 * DDL (PlayFramework Evolution) 生成
 * 1.sql のような形式で !Ups と !Downs を生成する
 */
function generatePlayEvolution(tables) {
  let ups = '# --- !Ups\n\n';
  let downs = '# --- !Downs\n\n';

  tables.forEach(table => {
    const tableName = table.tableName;
    const pkColumns = table.columns.filter(c => c.pkfk === 'PK').map(c => c.colName);
    const akColumns = table.columns.filter(c => c.pkfk === 'AK').map(c => c.colName);

    // --- !Ups ---

    // テーブル作成
    ups += `--\n-- ${table.tableNameJP || tableName}\n--\n`;
    ups += `CREATE TABLE ${tableName} (\n`;
    const columnDefs = table.columns.map(col => {
      let def = `    ${col.colName}`;

      if (col.type === 'varchar' && col.length) {
        def += ` VARCHAR(${col.length})`;
      } else if (col.type === 'char' && col.length) {
        def += ` CHAR(${col.length})`;
      } else {
        def += ` ${col.type.toUpperCase()}`;
      }

      if (col.constraint) {
        if (col.constraint.includes('NN')) {
          def += ' NOT NULL';
        }
        if (col.constraint.includes('U')) {
          def += ' UNIQUE';
        }
      }

      if (col.default) {
        def += ` DEFAULT ${col.default}`;
      }
      return def;
    });

    ups += columnDefs.join(',\n');

    // 主キー
    if (pkColumns.length > 0) {
      ups += `,\n    PRIMARY KEY (${pkColumns.join(', ')})`;
    }

    // 代替キー（ユニーク制約）
    if (akColumns.length > 0) {
      ups += `,\n    CONSTRAINT ${tableName}_ak UNIQUE (${akColumns.join(', ')})`;
    }

    ups += '\n);\n\n';

    // コメント
    ups += `COMMENT ON TABLE ${tableName} IS '${table.tableNameJP}';\n`;
    table.columns.forEach(col => {
      ups += `COMMENT ON COLUMN ${tableName}.${col.colName} IS '${col.colNameJP}';\n`;
    });
    ups += '\n';

    // インデックス
    const indexes = getIndexes(table);
    Object.keys(indexes).forEach(idxKey => {
      const index = indexes[idxKey];
      const indexName = `${tableName}_${idxKey.toLowerCase()}`;
      const indexColumns = index.map(i => i.colName).join(', ');
      ups += `CREATE INDEX ${indexName} ON ${tableName} (${indexColumns});\n`;
    });

    ups += '\n';

    // --- !Downs ---
    downs += `DROP TABLE IF EXISTS ${tableName};\n`;
  });

  return ups + downs;
}

/**
 * テーブルのカラム定義からインデックス情報を再構築するヘルパー
 */
function getIndexes(table) {
  const indexes = {};
  if (!table.columns) return indexes;

  table.columns.forEach(col => {
    // idx1 ~ idx5 をチェック
    for (let i = 1; i <= 5; i++) {
      const key = `idx${i}`;
      const val = col[key];
      if (val) {
        const idxKey = `Idx${i}`;
        if (!indexes[idxKey]) indexes[idxKey] = [];
        indexes[idxKey].push({
          order: parseInt(val, 10) || 0,
          colName: col.colName
        });
      }
    }
  });

  // 順序でソート
  Object.keys(indexes).forEach(k => {
    indexes[k].sort((a, b) => a.order - b.order);
  });

  return indexes;
}
