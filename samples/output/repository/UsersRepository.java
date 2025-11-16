package repository;

import io.ebean.DB;
import models.Users;
import jakarta.persistence.EntityNotFoundException;
import javax.inject.Inject;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletionStage;

import static java.util.concurrent.CompletableFuture.supplyAsync;

/**
 * ユーザー のリポジトリ
 */
public class UsersRepository {
    private final DatabaseExecutionContext executionContext;

    @Inject
    public UsersRepository(DatabaseExecutionContext executionContext) {
        this.executionContext = executionContext;
    }

    /**
     * IDで ユーザー を検索します（論理削除済みは除く）。
     * @param id 主キー
     * @return 検索結果
     */
    public CompletionStage<Optional<Users>> findById(Long id) {
        return supplyAsync(() ->
            DB.find(Users.class)
                .where()
                .eq("id", id)
                .eq("isDeleted", false)
                .findOneOrEmpty()
        , executionContext);
    }

    /**
     * ユーザー名 で ユーザー を検索します（論理削除済みは除く）。
     * @param userName ユーザー名
     * @return 検索結果
     */
    public CompletionStage<Optional<Users>> findByUserName(String userName) {
        return supplyAsync(() ->
            DB.find(Users.class)
                .where()
                .eq("userName", userName)
                .eq("isDeleted", false)
                .findOneOrEmpty()
        , executionContext);
    }

    /**
     * 全ての ユーザー を取得します（論-理削除済みは除く）。
     * @return 全件リスト
     */
    public CompletionStage<List<Users>> findAll() {
        return findAll(0, Integer.MAX_VALUE);
    }

    /**
     * 全ての ユーザー を取得します（論-理削除済みは除く）。
     * @return 全件リスト
     */
    public CompletionStage<List<Users>> findAll(int offset, int limit) {
        return supplyAsync(() ->
            DB.find(Users.class)
                .where()
                .eq("isDeleted", false)
                .setFirstRow(offset)
                .setMaxRows(limit)
                .findList()
        , executionContext);
    }

    /**
     * 全ての ユーザー の件数を取得します（論理削除済みは除く）。
     * @return 件数
     */
    public CompletionStage<Integer> countAll() {
        return supplyAsync(() ->
            DB.find(Users.class)
                .where()
                .eq("isDeleted", false)
                .findCount()
        , executionContext);
    }

    /**
     * ユーザー を検索します（論理削除済みは除く）。
     * @param filter 検索条件
     * @return 検索結果リスト
     */
    public CompletionStage<List<Users>> find(Users filter) {
        return find(filter, 0, Integer.MAX_VALUE);
    }

    /**
     * ユーザー を検索します（論理削除済みは除く）。
     * @param filter 検索条件
     * @return 検索結果リスト
     */
    public CompletionStage<List<Users>> find(Users filter, int offset, int limit) {
        return supplyAsync(() ->
            createQueryWithFilter(filter)
                .setFirstRow(offset)
                .setMaxRows(limit)
                .findList()
        , executionContext);
    }

    /**
     * ユーザー の件数を検索条件に基づいて取得します（論理削除済みは除く）。
     * @param filter 検索条件
     * @return 件数
     */
    public CompletionStage<Integer> count(Users filter) {
        return supplyAsync(() ->
            createQueryWithFilter(filter).findCount()
        , executionContext);
    }

    /**
     * 検索条件に基づいてクエリを構築します。
     * @param filter 検索条件
     * @return 構築されたクエリ
     */
    private io.ebean.ExpressionList<Users> createQueryWithFilter(Users filter) {
        io.ebean.ExpressionList<Users> query = DB.find(Users.class).where().eq("isDeleted", false);

        if (filter.getUserName() != null) {
            query.contains("userName", filter.getUserName());
        }
        if (filter.getEmail() != null) {
            query.contains("email", filter.getEmail());
        }

        return query;
    }

    /**
     * ユーザー を新規登録します。
     * @param users 登録データ
     * @return 登録後のデータ
     */
    public CompletionStage<Users> insert(Users users) {
        return supplyAsync(() -> {
            DB.insert(users);
            return users;
        }, executionContext);
    }

    /**
     * ユーザー を一括で新規登録します。
     * @param userss 登録データリスト
     * @return 登録件数
     */
    public CompletionStage<Integer> batchInsert(List<Users> userss) {
        return supplyAsync(() -> {
            DB.saveAll(userss);
            return userss.size();
        }, executionContext);
    }

    /**
     * ユーザー を更新します。
     * @param id 主キー
     * @param newData 更新データ
     * @param updatedAt タイムスタンプ
     * @return 更新後のデータ
     */
    public CompletionStage<Users> update(Long id, Users newData, Instant updatedAt) {
        return supplyAsync(() -> {
            newData.setId(id);
            int updatedRows = DB.update(Users.class)
                .set("updatedAt", Instant.now())
                .set("userName", newData.getUserName())
                .set("email", newData.getEmail())
                .where().eq("id", id).eq("updatedAt", updatedAt)
                .update();

            if (updatedRows == 0) {
                throw new OptimisticLockingFailureException("Users not found with id: " + id + " and updatedAt: " + updatedAt);
            }
            return newData;
        }, executionContext);
    }

    /**
     * ユーザー を論理削除します。
     * @param id 主キー
     * @param updatedAt タイムスタンプ
     */
    public CompletionStage<Void> delete(Long id, Instant updatedAt) {
        return supplyAsync(() -> {
            int updatedRows = DB.update(Users.class)
                .set("isDeleted", true)
                .set("updatedAt", Instant.now())
                .where().eq("id", id).eq("updatedAt", updatedAt)
                .update();

            if (updatedRows == 0) {
                throw new OptimisticLockingFailureException("Users not found with id: " + id + " and updatedAt: " + updatedAt);
            }
            return null;
        }, executionContext);
    }
}