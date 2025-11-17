次の条件を元にテーブル定義（TSV または CSV）を変換する HTML+JavaScript を作成する計画を tmp/plan/1.md に出力せよ

## 変換先フォーマット

- DDL(PostgreSQL)
- TypeScript の `type`
- Java(EBean) の `model`
- Java の `repository`

## TSV(CSV)のフォーマット

- `TableNo`: テーブルの番号
- `TableName_JP`: テーブルの日本語名
- `TableName`: テーブルの英語名
- `ColNo`: テーブル内におけるカラムの番号
- `ColName_JP`: カラムの日本語名
- `ColName`: カラムの英語名
- `PK/FK`: `PK`,`AK`,`FK` のいずれの値を持つ。`PK`はプライマリキー。`AK`は代理キー。１つのテーブルに複数の `AK` がある場合、該当のテーブルに含まれる全ての `AK` を組み合わせたユニーク制約を追加する。`FK`は外部キー。`FK`論理的な意味での外部キーであり、テーブル定義上は外部キーでは無い。そのため全ての変換処理において無視する必要がある。
- `Type`: PostgreSQL でのデータ型。（例: bigint,bigserial,bit,boolean,bytea,char,date,integer,smallint,time,timestamp,varchar）数値型は整数のみ。
- `Length`: 文字列型の場合の桁数。数値型は整数のみのため桁数の考慮不要。
- `Constraint`: `NN`は Not Null 制約、`U` はユニーク制約、`NN,U`は両方の制約を持つことを表す。
- `Default`: 型に応じた初期値。`bit`の場合は `B'10'` などと表記。
- `Idx1`: インデックス。テーブル単位で空白、または 1 から N までの数値。数値はインデックスの中のカラムの順序を表す。
- `Idx2`: `Idx1` と同じ。
- `Idx3`: `Idx1` と同じ。
- `Idx4`: `Idx1` と同じ。
- `Idx5`: `Idx1` と同じ。
- `Description`: テーブルの説明。

## 条件

- 共通: 作成する HTML+JavaScript は全て1つのファイルにまとめること
- 共通: 変換結果は画面で確認できること
- 共通: 変換結果はファイルとしてダウンロードできること
- 共通: 複数のファイルになる場合は zip ファイルにまとめること
- DDL: テーブルの DDL に変換できること
- DDL: テーブルの日本語名、カラムの日本語名を含めること
- DDL: テーブルが存在する場合 Drop する SQL に変換できること（ロールバック用）
- TypeScript の `type`: サンプルのように変換できること
- Java(EBean) の `model`: サンプルのように変換できること
- Java の `repository`:
  - サンプルのように変換できること
  - JavaDoc をつけること
  - CRUD のアクションを作成すること（find, findById, findAll, insert, batchInsert, update, delete, ほか`AK`での find）など
  - 論理削除のカラム（`isDeleted`）は処理対象外とすること
  - 排他制御には `updatedAt` を使うこと

## サンプル

### TSV(CSV)

```
TableNo	TableName_JP	TableName	ColNo	ColName_JP	ColName	PK/FK	Type	Length	Constraint	Default	Idx1	Idx2	Idx3	Idx4	Idx5	Description
5	ユーザマスタ	m_user	1	Id	id	PK	bigserial		NN,U		1					代理キー
5	ユーザマスタ	m_user	2	ユーザID	user_id	AK	varchar	16	NN			2				ユーザID
5	ユーザマスタ	m_user	3	ユーザ名	user_name		varchar	32	NN							ユーザ名称
5	ユーザマスタ	m_user	4	パスワード	password		varchar	60	NN							パスワードに指定文字を加えてSHA256でハッシュ化した文字列（例：$2a$10$8sKUrdvJn7gpWmMH2qfRduF.vhe2n3diyzf8CvY8GtTsmNJ6HRnBe）
5	ユーザマスタ	m_user	5	権限ID	role_id	FK	integer		NN			3				利用権限マスタのID
5	ユーザマスタ	m_user	6	削除フラグ	is_deleted		boolean									対象レコードの削除有無
5	ユーザマスタ	m_user	7	登録日時	created_at		timestamp									レコード追加を行った日時
5	ユーザマスタ	m_user	8	登録者	created_by		varchar	32								レコード追加を行ったユーザID、プロセス名
5	ユーザマスタ	m_user	9	更新日時	updated_at		timestamp									レコード追加・更新を行った日時
5	ユーザマスタ	m_user	10	更新者	updated_by		varchar	32								レコード追加・更新を行ったユーザID、プロセス名
```

### TypeScript の type

```TypeScript:entities.ts
/** 
 * @type MUser ユーザマスタ
 */
export type MUser = {
  /** Id */
  id?: number;
  /** ユーザID */
  user_id?: string;
  /** ユーザ名 */
  user_name?: string;
  
  {{省略}}
};
```

### Java(EBean) の `model`

```java:MUser.java
package models;

import io.ebean.Finder;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "m_user")
public class MUser extends BaseModel {

    /**
     * ユーザID
     */
    public String userId;

    /**
     * ユーザ名
     */
    public String userName;

    {{省略}}

    public static Finder<Long, MUser> find = new Finder<>(MUser.class);
}
```

```java:BaseModel.java
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
```

### Java の `repository`

```java
package repository;

import io.ebean.DB;
import io.ebean.ExpressionList;
import io.ebean.PagedList;
import io.ebean.Query;
import models.Task;

import javax.inject.Inject;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletionStage;
import java.util.stream.Collectors;

import static java.util.concurrent.CompletableFuture.supplyAsync;

public class TaskRepository {
    private final DatabaseExecutionContext executionContext;

    @Inject
    public TaskRepository(DatabaseExecutionContext executionContext) {
        this.executionContext = executionContext;
    }

    public CompletionStage<PagedList<Task>> find(int page, int perPage, String title, List<String> statuses, List<Long> ownerIds) {
        return supplyAsync(() -> {
            Query<Task> query = DB.find(Task.class);
            ExpressionList<Task> where = query.where();
            where.eq("isDeleted", false);
            if (title != null && !title.isEmpty()) {
                where.ilike("title", "%" + title + "%");
            }
            if (statuses != null && !statuses.isEmpty()) {
                where.in("status", statuses);
            }
            if (ownerIds != null && !ownerIds.isEmpty()) {
                where.in("owner.id", ownerIds);
            }
            return query
                .fetch("owner")
                .setFirstRow((page - 1) * perPage)
                .setMaxRows(perPage)
                .findPagedList();
        }, executionContext);
    }

    public CompletionStage<Optional<Task>> findById(Long id) {
        return supplyAsync(() ->
            DB.find(Task.class)
                .where()
                .eq("id", id)
                .findOneOrEmpty()
        , executionContext);
    }

    public CompletionStage<Task> insert(Task task) {
        return supplyAsync(() -> {
            DB.insert(task);
            return task;
        }, executionContext);
    }

    public CompletionStage<Task> update(Long id, Task newData) {
        return supplyAsync(() -> {
            Task task = DB.find(Task.class).setId(id).findOne();
            if (task == null) {
                throw new EntityNotFoundException("Task not found with id: " + id);
            }
            task.setTitle(newData.getTitle());
            task.setStatus(newData.getStatus());
            task.setDueDate(newData.getDueDate());
            task.setPriority(newData.getPriority());
            task.setOwnerId(newData.getOwnerId());
            task.update();
            return task;
        }, executionContext);
    }

    public CompletionStage<Task> delete(Long id) {
        return supplyAsync(() -> {
            Task task = DB.find(Task.class).setId(id).findOne();
            if (task == null) {
                throw new EntityNotFoundException("Task not found with id: " + id);
            }
            task.setIsDeleted(false);
            task.update();
            return task;
        }, executionContext);
    }

    public CompletionStage<List<Task>> findAll(String title, List<String> statuses) {
        return supplyAsync(() -> {
            Query<Task> query = DB.find(Task.class);
            ExpressionList<Task> where = query.where();
            where.eq("isDeleted", false);
            if (title != null && !title.isEmpty()) {
                where.ilike("title", "%" + title + "%");
            }
            if (statuses != null && !statuses.isEmpty()) {
                where.in("status", statuses);
            }
            return query
                .fetch("owner")
                .findList();
        }, executionContext);
    }

    public CompletionStage<List<String>> findExistingTitles(List<String> titles) {
        return supplyAsync(() ->
            DB.find(Task.class)
                .select("title")
                .where()
                .eq("isDeleted", false)
                .in("title", titles)
                .findList()
                .stream()
                .map(Task::getTitle)
                .collect(Collectors.toList())
        , executionContext);
    }

    public CompletionStage<Integer> batchInsert(List<Task> tasks) {
        return supplyAsync(() -> {
            DB.saveAll(tasks);
            return tasks.size();
        }, executionContext);
    }
}
```

---

- 「2.1. 入力」を変更: テキストエリアに CSV または TSV を貼り付けて変換可能とする（ファイルをアップロードして変換する機能はそのままとする）
- 変換形式に Java の service クラスを追加。以下のサンプルを参照。

```java:serviceサンプル
package services;

import com.fasterxml.jackson.databind.node.ObjectNode;
import models.Task;
import play.libs.Json;
import play.libs.F.Either;
import repository.TaskRepository;

import javax.inject.Inject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.function.Function;
import java.util.stream.Collectors;

public class TaskService {

    private final TaskRepository taskRepository;
    private final CsvService csvService;

    @Inject
    public TaskService(TaskRepository taskRepository, CsvService csvService) {
        this.taskRepository = taskRepository;
        this.csvService = csvService;
    }

    public CompletionStage<ObjectNode> find(int page, int perPage, String title, List<String> statuses, List<Long> ownerIds) {
        return taskRepository.find(page, perPage, title, statuses, ownerIds).thenApply(pagedList -> {
            ObjectNode result = Json.newObject();
            result.put("total", pagedList.getTotalCount());
            result.set("items", Json.toJson(pagedList.getList().stream().map(task -> {
                ObjectNode node = Json.newObject();
                node.put("id", task.id);
                node.put("title", task.title);
                node.put("status", task.status);
                if (task.owner != null) {
                    node.put("ownerName", task.owner.name);
                } else {
                    node.putNull("ownerName");
                }
                node.put("dueDate", task.dueDate);
                node.put("priority", task.priority);
                if (task.createdAt != null) {
                    node.put("createdAt", task.createdAt.toString());
                } else {
                    node.putNull("createdAt");
                }
                return node;
            }).collect(Collectors.toList())));
            return result;
        });
    }

    public CompletionStage<Optional<Task>> findById(Long id) {
        return taskRepository.findById(id);
    }

    public CompletionStage<Task> create(Task task) {
        return taskRepository.insert(task);
    }

    public CompletionStage<Task> update(Long id, Task task) {
        return taskRepository.update(id, task);
    }

    public CompletionStage<Task> delete(Long id) {
        return taskRepository.delete(id);
    }

    public CompletionStage<String> exportCsv(String title, List<String> statuses) {
        return taskRepository.findAll(title, statuses).thenApply(tasks -> {
            List<String> headers = Arrays.asList("ID", "Title", "Status", "Owner", "Due Date", "Priority", "Created On");

            Function<Task, List<String>> rowMapper = task -> Arrays.asList(
                String.valueOf(task.id),
                task.title,
                task.status,
                task.owner != null ? task.owner.name : "",
                task.dueDate,
                String.valueOf(task.priority),
                task.createdAt != null ? task.createdAt.toString() : ""
            );

            return csvService.generate(headers, tasks, rowMapper);
        });
    }

    public CompletionStage<List<String>> findExistingTitles(List<String> titles) {
        return taskRepository.findExistingTitles(titles);
    }

    public CompletionStage<Integer> batchInsert(List<Task> tasks) {
        return taskRepository.batchInsert(tasks);
    }

    public CompletionStage<Either<List<String>, Integer>> importCsv(java.io.File file) {
        // 1. Synchronous file parsing in supplyAsync
        CompletionStage<Either<List<String>, List<Task>>> parsingStage = CompletableFuture.supplyAsync(() -> {
            List<String> errors = new ArrayList<>();
            List<Task> tasksToImport = new ArrayList<>();

            try (BufferedReader br = new BufferedReader(new InputStreamReader(new java.io.FileInputStream(file), "UTF-8"))) {
                String header = br.readLine();
                // Simple validation for BOM
                if (header != null && header.startsWith("\uFEFF")) {
                    header = header.substring(1);
                }

                if (header == null || !"title,status,dueDate,priority".equals(header)) {
                    errors.add("Invalid or empty CSV file. Expected header: title,status,dueDate,priority");
                    return Either.Left(errors);
                }

                Set<String> titlesInFile = new HashSet<>();
                String line;
                int row = 2;
                while ((line = br.readLine()) != null) {
                    String[] values = line.split(",", -1);
                    if (values.length != 4) {
                        errors.add("Row " + row + ": Invalid column count. Expected 4, but got " + values.length + ".");
                        continue; // Skip to next row but collect all errors
                    }
                    String title = values[0];
                    if (title.isEmpty() || title.length() > 255) {
                        errors.add("Row " + row + ": Title is required and must be less than 255 characters.");
                    }
                    if (!titlesInFile.add(title)) {
                        errors.add("Row " + row + ": Duplicate title found in the CSV file: " + title);
                    }

                    Task task = new Task();
                    task.title = title;
                    task.status = values[1];
                    task.dueDate = values[2];
                    try {
                        task.priority = Integer.parseInt(values[3]);
                    } catch (NumberFormatException e) {
                        errors.add("Row " + row + ": Priority must be a number.");
                    }
                    tasksToImport.add(task);
                    row++;
                }
            } catch (java.io.IOException e) {
                errors.add("Error reading CSV file: " + e.getMessage());
                return Either.Left(errors);
            }

            if (!errors.isEmpty()) {
                return Either.Left(errors);
            }

            return Either.Right(tasksToImport);
        });

        // 2. & 3. Asynchronous database operations chained with thenCompose
        return parsingStage.thenCompose(parsingResult -> {
            if (parsingResult.left.isPresent()) {
                return CompletableFuture.completedFuture(Either.Left(parsingResult.left.get()));
            }

            List<Task> tasksToImport = parsingResult.right.get();
            if (tasksToImport.isEmpty()) {
                return CompletableFuture.completedFuture(Either.Right(0));
            }

            List<String> titles = tasksToImport.stream().map(t -> t.title).collect(Collectors.toList());

            return findExistingTitles(titles).thenCompose(existingTitles -> {
                List<String> errors = new ArrayList<>();
                for (String title : existingTitles) {
                    errors.add("Title already exists in the database: " + title);
                }
                if (!errors.isEmpty()) {
                    return CompletableFuture.completedFuture(Either.Left(errors));
                }

                // 4. Batch insert and wrap the result
                return batchInsert(tasksToImport).thenApply(count -> Either.Right(count));
            });
        });
    }
}

```

---

@README.md を元に tmp/plan/1.md を作成して実装中です。現在の実装を確認して途中から再開してください。

---

`repository` の出力に find メソッドを追加したい。find メソッドは該当のモデルの全てのプロパティを指定してフィルターが可能なメソッド。文字列の場合は部分一致をサポートする。

---

次の内容をもとに tmp/plan/2.md に実装計画を作成せよ。

- `zod` ライブラリを使ってスキーマを出力する機能を追加したい。
- 既存の type 出力機能とは別でスキーマを元に TypeScript の type (例:`type User = z.infer<typeof UserSchema>;`) を出力できるようにしたい。

---

次の内容を元に tmp/plan/3.md に実装計画を作成せよ。

- Java の model に変換時に `javax.validation.constraints` を使った制約を追加したい
- NotNull 制約: `Constraint` カラムに `NN` が含まれていたら `NotNull` にしたい
- 最小値の制約: 文字列型で NotNull のカラムは最小文字数を 1 にしたい
- 最大値の制約: `Length` カラムの値を制約にしたい

---

最小値の制約の条件を次のとおり変更したい。

- 最小値の制約:
  - 文字列型で NotNull のカラムは最小文字数を 1 にしたい
  - カラム名に `description`,`note`,`remarks` を含む場合は最小文字数の制約は無しとしたい。

---

zod Schema への変換も同様にして最小値の制約の追加をしたい。

- 最小値の制約:
  - 文字列型で NotNull のカラムは最小文字数を 1 にしたい
  - カラム名に `description`,`note`,`remarks` を含む場合は最小文字数の制約は無しとしたい。


---

次の内容を元に tmp/plan/4.md に実装計画を作成せよ。

- Java の repository の変換時に `update` と `delete` メソッドに楽観排他の処理を追加したい
- 排他は `updatedAt` の時刻印ロックで行いたい

---

次の内容を元に tmp/plan/5.md に実装計画を作成せよ。

- Java の repository への変換で List を返すメソッド（`find`, `findAll`）にオフセットする件数（またはページ番号）と取得件数を指定可能にする

---

次の内容を元に tmp/plan/6.md に実装計画を作成せよ。

- Java の repository への変換で List を返すメソッド（`find`, `findAll`）に対応する、件数を数えるメソッドを追加する

---

次の内容を元に tmp/plan/7.md に実装計画を作成せよ。

- Java の repository への変換で作る `find` メソッドと `count` メソッドの中で利用する `query` は同一となるため、共通化したい

---

次の内容を元に tmp/plan/8.md に実装計画を作成せよ。

- Java の service への変換で作る `exportCSV` メソッドを実装したい。repository の `find(Foo filter, int offset, int limit)` の結果をそのまま CSV として出力するようにしたい
- Java の service への変換で作る `importCSV` メソッドを実装したい。`exportCSV` で出力するフォーマットの CSV を受け取り、repository の `batchInsert` で一括登録したい

---

次の内容を元に tmp/plan/9.md に実装計画を作成せよ。

- `PrintWriter` を使って `exportCSV` の出力ロジックを改善したい

```java:PrintWriterの使用サンプル
import java.io.PrintWriter;
// ... 

// BufferedWriterをラップしてPrintWriterを作成
// PrintWriterはコンストラクタでFileWriterやBufferedWriterを受け取れます
PrintWriter printWriter = new PrintWriter(writer); 

for (Foo m : list) {
    // printWriter.printf() または printWriter.println() を使用
    // printfの例 (C言語のprintfのような書式指定が可能)
    printWriter.printf("%s,%s,%s%n",
        String.valueOf(m.getBar()),
        String.valueOf(m.getBaz()),
        String.valueOf(m.getQux())
    );
    // %n はプラットフォーム依存の改行文字を挿入します
}
// printWriter は close() を呼び出す際に、ラップしている writer も flush/close します
```

---

次の内容を元に tmp/plan/10.md に実装計画を作成せよ。

- 変換先フォーマットに新たに Java のコントローラーを追加したい

```java:コントローラーのサンプル
package controllers.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import controllers.actions.Authenticated;
import libraries.CsvImportHandler;
import models.Task;
import play.libs.Files;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Http;
import play.mvc.Result;
import services.TaskService;
import libraries.CsvResult;

import javax.inject.Inject;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.stream.Collectors;

public class TaskController extends Controller {

    private final TaskService taskService;

    @Inject
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @Authenticated
    public CompletionStage<Result> find(Http.Request request) {
        int page = request.queryString("page").map(Integer::parseInt).orElse(1);
        int perPage = request.queryString("perPage").map(Integer::parseInt).orElse(10);
        String title = request.queryString("title").orElse(null);
        List<String> statuses = Optional.ofNullable(request.queryString().get("statuses"))
            .map(Arrays::asList)
            .orElse(Collections.emptyList());
        List<Long> ownerIds = Optional.ofNullable(request.queryString().get("ownerIds"))
            .map(ids -> Arrays.stream(ids).map(Long::parseLong).collect(Collectors.toList()))
            .orElse(Collections.emptyList());

        return taskService.find(page, perPage, title, statuses, ownerIds)
            .thenApply(result -> ok(result));
    }

    @Authenticated
    public CompletionStage<Result> findById(Http.Request request, Long id) {
        return taskService.findById(id).thenApply(taskOpt ->
            taskOpt.map(task -> ok(Json.toJson(task)))
                .orElse(notFound())
        );
    }

    @Authenticated
    public CompletionStage<Result> create(Http.Request request) {
        JsonNode json = request.body().asJson();
        Task task = Json.fromJson(json, Task.class);
        return taskService.create(task).thenApply(insertedTask ->
            created(Json.toJson(insertedTask))
        );
    }

    @Authenticated
    public CompletionStage<Result> update(Http.Request request, Long id) {
        JsonNode json = request.body().asJson();
        Task task = Json.fromJson(json, Task.class);
        return taskService.update(id, task).thenApply(updated ->
            created(Json.toJson(updated))
        );
    }

    @Authenticated
    public CompletionStage<Result> delete(Long id) {
        return taskService.delete(id).thenApply(task -> {
            if (task != null) {
                return ok(Json.toJson(task));
            } else {
                return notFound();
            }
        });
    }

    @Authenticated
    public CompletionStage<Result> exportCsv(Http.Request request) {
        String title = request.queryString("title").orElse(null);
        List<String> statuses = Optional.ofNullable(request.queryString().get("statuses"))
            .map(Arrays::asList)
            .orElse(Collections.emptyList());

        return taskService.exportCsv(title, statuses).thenApply(csv ->
            CsvResult.ok(csv, "tasks.csv")
        );
    }

    @Authenticated
    public CompletionStage<Result> importCsv(Http.Request request) {
        return CsvImportHandler.handle(request, file ->
            taskService.importCsv(file).thenApply(result -> {
                if (result.left.isPresent()) {
                    java.util.List<String> errors = result.left.get();
                    ObjectNode errorJson = Json.newObject();
                    errorJson.set("errors", Json.toJson(errors));
                    return badRequest(errorJson);
                } else {
                    Integer count = result.right.get();
                    ObjectNode successJson = Json.newObject();
                    successJson.put("message", "CSV imported successfully.");
                    successJson.put("imported_count", count);
                    return ok(successJson);
                }
            })
        );
    }
}
```

---

次の内容を元に tmp/plan/11.md に実装計画を作成せよ。

- Java の変換後コードを改善。データベースへのアクセス時に行レベルセキュリティ（RLS:Row-Level Security）の仕組みを取り入れたい。
- RLS はデータベース側ではなく、Java 側で行いたい
- 実現イメージ:
  - @samples/input.tsv の `user` テーブルには `department_code` というカラムがある、このカラムの値がセッションの `department_code` と一致する場合、そのレコードへアクセス可能。一致しない場合はアクセス不可。
  - ただし、`user.is_admin` が true の場合は常にアクセス可能。
  - 注意1: 上記の `user` テーブルや `department_code` は固定値ではなく、動的に変更、または指定可能とする（`indexhtml` で指定で指定ができると良いと思われる）。
  - 注意2: RLS の制御が不要なテーブルも存在する（`department_code` カラムを持っていないテーブルも存在する）

---

次の内容を元に tmp/plan/12.md を作成せよ。

Java の変換後の Controller の `find` メソッドは `request.body().asJson()` 賭して、 body を使用している。しかし、一般的な慣例として GET リクエストにおいて body を使うことは推奨されていない。この点についての改善案を提案せよ。

