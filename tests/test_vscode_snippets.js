const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = {};
global.App = { Converters: {} };

// Helper to load client-side file
function loadClientScript(relativePath) {
  const content = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  eval(content);
}

// Load the converter
try {
  loadClientScript('js/converters/vscode_snippets.js');
} catch (e) {
  console.error("Error loading script:", e);
  process.exit(1);
}

// Test Data
const tables = [
  {
    tableName: 'users',
    tableNameJP: 'ユーザー',
    columns: [
      { colName: 'id', colNameJP: 'ID', type: 'bigserial' },
      { colName: 'name', colNameJP: '名前', type: 'varchar' },
      { colName: 'email', colNameJP: 'メール', type: 'varchar' }
    ]
  },
  {
    tableName: 'posts',
    tableNameJP: '投稿',
    columns: [
      { colName: 'id', colNameJP: 'ID', type: 'bigserial' }, // Duplicate column name test
      { colName: 'user_id', colNameJP: 'ユーザーID', type: 'bigint' },
      { colName: 'title', colNameJP: 'タイトル', type: 'varchar' }
    ]
  }
];

// Run Conversion
const result = App.Converters.VscodeSnippets.generateVscodeSnippets(tables);

// Validation
console.log("Result length:", result.length); // Should be 8

result.forEach(file => {
  console.log(`\n--- ${file.path} ---`);
  console.log(file.content.substring(0, 200) + "..."); // Show first 200 chars
  
  // Verify it is valid JSON
  try {
    JSON.parse(file.content);
    console.log("Valid JSON");
  } catch (e) {
    console.error("Invalid JSON:", e.message);
  }
});
