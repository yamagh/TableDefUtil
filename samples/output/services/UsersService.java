package services;

import com.fasterxml.jackson.databind.node.ObjectNode;
import models.Users;
import play.libs.Json;
import repository.UsersRepository;
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
public class UsersService {
    private final UsersRepository usersRepository;

    @Inject
    public UsersService(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    public CompletionStage<ObjectNode> find() {
        return find(0, Integer.MAX_VALUE);
    }

    /**
     * ユーザー のリストをJSONで取得します。
     * @return JSON形式の検索結果
     */
    public CompletionStage<ObjectNode> find(int offset, int limit) {
        CompletionStage<Integer> totalFuture = usersRepository.countAll();
        CompletionStage<List<Users>> dataFuture = usersRepository.findAll(offset, limit);
        return totalFuture.thenCombine(dataFuture, (total, data) -> {
            ObjectNode result = Json.newObject();
            result.put("total", total);
            result.set("data", Json.toJson(data));
            return result;
        });
    }

    public CompletionStage<ObjectNode> find(Users filter) {
        return find(filter, 0, Integer.MAX_VALUE);
    }

    /**
     * ユーザー を検索し、リストをJSONで取得します。
     * @param filter 検索条件
     * @return JSON形式の検索結果
     */
    public CompletionStage<ObjectNode> find(Users filter, int offset, int limit) {
        CompletionStage<Integer> totalFuture = usersRepository.count(filter);
        CompletionStage<List<Users>> dataFuture = usersRepository.find(filter, offset, limit);
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
    public CompletionStage<Optional<Users>> findById(Long id) {
        return usersRepository.findById(id);
    }

    /**
     * ユーザー を新規登録します。
     * @param users 登録データ
     * @return 登録後のデータ
     */
    public CompletionStage<Users> create(Users users) {
        return usersRepository.insert(users);
    }

    /**
     * ユーザー を更新します。
     * @param id 主キー
     * @param users 更新データ
     * @return 更新後のデータ
     */
    public CompletionStage<Users> update(Long id, Users users) {
        return usersRepository.update(id, users, users.getUpdatedAt());
    }

    /**
     * ユーザー を論理削除します。
     * @param id 主キー
     * @param updatedAt タイムスタンプ
     */
    public CompletionStage<Void> delete(Long id, Instant updatedAt) {
        return usersRepository.delete(id, updatedAt);
    }

    /**
     * ユーザー のデータをCSVファイルとしてエクスポートします。
     * @param filter 検索条件
     * @return 生成されたCSVファイル
     */
    public CompletionStage<File> exportCsv(Users filter) {
        return usersRepository.find(filter, 0, Integer.MAX_VALUE).thenApply(list -> {
            try {
                File file = Files.createTempFile("users_", ".csv").toFile();
                try (PrintWriter writer = new PrintWriter(Files.newBufferedWriter(file.toPath()))) {
                    writer.printf("%s,%s,%s\n","ユーザー名","メールアドレス","作成日時");
                    for (Users m : list) {
                        writer.printf("%s,%s,%s\n",String.valueOf(m.getUserName()),String.valueOf(m.getEmail()),String.valueOf(m.getCreatedAt()));
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
                List<Users> models = Files.lines(csvFile.toPath())
                    .skip(1) // Skip header
                    .map(line -> line.split(","))
                    .map(values -> {
                        Users model = new Users();
                        if (values.length > 0 && !values[0].isEmpty()) model.setUserName(values[0]);
                        if (values.length > 1 && !values[1].isEmpty()) model.setEmail(values[1]);
                        if (values.length > 2 && !values[2].isEmpty()) model.setCreatedAt(Instant.parse(values[2]));
                        return model;
                    })
                    .collect(Collectors.toList());

                return usersRepository.batchInsert(models).toCompletableFuture().join();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }
}