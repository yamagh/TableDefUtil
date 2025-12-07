/**
 * Javaモデルクラス生成
 */
function generateJavaModel(tables, rlsOptions) {
  const baseModelCols = new Set(['id', 'is_deleted', 'created_at', 'created_by', 'updated_at', 'updated_by']);
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
    public Long id;

    /**
     * 論理削除フラグ
     */
    public Boolean isDeleted = false;

    /**
     * 作成日時
     */
    @WhenCreated
    public Instant createdAt;
    
    /** 
     * 作成者ID
     */
    public String createdBy;

    /**
     * 更新日時
     */
    @WhenModified
    public Instant updatedAt;
    
    /**
     * 更新者ID
     */
    public String updatedBy;
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
      const javaType = mapPostgresToJavaType(col.type);

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

      const sizeAttributes = [];
      const excludeMinLength = ['description', 'note', 'remarks'].some(keyword => col.colName.toLowerCase().includes(keyword));
      if (javaType === 'String' && isNotNull && !excludeMinLength) {
        sizeAttributes.push('min = 1');
      }
      if (col.length) {
        sizeAttributes.push(`max = ${col.length}`);
      }
      if (sizeAttributes.length > 0) {
        annotations.push(`@Size(${sizeAttributes.join(', ')})`);
        imports.add('import javax.validation.constraints.Size;');
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
