// Global state management
// Assumes Vue is loaded globally via <script> tag

const AppState = Vue.reactive({
  // Parsed table definitions
  parsedTables: [],

  // SQL Builder State
  sql: {
    selectedTables: [],
    joins: [],
    filters: [],
    sorts: [],
    limit: '',
    offset: ''
  },

  // Helper to reset SQL state
  resetSqlState() {
    this.sql.selectedTables = [];
    this.sql.joins = [];
    this.sql.filters = [];
    this.sql.sorts = [];
    this.sql.limit = '';
    this.sql.offset = '';
  }
});

// For console debugging
window.AppState = AppState;
