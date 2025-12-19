/**
 * Javaモデルクラス生成
 */
function generateJavaModel(tables, rlsOptions) {
  const config = (AppState.config && AppState.config.commonColumns) ? AppState.config.commonColumns : {
    id: 'id',
    is_deleted: { name: 'is_deleted', type: 'boolean', valTrue: true, valFalse: false },
    created_at: 'created_at',
    created_by: 'created_by',
    updated_at: 'updated_at',
    updated_by: 'updated_by'
  };

  const baseModelCols = new Set([
    config.id,
    config.is_deleted.name,
    config.created_at,
    config.created_by,
    config.updated_at,
    config.updated_by
  ]);
  const files = [];

  if (rlsOptions && rlsOptions.enabled) {
    const sessionInfoContent = `
package models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * RLS用のセッション情報
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfo {
    private boolean isAdmin;
    private String tenantId;
}
`;
    files.push({ path: 'models/SessionInfo.java', content: sessionInfoContent.trim() });

    const rlsAwareContent = `
package models;

/**
 * RLS対象のモデルであることを示すマーカーインターフェース
 */
public interface RlsAware {
    String getTenantId();
}
`;
    files.push({ path: 'models/RlsAware.java', content: rlsAwareContent.trim() });
  }


  let isDeletedField = '';
  if (config.is_deleted.type === 'string') {
    const defaultVal = config.is_deleted.valFalse !== undefined ? `"${config.is_deleted.valFalse}"` : '"0"';
    isDeletedField = `    public String ${toCamelCase(config.is_deleted.name)} = ${defaultVal};`;
  } else {
    isDeletedField = `    public Boolean ${toCamelCase(config.is_deleted.name)} = false;`;
  }

  const baseModelContent = `
package models;

import io.ebean.Model;
import io.ebean.annotation.WhenCreated;
import io.ebean.annotation.WhenModified;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/**
 * 全テーブル共通の項目を定義する基底モデル
 */
@MappedSuperclass
@Getter
@Setter
public class BaseModel extends Model {
    @Id
    public Long ${toCamelCase(config.id)};

    /**
     * 論理削除フラグ
     */
    ${isDeletedField}

    /**
     * 作成日時
     */
    @WhenCreated
    public Instant ${toCamelCase(config.created_at)};
    
    /** 
     * 作成者ID
     */
    public String ${toCamelCase(config.created_by)};

    /**
     * 更新日時
     */
    @WhenModified
    public Instant ${toCamelCase(config.updated_at)};
    
    /**
     * 更新者ID
     */
    public String ${toCamelCase(config.updated_by)};
}
`;
  files.push({ path: 'models/BaseModel.java', content: baseModelContent.trim() });

  tables.forEach(table => {
    const className = toPascalCase(table.tableName);
    const imports = new Set([
      'import io.ebean.Finder;',
      'import jakarta.persistence.Entity;',
      'import jakarta.persistence.Table;',
      'import lombok.Getter;',
      'import lombok.Setter;'
    ]);

    let fieldsContent = '';
    let implementsRls = false;
    let tenantIdGetter = '';

    table.columns.forEach(col => {
      if (baseModelCols.has(col.colName)) {
        return; // Skip columns defined in BaseModel
      }
      const fieldName = toCamelCase(col.colName);
      const javaType = mapPostgresToJavaType(col.type, col.length);

      if (rlsOptions && rlsOptions.enabled && col.colName === rlsOptions.tenantIdColumn) {
        implementsRls = true;
        tenantIdGetter = `
    @Override
    public String getTenantId() {
        return this.${fieldName};
    }
`;
      }

      let annotations = [];
      const isNotNull = col.constraint && col.constraint.includes('NN');

      if (isNotNull) {
        annotations.push('@NotNull');
        imports.add('import javax.validation.constraints.NotNull;');
      }

      // Numeric handling: Use @Digits
      if (['numeric', 'decimal'].includes(col.type.toLowerCase()) && col.length) {
        const parts = col.length.toString().replace(/[()]/g, '').split(',');
        const precision = parseInt(parts[0], 10);
        const scale = parts.length > 1 ? parseInt(parts[1], 10) : 0;

        if (!isNaN(precision)) {
          const integerPart = precision - scale;
          annotations.push(`@Digits(integer=${integerPart}, fraction=${scale})`);
          imports.add('import javax.validation.constraints.Digits;');
        }
      }
      // String handling: Use @Size
      else if (javaType === 'String') {
        const sizeAttributes = [];
        const excludeMinLength = ['description', 'note', 'remarks'].some(keyword => col.colName.toLowerCase().includes(keyword));
        if (isNotNull && !excludeMinLength) {
          sizeAttributes.push('min = 1');
        }
        if (col.length) {
          sizeAttributes.push(`max = ${col.length}`);
        }
        if (sizeAttributes.length > 0) {
          annotations.push(`@Size(${sizeAttributes.join(', ')})`);
          imports.add('import javax.validation.constraints.Size;');
        }
      }

      fieldsContent += `    /**\n     * ${col.colNameJP}\n     */\n`;
      if (annotations.length > 0) {
        fieldsContent += `    ${annotations.join('\n    ')}\n`;
      }
      fieldsContent += `    public ${javaType} ${fieldName};\n\n`;
    });

    let classContent = `package models;\n\n`;
    classContent += `${[...imports].sort().join('\n')}\n\n`;
    classContent += `/**\n * ${table.tableNameJP}\n */\n`;
    classContent += `@Entity\n@Getter\n@Setter\n`;
    classContent += `@Table(name = "${table.tableName}")\n`;

    let extendsPart = 'extends BaseModel';
    if (implementsRls) {
      extendsPart += ' implements RlsAware';
    }
    classContent += `public class ${className} ${extendsPart} {\n\n`;

    classContent += fieldsContent;

    if (implementsRls) {
      classContent += tenantIdGetter;
    }

    classContent += `    public static Finder<Long, ${className}> find = new Finder<>(${className}.class);\n`;
    classContent += `}\n`;

    files.push({ path: `models/${className}.java`, content: classContent });
  });

  return files;
}
