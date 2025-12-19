const fs = require('fs');
const path = require('path');

// Mocks
global.AppState = {
  config: {
    commonColumns: null // will be set in tests
  }
};

// Utils
function toPascalCase(s) {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}
function toCamelCase(s) {
  const pascal = toPascalCase(s);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
function mapPostgresToJavaType(pgType) {
  pgType = pgType.toLowerCase();
  if (['bigserial', 'bigint'].includes(pgType)) return 'Long';
  if (['integer', 'smallint'].includes(pgType)) return 'Integer';
  if (['varchar', 'char', 'text', 'bit'].includes(pgType)) return 'String';
  if (['boolean'].includes(pgType)) return 'Boolean';
  if (['timestamp', 'date'].includes(pgType)) return 'java.time.Instant';
  if (['time'].includes(pgType)) return 'java.time.LocalTime';
  if (['bytea'].includes(pgType)) return 'byte[]';
  return 'Object';
}

// Load Converters
// Adjusted path to point to parent directory's js/converters
const convertersDir = path.join(__dirname, '../js/converters');

const javaModelCode = fs.readFileSync(path.join(convertersDir, 'java_model.js'), 'utf8');
const javaRepoCode = fs.readFileSync(path.join(convertersDir, 'java_repo.js'), 'utf8');
const javaServiceCode = fs.readFileSync(path.join(convertersDir, 'java_service.js'), 'utf8');
const ddlCode = fs.readFileSync(path.join(convertersDir, 'ddl.js'), 'utf8');

eval(javaModelCode);
eval(javaRepoCode);
eval(javaServiceCode);
eval(ddlCode);

// Test Data
const tables = [{
  tableName: 'users',
  tableNameJP: 'Users',
  columns: [
    { colName: 'id', pkfk: 'PK', type: 'bigserial', constraint: 'NN' }, // Will be mapped to configured ID
    { colName: 'record_id', pkfk: 'PK', type: 'bigserial', constraint: 'NN' }, // If config changes ID to record_id
    { colName: 'user_name', type: 'varchar', length: '255', constraint: 'NN' },
    { colName: 'is_deleted', type: 'boolean' } // Will be mapped to configured is_deleted
  ]
}];

function testDefaultConfig() {
  console.log("Testing Default Config...");
  AppState.config.commonColumns = null; // Should fall back to defaults in code

  // Generate Model
  const modelFiles = generateJavaModel(tables, {});
  const baseModel = modelFiles.find(f => f.path === 'models/BaseModel.java').content;

  if (!baseModel.includes('public Long id;')) throw new Error('Default BaseModel should have id');
  if (!baseModel.includes('public Boolean isDeleted = false;')) throw new Error('Default BaseModel should have isDeleted boolean');

  console.log("PASS: Default Config Model");
}

function testCustomConfig() {
  console.log("Testing Custom Config...");
  AppState.config.commonColumns = {
    id: 'record_id',
    created_at: 'inserted_at',
    created_by: 'inserted_by',
    updated_at: 'modified_at',
    updated_by: 'modified_by',
    is_deleted: {
      name: 'is_removed',
      type: 'string',
      valTrue: '1',
      valFalse: '0'
    }
  };

  // Prepare table data matching the new config
  const customTables = [{
    tableName: 'custom_users',
    tableNameJP: 'CustomUsers',
    columns: [
      { colName: 'record_id', pkfk: 'PK', type: 'bigserial', constraint: 'NN' },
      { colName: 'user_name', type: 'varchar', length: '255', constraint: 'NN' },
      { colName: 'is_removed', type: 'boolean' }
    ]
  }];

  // --- Java Tests ---
  const modelFiles = generateJavaModel(customTables, {});
  const baseModel = modelFiles.find(f => f.path === 'models/BaseModel.java').content;
  const customModel = modelFiles.find(f => f.path === 'models/CustomUsers.java').content;

  // Check BaseModel
  if (!baseModel.includes('public Long recordId;')) throw new Error('Custom BaseModel should have recordId');
  if (!baseModel.includes('public String isRemoved = "0";')) {
    console.log(baseModel);
    throw new Error('Custom BaseModel should have isRemoved string = "0"');
  }

  // Check CustomUsers Model (Should NOT have duplicate fields)
  if (customModel.includes('public Long recordId;')) throw new Error('Child model should not duplicate recordId');

  console.log("PASS: Custom Config Model");

  // Check Repository
  const repoFiles = generateJavaRepo(customTables, {});
  const userRepo = repoFiles.find(f => f.path === 'repository/CustomUsersRepository.java').content;

  // Check findById
  if (!userRepo.includes('.eq("recordId", id)')) {
    console.log(userRepo);
    throw new Error('Repo findById should use recordId');
  }
  if (!userRepo.includes('.eq("isRemoved", "0")')) throw new Error('Repo findById should use isRemoved="0"');

  console.log("PASS: Custom Config Repo");

  // --- DDL Tests ---
  const ddlFiles = generateDDL(customTables);
  const ddlContent = ddlFiles[0].content;

  if (!ddlContent.includes('CREATE TABLE custom_users')) throw new Error('DDL should create custom_users table');
  if (!ddlContent.includes('record_id BIGSERIAL')) throw new Error('DDL should contain record_id column');
  if (!ddlContent.includes('is_removed BOOLEAN')) throw new Error('DDL should contain is_removed column');

  // Verify standard names are NOT present (unless specified)
  if (ddlContent.includes('is_deleted')) throw new Error('DDL should not contain is_deleted when input table uses is_removed');

  console.log("PASS: Custom Config DDL");
}

try {
  testDefaultConfig();
  testCustomConfig();
  console.log("ALL TESTS PASSED");
} catch (e) {
  console.error("TEST FAILED:", e.message);
  process.exit(1);
}
