package repository;

import io.ebean.DB;
import io.ebean.ExpressionList;
import models.User;
import models.SessionInfo;
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
public class UserRepository extends BaseRepository<User>{
    @Inject
    public UserRepository(DatabaseExecutionContext executionContext, SessionInfo sessionInfo) {
        super(executionContext, sessionInfo, User.class);
    }

    /**
     * IDで ユーザー を検索します（論理削除済みは除く）。
     * @param id 主キー
     * @return 検索結果
     */
    public CompletionStage<Optional<User>> findById(Long id) {
        return supplyAsync(() -> {
            ExpressionList<User> query = rlsFilter();
            return query.eq("id", id)
                .eq("isDeleted", false)
                .findOneOrEmpty();
        }, executionContext);
    }

    /**
     * ユーザー名 で ユーザー を検索します（論理削除済みは除く）。
     * @param userName ユーザー名
     * @return 検索結果
     */
    public CompletionStage<Optional<User>> findByUserName(String userName) {
        return supplyAsync(() -> {
            ExpressionList<User> query = rlsFilter();
            return query.eq("userName", userName)
                .eq("isDeleted", false)
                .findOneOrEmpty();
        }, executionContext);
    }

    /**
     * 全ての ユーザー を取得します（論理削除済みは除く）。
     * @return 全件リスト
     */
    public CompletionStage<List<User>> findAll() {
        return findAll(0, Integer.MAX_VALUE);
    }

    /**
     * 全ての ユーザー を取得します（論理削除済みは除く）。
     * @return 全件リスト
     */
    public CompletionStage<List<User>> findAll(int offset, int limit) {
        return supplyAsync(() ->
            rlsFilter()
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
            rlsFilter()
                .eq("isDeleted", false)
                .findCount()
        , executionContext);
    }

    /**
     * ユーザー を検索します（論理削除済みは除く）。
     * @param filter 検索条件
     * @return 検索結果リスト
     */
    public CompletionStage<List<User>> find(User filter) {
        return find(filter, 0, Integer.MAX_VALUE);
    }

    /**
     * ユーザー を検索します（論理削除済みは除く）。
     * @param filter 検索条件
     * @return 検索結果リスト
     */
    public CompletionStage<List<User>> find(User filter, int offset, int limit) {
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
    public CompletionStage<Integer> count(User filter) {
        return supplyAsync(() ->
            createQueryWithFilter(filter).findCount()
        , executionContext);
    }

    /**
     * 検索条件に基づいてクエリを構築します。
     * @param filter 検索条件
     * @return 構築されたクエリ
     */
    private io.ebean.ExpressionList<User> createQueryWithFilter(User filter) {
        io.ebean.ExpressionList<User> query = rlsFilter().eq("isDeleted", false);

        if (filter.getUserName() != null) {
            query.contains("userName", filter.getUserName());
        }
        if (filter.getEmail() != null) {
            query.contains("email", filter.getEmail());
        }
        if (filter.getNote() != null) {
            query.contains("note", filter.getNote());
        }
        if (filter.getIsAdmin() != null) {
            query.eq("isAdmin", filter.getIsAdmin());
        }
        if (filter.getDemartmentCode() != null) {
            query.contains("demartmentCode", filter.getDemartmentCode());
        }

        return query;
    }

    /**
     * ユーザー を新規登録します。
     * @param user 登録データ
     * @return 登録後のデータ
     */
    public CompletionStage<User> insert(User user) {
        return supplyAsync(() -> {
            DB.insert(user);
            return user;
        }, executionContext);
    }

    /**
     * ユーザー を一括で新規登録します。
     * @param users 登録データリスト
     * @return 登録件数
     */
    public CompletionStage<Integer> batchInsert(List<User> users) {
        return supplyAsync(() -> {
            DB.saveAll(users);
            return users.size();
        }, executionContext);
    }

    /**
     * ユーザー を更新します。
     * @param id 主キー
     * @param newData 更新データ
     * @param updatedAt タイムスタンプ
     * @return 更新後のデータ
     */
    public CompletionStage<User> update(Long id, User newData, Instant updatedAt) {
        return supplyAsync(() -> {
            newData.setId(id);
            int updatedRows = DB.update(User.class)
                .set("updatedAt", Instant.now())
                .set("userName", newData.getUserName())
                .set("email", newData.getEmail())
                .set("note", newData.getNote())
                .set("isAdmin", newData.getIsAdmin())
                .set("demartmentCode", newData.getDemartmentCode())
                .where().eq("id", id).eq("updatedAt", updatedAt)
                .update();

            if (updatedRows == 0) {
                throw new OptimisticLockingFailureException("User not found with id: " + id + " and updatedAt: " + updatedAt);
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
            int updatedRows = DB.update(User.class)
                .set("isDeleted", true)
                .set("updatedAt", Instant.now())
                .where().eq("id", id).eq("updatedAt", updatedAt)
                .update();

            if (updatedRows == 0) {
                throw new OptimisticLockingFailureException("User not found with id: " + id + " and updatedAt: " + updatedAt);
            }
            return null;
        }, executionContext);
    }
}