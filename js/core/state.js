// Global の状態管理
// Vue はグローバルにロードされていることを前提

const AppState = Vue.reactive({
  // パースされたテーブル定義
  parsedTables: [],

  // SQL Builder State
  sql: {
    // 選択されたテーブル
    selectedTables: [],
    // 結合条件
    joins: [],
    // フィルター
    filters: [],
    // ソート
    sorts: [],
    // LIMIT
    limit: '',
    // OFFSET
    offset: ''
  },

  // SQL Builder State のリセット
  resetSqlState() {
    this.sql.selectedTables = [];
    this.sql.joins = [];
    this.sql.filters = [];
    this.sql.sorts = [];
    this.sql.limit = '';
    this.sql.offset = '';
  }
});

// コンソールデバッグ用
window.AppState = AppState;
