/**
 * パース結果を中間データ構造へ変換
 */
function transformToIntermediate(data) {
  const tables = {};
  data.forEach(row => {
    const tableName = row.TableName;
    if (!tableName) return;

    if (!tables[tableName]) {
      tables[tableName] = {
        tableNo: row.TableNo,
        tableNameJP: row.TableName_JP,
        tableName: row.TableName,
        description: row.Description,
        columns: [],
        indexes: {}
      };
    }

    tables[tableName].columns.push({
      colNo: row.ColNo,
      colNameJP: row.ColName_JP,
      colName: row.ColName,
      pkfk: row['PK/FK'],
      type: row.Type,
      length: row.Length,
      constraint: row.Constraint,
      default: row.Default,
      description: row.Description // Descriptionは最初の行にあることが多いので、とりあえず全てのカラムで同じと仮定する
    });

    // インデックスの収集
    for (let i = 1; i <= 5; i++) {
      const idxKey = `Idx${i}`;
      if (row[idxKey]) {
        if (!tables[tableName].indexes[idxKey]) {
          tables[tableName].indexes[idxKey] = [];
        }
        tables[tableName].indexes[idxKey].push({
          order: parseInt(row[idxKey], 10),
          colName: row.ColName
        });
      }
    }
  });

  // インデックスカラムを順序でソート
  Object.values(tables).forEach(table => {
    Object.keys(table.indexes).forEach(idxKey => {
      table.indexes[idxKey].sort((a, b) => a.order - b.order);
    });
  });

  return Object.values(tables);
}
