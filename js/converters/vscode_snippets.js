/**
 * VS Code Snippets Generator
 * Generates VS Code compatible snippet files from table definitions.
 */

// Initialize Namespace
window.App = window.App || {};
App.Converters = App.Converters || {};

App.Converters.VscodeSnippets = {

  /**
   * Generates VS Code snippets based on table definitions.
   * @param {Array} tables List of parsed table objects
   * @returns {Array} Array of objects { path, content }
   */
  generateVscodeSnippets(tables) {
    if (!tables || !Array.isArray(tables)) return [];

    const snippets = [
      {
        path: 'vscode/tables_en.code-snippets',
        data: this._generateTableEn(tables)
      },
      {
        path: 'vscode/tables_jp.code-snippets',
        data: this._generateTableJp(tables)
      },
      {
        path: 'vscode/tables_en_to_jp.code-snippets',
        data: this._generateTableEnToJp(tables)
      },
      {
        path: 'vscode/tables_jp_to_en.code-snippets',
        data: this._generateTableJpToEn(tables)
      },
      {
        path: 'vscode/columns_en.code-snippets',
        data: this._generateColumnEn(tables)
      },
      {
        path: 'vscode/columns_jp.code-snippets',
        data: this._generateColumnJp(tables)
      },
      {
        path: 'vscode/columns_en_to_jp.code-snippets',
        data: this._generateColumnEnToJp(tables)
      },
      {
        path: 'vscode/columns_jp_to_en.code-snippets',
        data: this._generateColumnJpToEn(tables)
      }
    ];

    return snippets.map(item => ({
      path: item.path,
      content: JSON.stringify(item.data, null, 2)
    }));
  },

  _generateTableEn(tables) {
    const result = {};
    tables.forEach(table => {
      const name = table.tableName;
      if (!name) return;
      result[`Table: ${name}`] = {
        prefix: name,
        body: [name],
        description: `Table English Name: ${name}`
      };
    });
    return result;
  },

  _generateTableJp(tables) {
    const result = {};
    tables.forEach(table => {
      const nameJp = table.tableNameJP;
      if (!nameJp) return;
      // Avoid duplicate keys if possible, but map object keys must be unique. 
      // NameJP might be duplicated? Unlikely for tables but possible.
      // Append logical name to key to ensure uniqueness?
      const key = `TableJP: ${nameJp}`;
      if (!result[key]) {
        result[key] = {
          prefix: nameJp,
          body: [nameJp],
          description: `Table Japanese Name: ${nameJp}`
        };
      }
    });
    return result;
  },

  _generateTableEnToJp(tables) {
    const result = {};
    tables.forEach(table => {
      const name = table.tableName;
      const nameJp = table.tableNameJP || '';
      if (!name) return;
      result[`Table EN->JP: ${name}`] = {
        prefix: name,
        body: [nameJp],
        description: `Convert ${name} to ${nameJp}`
      };
    });
    return result;
  },

  _generateTableJpToEn(tables) {
    const result = {};
    tables.forEach(table => {
      const name = table.tableName || '';
      const nameJp = table.tableNameJP;
      if (!nameJp) return;
      const key = `Table JP->EN: ${nameJp}`;
       if (!result[key]) {
        result[key] = {
          prefix: nameJp,
          body: [name],
          description: `Convert ${nameJp} to ${name}`
        };
      }
    });
    return result;
  },

  _generateColumnEn(tables) {
    const result = {};
    const seen = new Set();
    
    tables.forEach(table => {
      if (!table.columns) return;
      table.columns.forEach(col => {
        const name = col.colName;
        if (!name) return;
        if (seen.has(name)) return;
        seen.add(name);

        result[`Column: ${name}`] = {
          prefix: name,
          body: [name],
          description: `Column English Name: ${name}`
        };
      });
    });
    return result;
  },

  _generateColumnJp(tables) {
    const result = {};
    const seen = new Set();

    tables.forEach(table => {
      if (!table.columns) return;
      table.columns.forEach(col => {
        const nameJp = col.colNameJP;
        if (!nameJp) return;
        if (seen.has(nameJp)) return;
        seen.add(nameJp);

        result[`ColumnJP: ${nameJp}`] = {
          prefix: nameJp,
          body: [nameJp],
          description: `Column Japanese Name: ${nameJp}`
        };
      });
    });
    return result;
  },

  _generateColumnEnToJp(tables) {
    const result = {};
    // For mapping, multiple tables might map 'id' to different things (e.g. User ID vs Dept ID).
    // VS Code snippets allows duplicates if we use different Keys.
    // If we want to show ALL variations, we should key by "Table.Column" or just unique combination of From->To.

    const seen = new Set();

    tables.forEach(table => {
      if (!table.columns) return;
      table.columns.forEach(col => {
        const name = col.colName;
        const nameJp = col.colNameJP || '';
        if (!name) return;
        
        const comboKey = `${name}::${nameJp}`;
        if (seen.has(comboKey)) return;
        seen.add(comboKey);

        // Key must be unique in the JSON file
        const key = `Col EN->JP: ${name} -> ${nameJp}`;
        result[key] = {
          prefix: name,
          body: [nameJp],
          description: `Convert Column ${name} to ${nameJp}`
        };
      });
    });
    return result;
  },

  _generateColumnJpToEn(tables) {
    const result = {};
    const seen = new Set();

    tables.forEach(table => {
      if (!table.columns) return;
      table.columns.forEach(col => {
        const name = col.colName || '';
        const nameJp = col.colNameJP;
        if (!nameJp) return;

        const comboKey = `${nameJp}::${name}`;
        if (seen.has(comboKey)) return;
        seen.add(comboKey);

        const key = `Col JP->EN: ${nameJp} -> ${name}`;
        result[key] = {
          prefix: nameJp,
          body: [name],
          description: `Convert Column ${nameJp} to ${name}`
        };
      });
    });
    return result;
  }
};
