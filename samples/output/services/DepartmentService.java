package services;

import com.fasterxml.jackson.databind.node.ObjectNode;
import models.Department;
import play.libs.Json;
import repository.DepartmentRepository;
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
 * 部署 のサービス
 */
public class DepartmentService {
    private final DepartmentRepository departmentRepository;

    @Inject
    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public CompletionStage<ObjectNode> find() {
        return find(0, Integer.MAX_VALUE);
    }

    /**
     * 部署 のリストをJSONで取得します。
     * @return JSON形式の検索結果
     */
    public CompletionStage<ObjectNode> find(int offset, int limit) {
        CompletionStage<Integer> totalFuture = departmentRepository.countAll();
        CompletionStage<List<Department>> dataFuture = departmentRepository.findAll(offset, limit);
        return totalFuture.thenCombine(dataFuture, (total, data) -> {
            ObjectNode result = Json.newObject();
            result.put("total", total);
            result.set("data", Json.toJson(data));
            return result;
        });
    }

    public CompletionStage<ObjectNode> find(Department filter) {
        return find(filter, 0, Integer.MAX_VALUE);
    }

    /**
     * 部署 を検索し、リストをJSONで取得します。
     * @param filter 検索条件
     * @return JSON形式の検索結果
     */
    public CompletionStage<ObjectNode> find(Department filter, int offset, int limit) {
        CompletionStage<Integer> totalFuture = departmentRepository.count(filter);
        CompletionStage<List<Department>> dataFuture = departmentRepository.find(filter, offset, limit);
        return totalFuture.thenCombine(dataFuture, (total, data) -> {
            ObjectNode result = Json.newObject();
            result.put("total", total);
            result.set("data", Json.toJson(data));
            return result;
        });
    }

    /**
     * IDで 部署 を検索します。
     * @param id 主キー
     * @return 検索結果
     */
    public CompletionStage<Optional<Department>> findById(Long id) {
        return departmentRepository.findById(id);
    }

    /**
     * 部署 を新規登録します。
     * @param department 登録データ
     * @return 登録後のデータ
     */
    public CompletionStage<Department> create(Department department) {
        return departmentRepository.insert(department);
    }

    /**
     * 部署 を更新します。
     * @param id 主キー
     * @param department 更新データ
     * @return 更新後のデータ
     */
    public CompletionStage<Department> update(Long id, Department department) {
        return departmentRepository.update(id, department, department.getUpdatedAt());
    }

    /**
     * 部署 を論理削除します。
     * @param id 主キー
     * @param updatedAt タイムスタンプ
     */
    public CompletionStage<Void> delete(Long id, Instant updatedAt) {
        return departmentRepository.delete(id, updatedAt);
    }

    /**
     * 部署 のデータをCSVファイルとしてエクスポートします。
     * @param filter 検索条件
     * @return 生成されたCSVファイル
     */
    public CompletionStage<File> exportCsv(Department filter) {
        return departmentRepository.find(filter, 0, Integer.MAX_VALUE).thenApply(list -> {
            try {
                File file = Files.createTempFile("department_", ".csv").toFile();
                try (PrintWriter writer = new PrintWriter(Files.newBufferedWriter(file.toPath()))) {
                    writer.printf("%s,%s,%s,%s\n","部署コード","説明","部署名","作成日時");
                    for (Department m : list) {
                        writer.printf("%s,%s,%s,%s\n",String.valueOf(m.getCode()),String.valueOf(m.getDescription()),String.valueOf(m.getName()),String.valueOf(m.getCreatedAt()));
                    }
                }
                return file;
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }

    /**
     * CSVファイルから 部署 のデータを取り込みます。
     * @param csvFile 取り込むCSVファイル
     * @return 取り込み件数
     */
    public CompletionStage<Integer> importCsv(File csvFile) {
        return supplyAsync(() -> {
            try {
                List<Department> models = Files.lines(csvFile.toPath())
                    .skip(1) // Skip header
                    .map(line -> line.split(","))
                    .map(values -> {
                        Department model = new Department();
                        if (values.length > 0 && !values[0].isEmpty()) model.setCode(values[0]);
                        if (values.length > 1 && !values[1].isEmpty()) model.setDescription(values[1]);
                        if (values.length > 2 && !values[2].isEmpty()) model.setName(values[2]);
                        if (values.length > 3 && !values[3].isEmpty()) model.setCreatedAt(Instant.parse(values[3]));
                        return model;
                    })
                    .collect(Collectors.toList());

                return departmentRepository.batchInsert(models).toCompletableFuture().join();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
    }
}