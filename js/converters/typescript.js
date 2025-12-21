// Initialize Namespace
window.App = window.App || {};
App.Converters = App.Converters || {};

App.Converters.Typescript = {
  /**
   * TypeScript型定義生成
   */
  generateTypeScript(tables) {
    let tsString = '';
    tables.forEach(table => {
      const typeName = toPascalCase(table.tableName);
      tsString += `/**\n * @type ${typeName} ${table.tableNameJP}\n */\n`;
      tsString += `export type ${typeName} = {\n`;

      table.columns.forEach(col => {
        const propName = toCamelCase(col.colName);
        const tsType = mapPostgresToTsType(col.type);
        tsString += `  /** ${col.colNameJP} */\n`;
        // 柔軟性のため、すべてのプロパティをオプショナルにする
        tsString += `  ${propName}?: ${tsType};\n`;
      });

      tsString += '};\n\n';
    });

    return [{ path: 'entities.ts', content: tsString }];
  }
};

// Backward compat
window.generateTypeScript = App.Converters.Typescript.generateTypeScript;
