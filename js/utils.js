/**
 * ファイルダウンロード処理
 */
function downloadFile(content, fileName) {
  const blob = (content instanceof Blob) ? content : new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 文字列をPascalCaseに変換
 */
function toPascalCase(s) {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

/**
 * 文字列をcamelCaseに変換
 */
function toCamelCase(s) {
  const pascal = toPascalCase(s);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * PostgreSQLの型をTypeScriptの型にマッピング
 */
function mapPostgresToTsType(pgType) {
  pgType = pgType.toLowerCase();
  if (['bigint', 'bigserial', 'integer', 'smallint', 'numeric', 'decimal'].includes(pgType)) {
    return 'number';
  }
  if (['varchar', 'char', 'text', 'bytea', 'bit'].includes(pgType)) {
    return 'string';
  }
  if (['boolean'].includes(pgType)) {
    return 'boolean';
  }
  if (['date', 'time', 'timestamp'].includes(pgType)) {
    return 'string';
  }
  return 'any';
}

/**
 * PostgreSQLの型をJavaの型にマッピング
 */
function mapPostgresToJavaType(pgType) {
  pgType = pgType.toLowerCase();
  if (['bigserial', 'bigint'].includes(pgType)) return 'Long';
  if (['integer', 'smallint'].includes(pgType)) return 'Integer';
  if (['varchar', 'char', 'text', 'bit'].includes(pgType)) return 'String';
  if (['boolean'].includes(pgType)) return 'Boolean';
  if (['timestamp', 'date', 'time'].includes(pgType)) return 'java.time.Instant';
  if (['bytea'].includes(pgType)) return 'byte[]';
  return 'Object';
}
