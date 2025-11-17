package repository;

import io.ebean.DB;
import io.ebean.ExpressionList;
import models.Department;
import models.SessionInfo;
import jakarta.persistence.EntityNotFoundException;
import javax.inject.Inject;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletionStage;

import static java.util.concurrent.CompletableFuture.supplyAsync;

/**
 * 部署 のリポジトリ
 */
public class DepartmentRepository extends BaseRepository<Department>{
    @Inject
    public DepartmentRepository(DatabaseExecutionContext executionContext, SessionInfo sessionInfo) {
        super(executionContext, sessionInfo, Department.class);
    }

    /**
     * IDで 部署 を検索します（論理削除済みは除く）。
     * @param id 主キー
     * @return 検索結果
     */
    public CompletionStage<Optional<Department>> findById(Long id) {
        return supplyAsync(() -> {
            ExpressionList<Department> query = rlsFilter();
            return query.eq("id", id)
                .eq("isDeleted", false)
                .findOneOrEmpty();
        }, executionContext);
    }

    /**
     * 部署コード で 部署 を検索します（論理削除済みは除く）。
     * @param code 部署コード
     * @return 検索結果
     */
    public CompletionStage<Optional<Department>> findByCode(String code) {
        return supplyAsync(() -> {
            ExpressionList<Department> query = rlsFilter();
            return query.eq("code", code)
                .eq("isDeleted", false)
                .findOneOrEmpty();
        }, executionContext);
    }

    /**
     * 全ての 部署 を取得します（論理削除済みは除く）。
     * @return 全件リスト
     */
    public CompletionStage<List<Department>> findAll() {
        return findAll(0, Integer.MAX_VALUE);
    }

    /**
     * 全ての 部署 を取得します（論理削除済みは除く）。
     * @return 全件リスト
     */
    public CompletionStage<List<Department>> findAll(int offset, int limit) {
        return supplyAsync(() ->
            rlsFilter()
                .eq("isDeleted", false)
                .setFirstRow(offset)
                .setMaxRows(limit)
                .findList()
        , executionContext);
    }

    /**
     * 全ての 部署 の件数を取得します（論理削除済みは除く）。
     * @return 件数
     */
    public CompletionStage<Integer> countAll() {
        return supplyAsync(() ->
            rlsFilter()
                .eq("isDeleted", false)
                .findCount()
        , executionContext);
    }

    /**
     * 部署 を検索します（論理削除済みは除く）。
     * @param filter 検索条件
     * @return 検索結果リスト
     */
    public CompletionStage<List<Department>> find(Department filter) {
        return find(filter, 0, Integer.MAX_VALUE);
    }

    /**
     * 部署 を検索します（論理削除済みは除く）。
     * @param filter 検索条件
     * @return 検索結果リスト
     */
    public CompletionStage<List<Department>> find(Department filter, int offset, int limit) {
        return supplyAsync(() ->
            createQueryWithFilter(filter)
                .setFirstRow(offset)
                .setMaxRows(limit)
                .findList()
        , executionContext);
    }

    /**
     * 部署 の件数を検索条件に基づいて取得します（論理削除済みは除く）。
     * @param filter 検索条件
     * @return 件数
     */
    public CompletionStage<Integer> count(Department filter) {
        return supplyAsync(() ->
            createQueryWithFilter(filter).findCount()
        , executionContext);
    }

    /**
     * 検索条件に基づいてクエリを構築します。
     * @param filter 検索条件
     * @return 構築されたクエリ
     */
    private io.ebean.ExpressionList<Department> createQueryWithFilter(Department filter) {
        io.ebean.ExpressionList<Department> query = rlsFilter().eq("isDeleted", false);

        if (filter.getCode() != null) {
            query.contains("code", filter.getCode());
        }
        if (filter.getDescription() != null) {
            query.contains("description", filter.getDescription());
        }
        if (filter.getName() != null) {
            query.contains("name", filter.getName());
        }

        return query;
    }

    /**
     * 部署 を新規登録します。
     * @param department 登録データ
     * @return 登録後のデータ
     */
    public CompletionStage<Department> insert(Department department) {
        return supplyAsync(() -> {
            DB.insert(department);
            return department;
        }, executionContext);
    }

    /**
     * 部署 を一括で新規登録します。
     * @param departments 登録データリスト
     * @return 登録件数
     */
    public CompletionStage<Integer> batchInsert(List<Department> departments) {
        return supplyAsync(() -> {
            DB.saveAll(departments);
            return departments.size();
        }, executionContext);
    }

    /**
     * 部署 を更新します。
     * @param id 主キー
     * @param newData 更新データ
     * @param updatedAt タイムスタンプ
     * @return 更新後のデータ
     */
    public CompletionStage<Department> update(Long id, Department newData, Instant updatedAt) {
        return supplyAsync(() -> {
            newData.setId(id);
            int updatedRows = DB.update(Department.class)
                .set("updatedAt", Instant.now())
                .set("code", newData.getCode())
                .set("description", newData.getDescription())
                .set("name", newData.getName())
                .where().eq("id", id).eq("updatedAt", updatedAt)
                .update();

            if (updatedRows == 0) {
                throw new OptimisticLockingFailureException("Department not found with id: " + id + " and updatedAt: " + updatedAt);
            }
            return newData;
        }, executionContext);
    }

    /**
     * 部署 を論理削除します。
     * @param id 主キー
     * @param updatedAt タイムスタンプ
     */
    public CompletionStage<Void> delete(Long id, Instant updatedAt) {
        return supplyAsync(() -> {
            int updatedRows = DB.update(Department.class)
                .set("isDeleted", true)
                .set("updatedAt", Instant.now())
                .where().eq("id", id).eq("updatedAt", updatedAt)
                .update();

            if (updatedRows == 0) {
                throw new OptimisticLockingFailureException("Department not found with id: " + id + " and updatedAt: " + updatedAt);
            }
            return null;
        }, executionContext);
    }
}