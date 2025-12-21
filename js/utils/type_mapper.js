// Initialize Namespace
window.App = window.App || {};
App.Utils = App.Utils || {};

App.Utils.TypeMapper = {
  /**
   * PostgreSQLの型をTypeScriptの型にマッピング
   */
  mapPostgresToTsType: function(pgType) {
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
  },

  /**
   * PostgreSQLの型をJavaの型にマッピング
   */
  mapPostgresToJavaType: function(pgType, length) {
    pgType = pgType.toLowerCase();

    // Numeric の扱い
    if (['numeric', 'decimal'].includes(pgType)) {
      if (!length) return 'java.math.BigDecimal';

      // 長さの解析 (例: "10,2" または "10")
      const parts = length.toString().replace(/[()]/g, '').split(',');
      const precision = parseInt(parts[0], 10);
      const scale = parts.length > 1 ? parseInt(parts[1], 10) : 0;

      if (isNaN(precision)) return 'java.math.BigDecimal';

      // 10桁未満は Integer, 10桁以上18桁未満は Long, それ以上は BigDecimal
      if (scale === 0) {
        if (precision <= 9) return 'Integer';
        if (precision <= 18) return 'Long';
      }
      return 'java.math.BigDecimal';
    }

    if (['bigserial', 'bigint'].includes(pgType)) return 'Long';
    if (['integer', 'smallint'].includes(pgType)) return 'Integer';
    if (['varchar', 'char', 'text', 'bit'].includes(pgType)) return 'String';
    if (['boolean'].includes(pgType)) return 'Boolean';
    if (['timestamp', 'date'].includes(pgType)) return 'java.time.Instant';
    if (['time'].includes(pgType)) return 'java.time.LocalTime';
    if (['bytea'].includes(pgType)) return 'byte[]';
    return 'Object';
  }
};

// Backward compat
window.mapPostgresToTsType = App.Utils.TypeMapper.mapPostgresToTsType;
window.mapPostgresToJavaType = App.Utils.TypeMapper.mapPostgresToJavaType;
