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
  },
  {
    "tableName": "todos",
    "tableNameJP": "ToDo",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "title", "colNameJP": "タイトル", "pkfk": "", "type": "varchar", "length": "255", "constraint": "NN", "default": "", "description": "タスクのタイトル", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "description", "colNameJP": "詳細", "pkfk": "", "type": "text", "length": "", "constraint": "", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "is_done", "colNameJP": "完了フラグ", "pkfk": "", "type": "boolean", "length": "", "constraint": "NN", "default": "false", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "priority", "colNameJP": "優先度", "pkfk": "", "type": "integer", "length": "", "constraint": "NN", "default": "0", "description": "0:低, 1:中, 2:高", "idx1": "2", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "due_date", "colNameJP": "期限", "pkfk": "", "type": "timestamp", "length": "", "constraint": "", "default": "", "description": "", "idx1": "2", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "user_id", "colNameJP": "ユーザーID", "pkfk": "FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "1", "idx5": "" },
      { "colName": "created_at", "colNameJP": "作成日時", "pkfk": "", "type": "timestamp", "length": "", "constraint": "NN", "default": "now()", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "updated_at", "colNameJP": "更新日時", "pkfk": "", "type": "timestamp", "length": "", "constraint": "NN", "default": "now()", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "categories",
    "tableNameJP": "カテゴリ",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "name", "colNameJP": "カテゴリ名", "pkfk": "AK", "type": "varchar", "length": "100", "constraint": "NN, U", "default": "", "description": "", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "todo_categories",
    "tableNameJP": "ToDoカテゴリ",
    "columns": [
      { "colName": "todo_id", "colNameJP": "ToDo ID", "pkfk": "PK, FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "category_id", "colNameJP": "カテゴリID", "pkfk": "PK, FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "products",
    "tableNameJP": "商品",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "name", "colNameJP": "商品名", "pkfk": "", "type": "varchar", "length": "255", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "sku", "colNameJP": "SKU", "pkfk": "AK", "type": "varchar", "length": "50", "constraint": "NN, U", "default": "", "description": "Stock Keeping Unit", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "price", "colNameJP": "価格", "pkfk": "", "type": "decimal", "length": "10,2", "constraint": "NN", "default": "0", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "description", "colNameJP": "説明", "pkfk": "", "type": "text", "length": "", "constraint": "", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "is_published", "colNameJP": "公開フラグ", "pkfk": "", "type": "boolean", "length": "", "constraint": "NN", "default": "true", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "created_at", "colNameJP": "作成日時", "pkfk": "", "type": "timestamp", "length": "", "constraint": "NN", "default": "now()", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "product_variants",
    "tableNameJP": "商品バリエーション",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "product_id", "colNameJP": "商品ID", "pkfk": "FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "color", "colNameJP": "色", "pkfk": "", "type": "varchar", "length": "50", "constraint": "", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "size", "colNameJP": "サイズ", "pkfk": "", "type": "varchar", "length": "50", "constraint": "", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "stock_quantity", "colNameJP": "在庫数", "pkfk": "", "type": "integer", "length": "", "constraint": "NN", "default": "0", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "orders",
    "tableNameJP": "注文",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "user_id", "colNameJP": "ユーザーID", "pkfk": "FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "order_date", "colNameJP": "注文日時", "pkfk": "", "type": "timestamp", "length": "", "constraint": "NN", "default": "now()", "description": "", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "total_amount", "colNameJP": "合計金額", "pkfk": "", "type": "decimal", "length": "12,2", "constraint": "NN", "default": "0", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "status", "colNameJP": "ステータス", "pkfk": "", "type": "varchar", "length": "20", "constraint": "NN", "default": "'PENDING'", "description": "PENDING, PAID, SHIPPED, COMPLETED, CANCELLED", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "order_items",
    "tableNameJP": "注文明細",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "order_id", "colNameJP": "注文ID", "pkfk": "FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "product_variant_id", "colNameJP": "商品バリエーションID", "pkfk": "FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "quantity", "colNameJP": "数量", "pkfk": "", "type": "integer", "length": "", "constraint": "NN", "default": "1", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "price_at_purchase", "colNameJP": "購入時単価", "pkfk": "", "type": "decimal", "length": "10,2", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "employees",
    "tableNameJP": "社員",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "first_name", "colNameJP": "名", "pkfk": "", "type": "varchar", "length": "50", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "last_name", "colNameJP": "姓", "pkfk": "", "type": "varchar", "length": "50", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "email", "colNameJP": "メールアドレス", "pkfk": "AK", "type": "varchar", "length": "255", "constraint": "NN, U", "default": "", "description": "", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "hire_date", "colNameJP": "入社日", "pkfk": "", "type": "date", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "department_id", "colNameJP": "部署ID", "pkfk": "FK", "type": "bigint", "length": "", "constraint": "", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "1", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "salaries",
    "tableNameJP": "給与",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "employee_id", "colNameJP": "社員ID", "pkfk": "FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "amount", "colNameJP": "支給額", "pkfk": "", "type": "decimal", "length": "10,2", "constraint": "NN", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "payment_date", "colNameJP": "支給日", "pkfk": "", "type": "date", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "job_titles",
    "tableNameJP": "役職",
    "columns": [
      { "colName": "id", "colNameJP": "ID", "pkfk": "PK", "type": "bigserial", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "title", "colNameJP": "役職名", "pkfk": "AK", "type": "varchar", "length": "100", "constraint": "NN, U", "default": "", "description": "", "idx1": "", "idx2": "1", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "min_salary", "colNameJP": "最小給与想定", "pkfk": "", "type": "decimal", "length": "10,2", "constraint": "", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "max_salary", "colNameJP": "最大給与想定", "pkfk": "", "type": "decimal", "length": "10,2", "constraint": "", "default": "", "description": "", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  },
  {
    "tableName": "employee_jobs",
    "tableNameJP": "社員役職履歴",
    "columns": [
      { "colName": "employee_id", "colNameJP": "社員ID", "pkfk": "PK, FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "job_title_id", "colNameJP": "役職ID", "pkfk": "PK, FK", "type": "bigint", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "start_date", "colNameJP": "開始日", "pkfk": "PK", "type": "date", "length": "", "constraint": "NN", "default": "", "description": "", "idx1": "1", "idx2": "", "idx3": "", "idx4": "", "idx5": "" },
      { "colName": "end_date", "colNameJP": "終了日", "pkfk": "", "type": "date", "length": "", "constraint": "", "default": "", "description": "NULLの場合は現在就任中", "idx1": "", "idx2": "", "idx3": "", "idx4": "", "idx5": "" }
    ]
  }
];
