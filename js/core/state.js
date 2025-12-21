// Global の状態管理
// Vue はグローバルにロードされていることを前提

// Initialize Namespace
window.App = window.App || {};

// Define State in Namespace
App.State = Vue.reactive({
  // パースされたテーブル定義
  parsedTables: [],

  // アプリケーション設定
  config: null,

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
    offset: '',
    // カウントメソッドを生成するか
    includeCountMethod: false
  },

  // SQL Builder State のリセット
  resetSqlState() {
    this.sql.selectedTables = [];
    this.sql.joins = [];
    this.sql.filters = [];
    this.sql.sorts = [];
    this.sql.limit = '';
    this.sql.offset = '';
    this.sql.includeCountMethod = false;
  }
});

// Backward compatibility alias & Console debug
window.AppState = App.State;
