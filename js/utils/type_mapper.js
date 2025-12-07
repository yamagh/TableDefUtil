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
