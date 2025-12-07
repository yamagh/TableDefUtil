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
    Object.keys(table.indexes).forEach(idxKey => {
      const index = table.indexes[idxKey];
      const indexName = `${tableName}_${idxKey.toLowerCase()}`;
      const indexColumns = index.map(i => i.colName).join(', ');
      ddl += `CREATE INDEX ${indexName} ON ${tableName} (${indexColumns});\n`;
    });
    ddl += '\n-- --------------------------------------------------\n\n';
  });

  return [{ path: 'schema.sql', content: ddl }];
}
