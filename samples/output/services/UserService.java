package services;

import com.fasterxml.jackson.databind.node.ObjectNode;
import models.User;
import play.libs.Json;
import repository.UserRepository;
import javax.inject.Inject;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletionStage;
import java.util.stream.Collectors;
import static java.util.concurrent.CompletableFuture.supplyAsync;

/**
 * ユーザー のサービス
 */
public class UserService {
    private final UserRepository userRepository;

    @Inject
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public CompletionStage<ObjectNode> find() {
        return find(0, Integer.MAX_VALUE);
    }

    /**
     * ユーザー のリストをJSONで取得します。
     * @return JSON形式の検索結果
     */
    public CompletionStage<ObjectNode> find(int offset, int limit) {
        CompletionStage<Integer> totalFuture = userRepository.countAll();
        CompletionStage<List<User>> dataFuture = userRepository.findAll(offset, limit);
        return totalFuture.thenCombine(dataFuture, (total, data) -> {
            ObjectNode result = Json.newObject();
            result.put("total", total);
            result.set("data", Json.toJson(data));
            return result;
        });
    }

    public CompletionStage<ObjectNode> find(User filter) {
        return find(filter, 0, Integer.MAX_VALUE);
    }

    /**
     * ユーザー を検索し、リストをJSONで取得します。
     * @param filter 検索条件
     * @return JSON形式の検索結果
     */
    public CompletionStage<ObjectNode> find(User filter, int offset, int limit) {
        CompletionStage<Integer> totalFuture = userRepository.count(filter);
        CompletionStage<List<User>> dataFuture = userRepository.find(filter, offset, limit);
        return totalFuture.thenCombine(dataFuture, (total, data) -> {
            ObjectNode result = Json.newObject();
            result.put("total", total);
            result.set("data", Json.toJson(data));
            return result;
        });
    }

    /**
     * IDで ユーザー を検索します。
     * @param id 主キー
     * @return 検索結果
     */
    public CompletionStage<Optional<User>> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * ユーザー を新規登録します。
     * @param user 登録データ
     * @return 登録後のデータ
     */
    public CompletionStage<User> create(User user) {
        return userRepository.insert(user);
    }

    /**
     * ユーザー を更新します。
     * @param id 主キー
     * @param user 更新データ
     * @return 更新後のデータ
     */
    public CompletionStage<User> update(Long id, User user) {
        return userRepository.update(id, user, user.getUpdatedAt());
    }

    /**
     * ユーザー を論理削除します。
     * @param id 主キー
     * @param updatedAt タイムスタンプ
     */
    public CompletionStage<Void> delete(Long id, Instant updatedAt) {
        return userRepository.delete(id, updatedAt);
    }

    /**
     * ユーザー のデータをCSVファイルとしてエクスポートします。
     * @param filter 検索条件
     * @return 生成されたCSVファイル
     */
    public CompletionStage<File> exportCsv(User filter) {
        return userRepository.find(filter, 0, Integer.MAX_VALUE).thenApply(list -> {
            try {
                File file = Files.createTempFile("user_", ".csv").toFile();
                try (PrintWriter writer = new PrintWriter(Files.newBufferedWriter(file.toPath()))) {
                    writer.printf("%s,%s,%s,%s,%s,%s,%s\n","ユーザー名","メールアドレス","説明","管理者フラグ","部署コード","削除フラグ","作成日時");
                    for (User m : list) {
                        writer.printf("%s,%s,%s,%s,%s,%s,%s\n",String.valueOf(m.getUserName()),String.valueOf(m.getEmail()),String.valueOf(m.getNote()),String.valueOf(m.getIsAdmin()),String.valueOf(m.getDemartmentCode()),String.valueOf(m.getIsDeleted()),String.valueOf(m.getCreatedAt()));
                    }
                }
                return file;
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }

    /**
     * CSVファイルから ユーザー のデータを取り込みます。
     * @param csvFile 取り込むCSVファイル
     * @return 取り込み件数
     */
    public CompletionStage<Integer> importCsv(File csvFile) {
        return supplyAsync(() -> {
            try {
                List<User> models = Files.lines(csvFile.toPath())
                    .skip(1) // Skip header
                    .map(line -> line.split(","))
                    .map(values -> {
                        User model = new User();
                        if (values.length > 0 && !values[0].isEmpty()) model.setUserName(values[0]);
                        if (values.length > 1 && !values[1].isEmpty()) model.setEmail(values[1]);
                        if (values.length > 2 && !values[2].isEmpty()) model.setNote(values[2]);
                        if (values.length > 3 && !values[3].isEmpty()) model.setIsAdmin(Boolean.parseBoolean(values[3]));
                        if (values.length > 4 && !values[4].isEmpty()) model.setDemartmentCode(values[4]);
                        if (values.length > 5 && !values[5].isEmpty()) model.setIsDeleted(Boolean.parseBoolean(values[5]));
                        if (values.length > 6 && !values[6].isEmpty()) model.setCreatedAt(Instant.parse(values[6]));
                        return model;
                    })
                    .collect(Collectors.toList());

                return userRepository.batchInsert(models).toCompletableFuture().join();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }
}