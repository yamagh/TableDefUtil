/**
 * Zodスキーマ生成
 */
function generateZodSchema(tables) {
  const mapPostgresToZod = (col) => {
    const pgType = col.type.toLowerCase();
    let zodType;

    if (['bigint', 'bigserial', 'integer', 'smallint', 'numeric', 'decimal'].includes(pgType)) {
      zodType = 'z.number()';
    } else if (['varchar', 'char', 'text', 'bytea', 'bit'].includes(pgType)) {
      zodType = 'z.string()';
      const isNotNull = col.constraint && col.constraint.includes('NN');
      const excludeMinLength = ['description', 'note', 'remarks'].some(keyword => col.colName.toLowerCase().includes(keyword));

      if (isNotNull && !excludeMinLength) {
        zodType += '.min(1)';
      }
      if (col.length) {
        zodType += `.max(${col.length})`;
      }
    } else if (['boolean'].includes(pgType)) {
      zodType = 'z.boolean()';
    } else if (['date', 'time', 'timestamp'].includes(pgType)) {
      zodType = 'z.iso.datetime()';
    } else {
      zodType = 'z.any()';
    }

    if (col.constraint && !col.constraint.includes('NN')) {
      zodType += '.optional()';
    }
    if (col.default) {
      // 簡略化のため。Zodのデフォルト値は型と一致する必要がある
      // 現時点ではコメントを追加するのみ
      // zodType += `.default(${col.default})`;
    }
    if (col.colNameJP) {
      zodType += `.describe('${col.colNameJP}')`;
    }

    return zodType;
  };

  let zodString = `import { z } from 'zod';\n\n`;
  tables.forEach(table => {
    const schemaName = `${toPascalCase(table.tableName)}Schema`;
    zodString += `/**\n * ${table.tableNameJP}\n */\n`;
    zodString += `export const ${schemaName} = z.object({\n`;

    table.columns.forEach(col => {
      const propName = toCamelCase(col.colName);
      const zodType = mapPostgresToZod(col);
      zodString += `  ${propName}: ${zodType},\n`;
    });

    zodString += '});\n\n';
  });

  return [{ path: 'schemas.ts', content: zodString }];
}

/**
 * Zod型定義生成
 */
function generateZodType(tables) {
  let typeString = `import { z } from 'zod';\n`;
  typeString += `import { `;

  const schemaNames = tables.map(table => `${toPascalCase(table.tableName)}Schema`);
  typeString += schemaNames.join(', ');

  typeString += ` } from './schemas'; // schemasがschemas.tsというファイルにあると仮定\n\n`;

  tables.forEach(table => {
    const typeName = toPascalCase(table.tableName);
    const schemaName = `${typeName}Schema`;
    typeString += `/**\n * @type ${typeName} ${table.tableNameJP}\n */\n`;
    typeString += `export type ${typeName} = z.infer<typeof ${schemaName}>;\n\n`;
  });

  return [{ path: 'zod-types.ts', content: typeString }];
}
