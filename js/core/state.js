// Global state management
const AppState = {
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
};

// Backwards compatibility/Shortcuts if needed, but prefer AppState.parsedTables
// We will replace 'parsedTables' and 'sqlState' usage with 'AppState.parsedTables' and 'AppState.sql'
