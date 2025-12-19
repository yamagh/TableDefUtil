/**
 * Javaリポジトリクラス生成
 */
function generateJavaRepo(tables, rlsOptions) {
  const config = (AppState.config && AppState.config.commonColumns) ? AppState.config.commonColumns : {
    id: 'id',
    is_deleted: { name: 'is_deleted', type: 'boolean', valTrue: true, valFalse: false },
    created_at: 'created_at',
    created_by: 'created_by',
    updated_at: 'updated_at',
    updated_by: 'updated_by'
  };

  const idProp = toCamelCase(config.id);
  const isDeletedProp = toCamelCase(config.is_deleted.name);
  const updatedAtProp = toCamelCase(config.updated_at);

  const isDeletedTrueVal = config.is_deleted.type === 'string' ? `"${config.is_deleted.valTrue}"` : 'true';
  const isDeletedFalseVal = config.is_deleted.type === 'string' ? `"${config.is_deleted.valFalse}"` : 'false';

  const baseModelCols = new Set([
    config.id,
    config.is_deleted.name,
    config.created_at,
    config.created_by,
    config.updated_at,
    config.updated_by
  ]);
  const files = [];

  const exceptionContent = `
package repository;

/**
 * 楽観的ロック失敗時にスローされる例外
 */
public class OptimisticLockingFailureException extends RuntimeException {
    public OptimisticLockingFailureException(String message) {
        super(message);
    }
}
`;
  files.push({ path: 'repository/OptimisticLockingFailureException.java', content: exceptionContent.trim() });

  if (rlsOptions && rlsOptions.enabled) {
    const baseRepoContent = `
package repository;

import io.ebean.DB;
import io.ebean.ExpressionList;
import models.BaseModel;
import models.RlsAware;
import models.SessionInfo;
import javax.inject.Inject;

/**
 * RLSフィルタリング機能を提供する基底リポジトリ
 * @param <T> モデルの型
 */
public abstract class BaseRepository<T extends BaseModel> {

    protected final DatabaseExecutionContext executionContext;
    protected final SessionInfo sessionInfo;
    private final Class<T> beanType;

    @Inject
    public BaseRepository(DatabaseExecutionContext executionContext, SessionInfo sessionInfo, Class<T> beanType) {
        this.executionContext = executionContext;
        this.sessionInfo = sessionInfo;
        this.beanType = beanType;
    }

    /**
     * RLSフィルタを適用した検索クエリを返します。
     * @return RLSフィルタ適用後の ExpressionList
     */
    protected ExpressionList<T> rlsFilter() {
        ExpressionList<T> query = DB.find(beanType).where();

        if (sessionInfo != null && !sessionInfo.isAdmin() && RlsAware.class.isAssignableFrom(beanType)) {
            query.eq("${toCamelCase(rlsOptions.tenantIdColumn)}", sessionInfo.getTenantId());
        }
        return query;
    }
}
`;
    files.push({ path: 'repository/BaseRepository.java', content: baseRepoContent.trim() });
  }


  tables.forEach(table => {
    const modelName = toPascalCase(table.tableName);
    const repoName = `${modelName}Repository`;
    const modelVar = toCamelCase(modelName);
    const akColumns = table.columns.filter(c => c.pkfk === 'AK');
    const hasTenantId = table.columns.some(c => c.colName === (rlsOptions && rlsOptions.tenantIdColumn));
    const extendsBaseRepo = rlsOptions && rlsOptions.enabled;


    let classContent = `package repository;\n\n`;
    classContent += `import io.ebean.DB;\n`;
    classContent += `import io.ebean.ExpressionList;\n`;
    classContent += `import models.${modelName};\n`;
    if (extendsBaseRepo) {
      classContent += `import models.SessionInfo;\n`;
    }
    classContent += `import jakarta.persistence.EntityNotFoundException;\n`;
    classContent += `import javax.inject.Inject;\n`;
    classContent += `import java.time.Instant;\n`;
    classContent += `import java.util.List;\n`;
    classContent += `import java.util.Optional;\n`;
    classContent += `import java.util.concurrent.CompletionStage;\n\n`;
    classContent += `import static java.util.concurrent.CompletableFuture.supplyAsync;\n\n`;

    classContent += `/**\n * ${table.tableNameJP} のリポジトリ\n */\n`;
    classContent += `public class ${repoName} ${extendsBaseRepo ? `extends BaseRepository<${modelName}>` : ''}{\n`;

    if (!extendsBaseRepo) {
      classContent += `    private final DatabaseExecutionContext executionContext;\n\n`;
    }

    classContent += `    @Inject\n`;
    if (extendsBaseRepo) {
      classContent += `    public ${repoName}(DatabaseExecutionContext executionContext, SessionInfo sessionInfo) {\n`;
      classContent += `        super(executionContext, sessionInfo, ${modelName}.class);\n`;
    } else {
      classContent += `    public ${repoName}(DatabaseExecutionContext executionContext) {\n`;
      classContent += `        this.executionContext = executionContext;\n`;
    }
    classContent += `    }\n\n`;

    // findById
    classContent += `    /**\n     * IDで ${table.tableNameJP} を検索します（論理削除済みは除く）。\n     * @param id 主キー\n     * @return 検索結果\n     */\n`;
    classContent += `    public CompletionStage<Optional<${modelName}>> findById(Long id) {\n`;
    classContent += `        return supplyAsync(() -> {\n`;
    classContent += `            ExpressionList<${modelName}> query = ${extendsBaseRepo ? 'rlsFilter()' : `DB.find(${modelName}.class).where()`};\n`;
    classContent += `            return query.eq("${idProp}", id)\n`;
    classContent += `                .eq("${isDeletedProp}", ${isDeletedFalseVal})\n`;
    classContent += `                .findOneOrEmpty();\n`;
    classContent += `        }, executionContext);\n`;
    classContent += `    }\n\n`;

    // findBy Unique Columns
    const uniqueColumns = table.columns.filter(c => (c.pkfk === 'AK' || (c.constraint && c.constraint.includes('U'))) && c.pkfk !== 'PK');
    const uniqueColNames = new Set();

    uniqueColumns.forEach(col => {
      if (uniqueColNames.has(col.colName)) return;
      uniqueColNames.add(col.colName);

      const colCamel = toCamelCase(col.colName);
      const colPascal = toPascalCase(col.colName);
      const colType = mapPostgresToJavaType(col.type);
      classContent += `    /**\n     * ${col.colNameJP} で ${table.tableNameJP} を検索します（論理削除済みは除く）。\n     * @param ${colCamel} ${col.colNameJP}\n     * @return 検索結果\n     */\n`;
      classContent += `    public CompletionStage<Optional<${modelName}>> findBy${colPascal}(${colType} ${colCamel}) {\n`;
      classContent += `        return supplyAsync(() -> {\n`;
      classContent += `            ExpressionList<${modelName}> query = ${extendsBaseRepo ? 'rlsFilter()' : `DB.find(${modelName}.class).where()`};\n`;
      classContent += `            return query.eq("${colCamel}", ${colCamel})\n`;
      classContent += `                .eq("${isDeletedProp}", ${isDeletedFalseVal})\n`;
      classContent += `                .findOneOrEmpty();\n`;
      classContent += `        }, executionContext);\n`;
      classContent += `    }\n\n`;
    });

    // findAll
    classContent += `    /**\n     * 全ての ${table.tableNameJP} を取得します（論理削除済みは除く）。\n     * @return 全件リスト\n     */\n`;
    classContent += `    public CompletionStage<List<${modelName}>> findAll() {\n`;
    classContent += `        return findAll(0, Integer.MAX_VALUE);\n`;
    classContent += `    }\n\n`;

    // findAll
    classContent += `    /**\n     * 全ての ${table.tableNameJP} を取得します（論理削除済みは除く）。\n     * @return 全件リスト\n     */\n`;
    classContent += `    public CompletionStage<List<${modelName}>> findAll(int offset, int limit) {\n`;
    classContent += `        return supplyAsync(() ->\n`;
    classContent += `            ${extendsBaseRepo ? 'rlsFilter()' : `DB.find(${modelName}.class).where()`}\n`;
    classContent += `                .eq("${isDeletedProp}", ${isDeletedFalseVal})\n`;
    classContent += `                .setFirstRow(offset)\n`;
    classContent += `                .setMaxRows(limit)\n`;
    classContent += `                .findList()\n`;
    classContent += `        , executionContext);\n`;
    classContent += `    }\n\n`;

    classContent += `    /**\n     * 全ての ${table.tableNameJP} の件数を取得します（論理削除済みは除く）。\n     * @return 件数\n     */\n`;
    classContent += `    public CompletionStage<Integer> countAll() {\n`;
    classContent += `        return supplyAsync(() ->\n`;
    classContent += `            ${extendsBaseRepo ? 'rlsFilter()' : `DB.find(${modelName}.class).where()`}\n`;
    classContent += `                .eq("${isDeletedProp}", ${isDeletedFalseVal})\n`;
    classContent += `                .findCount()\n`;
    classContent += `        , executionContext);\n`;
    classContent += `    }\n\n`;

    // find (with filter)
    classContent += `    /**\n     * ${table.tableNameJP} を検索します（論理削除済みは除く）。\n     * @param filter 検索条件\n     * @return 検索結果リスト\n     */\n`;
    classContent += `    public CompletionStage<List<${modelName}>> find(${modelName} filter) {\n`;
    classContent += `        return find(filter, 0, Integer.MAX_VALUE);\n`;
    classContent += `    }\n\n`;

    // find (with filter)
    classContent += `    /**\n     * ${table.tableNameJP} を検索します（論理削除済みは除く）。\n     * @param filter 検索条件\n     * @return 検索結果リスト\n     */\n`;
    classContent += `    public CompletionStage<List<${modelName}>> find(${modelName} filter, int offset, int limit) {\n`;
    classContent += `        return supplyAsync(() ->\n`;
    classContent += `            createQueryWithFilter(filter)\n`;
    classContent += `                .setFirstRow(offset)\n`;
    classContent += `                .setMaxRows(limit)\n`;
    classContent += `                .findList()\n`;
    classContent += `        , executionContext);\n`;
    classContent += `    }\n\n`;

    classContent += `    /**\n     * ${table.tableNameJP} の件数を検索条件に基づいて取得します（論理削除済みは除く）。\n     * @param filter 検索条件\n     * @return 件数\n     */\n`;
    classContent += `    public CompletionStage<Integer> count(${modelName} filter) {\n`;
    classContent += `        return supplyAsync(() ->\n`;
    classContent += `            createQueryWithFilter(filter).findCount()\n`;
    classContent += `        , executionContext);\n`;
    classContent += `    }\n\n`;

    classContent += `    /**\n     * 検索条件に基づいてクエリを構築します。\n     * @param filter 検索条件\n     * @return 構築されたクエリ\n     */\n`;
    classContent += `    private io.ebean.ExpressionList<${modelName}> createQueryWithFilter(${modelName} filter) {\n`;
    classContent += `        io.ebean.ExpressionList<${modelName}> query = ${extendsBaseRepo ? 'rlsFilter()' : `DB.find(${modelName}.class).where()`}.eq("${isDeletedProp}", ${isDeletedFalseVal});\n\n`;
    table.columns.forEach(col => {
      if (!baseModelCols.has(col.colName)) {
        const colCamel = toCamelCase(col.colName);
        const colPascal = toPascalCase(col.colName);
        const javaType = mapPostgresToJavaType(col.type);
        classContent += `        if (filter.get${colPascal}() != null) {\n`;
        if (javaType === 'String') {
          classContent += `            query.contains("${colCamel}", filter.get${colPascal}());\n`;
        } else {
          classContent += `            query.eq("${colCamel}", filter.get${colPascal}());\n`;
        }
        classContent += `        }\n`;
      }
    });
    classContent += `\n        return query;\n`;
    classContent += `    }\n\n`;

    // insert
    classContent += `    /**\n     * ${table.tableNameJP} を新規登録します。\n     * @param ${modelVar} 登録データ\n     * @return 登録後のデータ\n     */\n`;
    classContent += `    public CompletionStage<${modelName}> insert(${modelName} ${modelVar}) {\n`;
    classContent += `        return supplyAsync(() -> {\n`;
    classContent += `            DB.insert(${modelVar});\n`;
    classContent += `            return ${modelVar};\n`;
    classContent += `        }, executionContext);\n`;
    classContent += `    }\n\n`;

    // batchInsert
    classContent += `    /**\n     * ${table.tableNameJP} を一括で新規登録します。\n     * @param ${modelVar}s 登録データリスト\n     * @return 登録件数\n     */\n`;
    classContent += `    public CompletionStage<Integer> batchInsert(List<${modelName}> ${modelVar}s) {\n`;
    classContent += `        return supplyAsync(() -> {\n`;
    classContent += `            DB.saveAll(${modelVar}s);\n`;
    classContent += `            return ${modelVar}s.size();\n`;
    classContent += `        }, executionContext);\n`;
    classContent += `    }\n\n`;

    // update
    classContent += `    /**\n     * ${table.tableNameJP} を更新します。\n     * @param id 主キー\n     * @param newData 更新データ\n     * @param updatedAt タイムスタンプ\n     * @return 更新後のデータ\n     */\n`;
    classContent += `    public CompletionStage<${modelName}> update(Long id, ${modelName} newData, Instant updatedAt) {\n`;
    classContent += `        return supplyAsync(() -> {\n`;
    classContent += `            newData.set${toPascalCase(config.id)}(id);\n`;
    classContent += `            int updatedRows = DB.update(${modelName}.class)\n`;
    classContent += `                .set("${updatedAtProp}", Instant.now())\n`;
    table.columns.forEach(col => {
      if (!baseModelCols.has(col.colName)) {
        const colCamel = toCamelCase(col.colName);
        const colPascal = toPascalCase(col.colName);
        classContent += `                .set("${colCamel}", newData.get${colPascal}())\n`;
      }
    });
    classContent += `                .where().eq("${idProp}", id).eq("${updatedAtProp}", updatedAt)\n`;
    classContent += `                .update();\n\n`;
    classContent += `            if (updatedRows == 0) {\n`;
    classContent += `                throw new OptimisticLockingFailureException("${modelName} not found with id: " + id + " and updatedAt: " + updatedAt);\n`;
    classContent += `            }\n`;
    classContent += `            return newData;\n`;
    classContent += `        }, executionContext);\n`;
    classContent += `    }\n\n`;

    // delete (logical)
    classContent += `    /**\n     * ${table.tableNameJP} を論理削除します。\n     * @param id 主キー\n     * @param updatedAt タイムスタンプ\n     */\n`;
    classContent += `    public CompletionStage<Void> delete(Long id, Instant updatedAt) {\n`;
    classContent += `        return supplyAsync(() -> {\n`;
    classContent += `            int updatedRows = DB.update(${modelName}.class)\n`;
    classContent += `                .set("${isDeletedProp}", ${isDeletedTrueVal})\n`;
    classContent += `                .set("${updatedAtProp}", Instant.now())\n`;
    classContent += `                .where().eq("${idProp}", id).eq("${updatedAtProp}", updatedAt)\n`;
    classContent += `                .update();\n\n`;
    classContent += `            if (updatedRows == 0) {\n`;
    classContent += `                throw new OptimisticLockingFailureException("${modelName} not found with id: " + id + " and updatedAt: " + updatedAt);\n`;
    classContent += `            }\n`;
    classContent += `            return null;\n`;
    classContent += `        }, executionContext);\n`;
    classContent += `    }\n`;

    classContent += `}\n`;
    files.push({ path: `repository/${repoName}.java`, content: classContent });
  });

  return files;
}
