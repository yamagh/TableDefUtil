window.DEFAULT_TABLE_DEFINITIONS = [
  {
    "tableName": "users",
    "tableNameJP": "ユーザー",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "user_name", "colNameJP": "ユーザー名", "pkfk": "AK", "type": "varchar", "length": "255", "constraint": "NN, U", "default": "", "description": "ユーザーのディスプレイネーム", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "email", "colNameJP": "メールアドレス", "pkfk": "", "type": "varchar", "length": "255", "constraint": "NN, U", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "1", "idx4": "", "idx5": "" },
      { "colName": "is_active", "colNameJP": "有効フラグ", "pkfk": "", "type": "boolean", "length": "", "constraint": "NN", "default": "true", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "department_id", "colNameJP": "部署ID", "pkfk": "FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "1", "idx5": "" },
      { "colName": "created_at", "colNameJP": "作成日時", "pkfk": "", "type": "timestamp", "length": "", "constraint": "NN", "default": "now()", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "departments",
    "tableNameJP": "部署",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "code", "colNameJP": "部署コード", "pkfk": "AK", "type": "char", "length": "10", "constraint": "NN, U", "default": "", "description": "", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "name", "colNameJP": "部署名", "pkfk": "", "type": "varchar", "length": "255", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "created_at", "colNameJP": "作成日時", "pkfk": "", "type": "timestamp", "length": "", "constraint": "NN", "default": "now()", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  }
];
