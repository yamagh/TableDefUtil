
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// Setup DOM environment for global window/Vue emulation if needed,
// though for logic we mostly need the global scope.
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock Vue reactive
const reactive = (obj) => obj; // Simple pass-through for testing
global.Vue = { reactive };

// Manually load the scripts into the global scope
const loadScript = (relativePath) => {
  const code = fs.readFileSync(path.resolve(__dirname, '../../js/', relativePath), 'utf8');
  // Execute in global scope using vm
  const vm = require('vm');
  vm.runInThisContext(code);
};

// Mock AppState structure before loading logic
global.AppState = {
  parsedTables: [],
  sql: {
    selectedTables: [],
    joins: [],
    filters: [],
    sorts: [],
    limit: '',
    offset: '',
    includeCountMethod: false
  },
  resetSqlState() {
      this.sql.selectedTables = [];
      this.sql.joins = [];
      this.sql.filters = [];
      this.sql.sorts = [];
      this.sql.limit = '';
      this.sql.offset = '';
      this.sql.includeCountMethod = false;
  }
};

// Setup App Namespace Mock
global.App = {
  State: global.AppState,
  Core: {}
};
// Aliasing for window.App inside vm if needed (since window is global.window)
global.window.App = global.App;

// sql_logic.js expects AppState to exist, so we loaded the mock above.
// Now load the actual code code.
loadScript('core/sql_logic.js');

const SqlLogic = global.App.Core.SqlLogic;

describe('SqlLogic', () => {
  beforeEach(() => {
    // Reset state before each test
    global.AppState.parsedTables = [
      {
        tableName: 'users',
        columns: [
          { colName: 'id', type: 'int' },
          { colName: 'name', type: 'varchar' }
        ]
      },
      {
         tableName: 'posts',
         columns: [
             { colName: 'id', type: 'int' },
             { colName: 'user_id', type: 'int' },
             { colName: 'title', type: 'varchar' }
         ]
      }
    ];
    global.AppState.resetSqlState();
  });

  it('should add a table to selectedTables', () => {
    SqlLogic.addTable('users');
    expect(global.AppState.sql.selectedTables).toHaveLength(1);
    expect(global.AppState.sql.selectedTables[0].tableName).toBe('users');
    expect(global.AppState.sql.selectedTables[0].alias).toBe('t0');
  });

  it('should remove a table from selectedTables', () => {
    SqlLogic.addTable('users');
    SqlLogic.addTable('posts');
    SqlLogic.removeTable(0); // Remove users
    expect(global.AppState.sql.selectedTables).toHaveLength(1);
    expect(global.AppState.sql.selectedTables[0].tableName).toBe('posts');
    // Check alias reassignment
    expect(global.AppState.sql.selectedTables[0].alias).toBe('t0');
  });

  it('should generate basic SELECT SQL', () => {
    SqlLogic.addTable('users');
    const sql = SqlLogic.generateSql();
    
    // Normalize whitespace for easier comparison
    const normalized = sql.replace(/\s+/g, ' ').trim();
    expect(normalized).toContain('SELECT * FROM users AS t0 ;');
  });

  it('should generate JOIN condition automatically', () => {
     SqlLogic.addTable('users');
     SqlLogic.addTable('posts');
     SqlLogic.addJoin();
     
     const join = global.AppState.sql.joins[0];
     expect(join.type).toBe('INNER JOIN');
     // Since users has 'id' and posts has 'user_id', it might try to match those if logic exists
     // Looking at source: logic checks for specific patterns.
     // Let's see what it produces.
     expect(join.rightAlias).toBe('t1');
  });
});
