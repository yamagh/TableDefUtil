/**
 * パース結果を中間データ構造へ変換
 */
// Initialize Namespace
window.App = window.App || {};
App.Core = App.Core || {};

App.Core.Parser = {
  /**
   * パース結果を中間データ構造へ変換
   */
  transformToIntermediate: function(data) {
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
        description: row.Description, // Todo: テーブルの説明はあとで定義可能とするが今は、１行目のカラム説明を入れておく
        idx1: row.Idx1,
        idx2: row.Idx2,
        idx3: row.Idx3,
        idx4: row.Idx4,
        idx5: row.Idx5
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
};

// Backward compat
window.transformToIntermediate = App.Core.Parser.transformToIntermediate;
