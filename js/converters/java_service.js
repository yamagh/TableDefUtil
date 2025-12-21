// Initialize Namespace
window.App = window.App || {};
App.Converters = App.Converters || {};

App.Converters.JavaService = {
  /**
   * Javaサービスクラス生成
   */
  generateJavaService(tables, rlsOptions) {
    const config = (App.State.config && App.State.config.commonColumns) ? App.State.config.commonColumns : {
      id: 'id',
      is_deleted: { name: 'is_deleted', type: 'boolean', valTrue: true, valFalse: false },
      created_at: 'created_at',
      updated_at: 'updated_at'
    };

    const idCol = config.id;
    const createdAtCol = config.created_at;
    const updatedAtCol = config.updated_at;
    const isDeletedCol = config.is_deleted.name;

    const files = [];

    tables.forEach(table => {
      const modelName = toPascalCase(table.tableName);
      const serviceName = `${modelName}Service`;
      const repoName = `${modelName}Repository`;
      const repoVar = toCamelCase(repoName);
      const modelVar = toCamelCase(modelName);

      let classContent = `package services;\n\n`;
      classContent += `import com.fasterxml.jackson.databind.node.ObjectNode;\n`;
      classContent += `import models.${modelName};\n`;
      classContent += `import play.libs.Json;\n`;
      classContent += `import repository.${repoName};\n`;
      classContent += `import libraries.CsvHelper;\n`;
      classContent += `import java.io.File;\n`;
      classContent += `import java.io.IOException;\n`;
      classContent += `import java.io.PrintWriter;\n`;
      classContent += `import java.nio.charset.StandardCharsets;\n`;
      classContent += `import java.nio.file.Files;\n`;
      classContent += `import java.nio.file.StandardOpenOption;\n`;
      classContent += `import java.time.Instant;\n`;
      classContent += `import java.time.LocalTime;\n`;
      classContent += `import java.util.concurrent.CompletionStage;\n`;
      classContent += `import java.util.List;\n`;
      classContent += `import java.util.Optional;\n`;
      classContent += `import java.util.concurrent.CompletionStage;\n`;
      classContent += `import java.util.List;\n`;
      classContent += `import java.util.Map;\n`;
      classContent += `import java.util.HashMap;\n`;
      classContent += `import java.util.Optional;\n`;
      classContent += `import java.util.stream.Collectors;\n`;
      classContent += `import javax.inject.Inject;\n`;
      classContent += `import static java.util.concurrent.CompletableFuture.supplyAsync;\n\n`;


      classContent += `/**\n * ${table.tableNameJP} のサービス\n */\n`;
      classContent += `public class ${serviceName} {\n`;
      classContent += `    private final ${repoName} ${repoVar};\n\n`;

      classContent += `    @Inject\n`;
      classContent += `    public ${serviceName}(${repoName} ${repoVar}) {\n`;
      classContent += `        this.${repoVar} = ${repoVar};\n`;
      classContent += `    }\n\n`;

      classContent += `    /**\n     * データの整合性をチェックします。\n     * @param ${modelVar} データ\n     */\n`;
      classContent += `    private void validate(${modelName} ${modelVar}) {\n`;
      (() => {
        let checks = "";
        // 1. テーブル定義に基づくバリデーション
        table.columns.forEach(col => {
          const colPascal = toPascalCase(col.colName);
          const colCamel = toCamelCase(col.colName);
          const javaType = mapPostgresToJavaType(col.type, col.length);

          // 必須チェック
          if (col.constraint && col.constraint.includes('NN') && col.colName !== idCol && col.colName !== createdAtCol && col.colName !== updatedAtCol && col.colName !== isDeletedCol) {
            checks += `        if (${modelVar}.get${colPascal}() == null) {\n`;
            checks += `            throw new RuntimeException("${col.colNameJP}は必須です。");\n`;
            checks += `        }\n`;
          }
          // 文字数チェック (Stringのみ)
          if (javaType === 'String' && col.length) {
            checks += `        if (${modelVar}.get${colPascal}() != null && ${modelVar}.get${colPascal}().length() > ${col.length}) {\n`;
            checks += `            throw new RuntimeException("${col.colNameJP}は${col.length}文字以内で入力してください。");\n`;
            checks += `        }\n`;
          }
        });

        // 2. DBのユニーク制約チェック
        const uniqueColumns = table.columns.filter(c => c.pkfk === 'AK' || (c.constraint && c.constraint.includes('U')));
        uniqueColumns.forEach(col => {
          const colPascal = toPascalCase(col.colName);
          const colCamel = toCamelCase(col.colName);
          // 値が存在する場合のみDBチェックを行う
          checks += `        if (${modelVar}.get${colPascal}() != null) {\n`;
          checks += `            ${repoVar}.findBy${colPascal}(${modelVar}.get${colPascal}()).thenAccept(opt -> {\n`;
          const idGetter = `get${toPascalCase(idCol)}`;
          checks += `                if (opt.isPresent() && !opt.get().${idGetter}().equals(${modelVar}.${idGetter}())) {\n`;
          checks += `                    throw new RuntimeException("${col.colNameJP}は既に使用されています。");\n`;
          checks += `                }\n`;
          checks += `            }).toCompletableFuture().join();\n`;
          checks += `        }\n`;
        });
        classContent += checks;
      })();
      classContent += `    }\n\n`;

      classContent += `    public CompletionStage<ObjectNode> find() {\n`;
      classContent += `        return find(0, Integer.MAX_VALUE);\n`;
      classContent += `    }\n\n`;

      // find (as JSON)
      classContent += `    /**\n     * ${table.tableNameJP} のリストをJSONで取得します。\n     * @return JSON形式の検索結果\n     */\n`;
      classContent += `    public CompletionStage<ObjectNode> find(int offset, int limit) {\n`;
      classContent += `        CompletionStage<Integer> totalFuture = ${repoVar}.countAll();\n`;
      classContent += `        CompletionStage<List<${modelName}>> dataFuture = ${repoVar}.findAll(offset, limit);\n`;
      classContent += `        return totalFuture.thenCombine(dataFuture, (total, data) -> {\n`;
      classContent += `            ObjectNode result = Json.newObject();\n`;
      classContent += `            result.put("total", total);\n`;
      classContent += `            result.set("data", Json.toJson(data));\n`;
      classContent += `            return result;\n`;
      classContent += `        });\n`;
      classContent += `    }\n\n`;

      classContent += `    public CompletionStage<ObjectNode> find(${modelName} filter) {\n`;
      classContent += `        return find(filter, 0, Integer.MAX_VALUE);\n`;
      classContent += `    }\n\n`;

      // find (with filter)
      classContent += `    /**\n     * ${table.tableNameJP} を検索し、リストをJSONで取得します。\n     * @param filter 検索条件\n     * @return JSON形式の検索結果\n     */\n`;
      classContent += `    public CompletionStage<ObjectNode> find(${modelName} filter, int offset, int limit) {\n`;
      classContent += `        CompletionStage<Integer> totalFuture = ${repoVar}.count(filter);\n`;
      classContent += `        CompletionStage<List<${modelName}>> dataFuture = ${repoVar}.find(filter, offset, limit);\n`;
      classContent += `        return totalFuture.thenCombine(dataFuture, (total, data) -> {\n`;
      classContent += `            ObjectNode result = Json.newObject();\n`;
      classContent += `            result.put("total", total);\n`;
      classContent += `            result.set("data", Json.toJson(data));\n`;
      classContent += `            return result;\n`;
      classContent += `        });\n`;
      classContent += `    }\n\n`;

      // findById
      classContent += `    /**\n     * IDで ${table.tableNameJP} を検索します。\n     * @param id 主キー\n     * @return 検索結果\n     */\n`;
      classContent += `    public CompletionStage<Optional<${modelName}>> findById(Long id) {\n`;
      classContent += `        return ${repoVar}.findById(id);\n`;
      classContent += `    }\n\n`;

      // create
      classContent += `    /**\n     * ${table.tableNameJP} を新規登録します。\n     * @param ${modelVar} 登録データ\n     * @return 登録後のデータ\n     */\n`;
      classContent += `    public CompletionStage<${modelName}> create(${modelName} ${modelVar}) {\n`;
      classContent += `        validate(${modelVar});\n`;
      classContent += `        return ${repoVar}.insert(${modelVar});\n`;
      classContent += `    }\n\n`;

      // update
      classContent += `    /**\n     * ${table.tableNameJP} を更新します。\n     * @param id 主キー\n     * @param ${modelVar} 更新データ\n     * @return 更新後のデータ\n     */\n`;
      classContent += `    public CompletionStage<${modelName}> update(Long id, ${modelName} ${modelVar}) {\n`;
      classContent += `        ${modelVar}.set${toPascalCase(idCol)}(id);\n`;
      classContent += `        validate(${modelVar});\n`;
      classContent += `        return ${repoVar}.update(id, ${modelVar}, ${modelVar}.get${toPascalCase(updatedAtCol)}());\n`;
      classContent += `    }\n\n`;

      // delete
      classContent += `    /**\n     * ${table.tableNameJP} を論理削除します。\n     * @param id 主キー\n     * @param updatedAt タイムスタンプ\n     */\n`;
      classContent += `    public CompletionStage<Void> delete(Long id, Instant updatedAt) {\n`;
      classContent += `        return ${repoVar}.delete(id, updatedAt);\n`;
      classContent += `    }\n\n`;

      const nonKeyColumns = table.columns.filter(c => c.pkfk !== 'PK' && c.colName !== idCol);
      const csvHeader = nonKeyColumns.map(c => `\"${c.colNameJP}\"`).join("\n                        ,");
      const csvPlaceHolder = `("\\"%s\\",").repeat(${nonKeyColumns.length}) + "\\"%s\\"\\n"` // nonKeyColumns.map(c => `\\"%s\\"`).join(",") + "\\n";
      const csvRow = nonKeyColumns.map(c => `CsvHelper.processCsvField(String.valueOf(m.get${toPascalCase(c.colName)}()))`).join('\n                            ,');

      classContent += `    /**\n     * ${table.tableNameJP} のデータをCSVファイルとしてエクスポートします。\n     * @param filter 検索条件\n     * @return 生成されたCSVファイル\n     */\n`;
      classContent += `    public CompletionStage<File> exportCsv(${modelName} filter) {\n`;
      classContent += `        return ${repoVar}.find(filter, 0, Integer.MAX_VALUE).thenApply(list -> {\n`;
      classContent += `            try {\n`;
      classContent += `                File file = Files.createTempFile("${table.tableName}_", ".csv").toFile();\n`;
      classContent += `                byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};\n`;
      classContent += `                Files.write(file.toPath(), bom, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);\n`;
      classContent += `                try (PrintWriter writer = new PrintWriter(Files.newBufferedWriter(file.toPath(), StandardCharsets.UTF_8, StandardOpenOption.APPEND))) {\n`;
      classContent += `                    writer.printf(\n`;
      classContent += `                        ${csvPlaceHolder}\n`;
      classContent += `                        ,${csvHeader}\n`;
      classContent += `                    );\n`;
      classContent += `                    for (${modelName} m : list) {\n`;
      classContent += `                        writer.printf(\n`;
      classContent += `                            ${csvPlaceHolder}\n`;
      classContent += `                            ,${csvRow}\n`;
      classContent += `                        );\n`;
      classContent += `                    }\n`;
      classContent += `                }\n`;
      classContent += `                return file;\n`;
      classContent += `            } catch (IOException e) {\n`;
      classContent += `                throw new RuntimeException(e);\n`;
      classContent += `            }\n`;
      classContent += `        });\n`;
      classContent += `    }\n\n`;

      const nonKeyColumnsForImport = table.columns.filter(c => c.pkfk !== 'PK' && c.colName !== idCol);

      classContent += `    /**\n     * CSVファイルから ${table.tableNameJP} のデータを取り込みます。\n     * @param csvFile 取り込むCSVファイル\n     * @return 取り込み件数\n     */\n`;
      classContent += `    public CompletionStage<Integer> importCsv(File csvFile) {\n`;
      classContent += `        return supplyAsync(() -> {\n`;
      classContent += `            try {\n`;
      classContent += `                List<${modelName}> models = Files.lines(csvFile.toPath())\n`;
      classContent += `                    .skip(1) // ヘッダーをスキップ\n`;
      classContent += `                    .map(line -> line.split(","))\n`;
      classContent += `                    .map(values -> {\n`;
      classContent += `                        ${modelName} model = new ${modelName}();\n`;
      nonKeyColumnsForImport.forEach((col, i) => {
        const setter = `set${toPascalCase(col.colName)}`;
        const javaType = mapPostgresToJavaType(col.type, col.length);
        let parseLogic = `values[${i}]`;
        if (javaType === 'Long') parseLogic = `Long.parseLong(values[${i}])`;
        else if (javaType === 'Integer') parseLogic = `Integer.parseInt(values[${i}])`;
        else if (javaType === 'Boolean') parseLogic = `Boolean.parseBoolean(values[${i}])`;
        else if (javaType === 'java.time.Instant') parseLogic = `Instant.parse(values[${i}])`;
        else if (javaType === 'java.time.LocalTime') parseLogic = `LocalTime.parse(values[${i}])`;
        else if (javaType === 'byte[]') parseLogic = `new java.math.BigInteger(values[${i}], 16).toByteArray()`;

        classContent += `                        if (values.length > ${i} && !values[${i}].isEmpty()) model.${setter}(${parseLogic});\n`;
      });
      classContent += `                        return model;\n`;
      classContent += `                    })\n`;
      classContent += `                    .collect(Collectors.toList());\n`;
      classContent += `\n`;
      classContent += `                // 3. In-memory Validation (Validation 3)\n`;
      (() => {
        let batchChecks = "";
        const uniqueColumns = table.columns.filter(c => c.pkfk === 'AK' || (c.constraint && c.constraint.includes('U')));
        uniqueColumns.forEach(col => {
          const colPascal = toPascalCase(col.colName);
          batchChecks += `                Map<Object, Long> ${col.colName}Counts = models.stream()\n`;
          batchChecks += `                    .filter(m -> m.get${colPascal}() != null)\n`;
          batchChecks += `                    .collect(Collectors.groupingBy(${modelName}::get${colPascal}, Collectors.counting()));\n`;
          batchChecks += `                if (${col.colName}Counts.values().stream().anyMatch(count -> count > 1)) {\n`;
          batchChecks += `                    throw new RuntimeException("CSVファイル内に重複する${col.colNameJP}が存在します。");\n`;
          batchChecks += `                }\n`;
        });
        classContent += batchChecks;
      })();
      classContent += `                // Per-item Validation (Validation 1 & 2)\n`;
      classContent += `                models.forEach(this::validate);\n`;
      classContent += `\n`;
      classContent += `                return ${repoVar}.batchInsert(models).toCompletableFuture().join();\n`;
      classContent += `            } catch (IOException e) {\n`;
      classContent += `                throw new RuntimeException(e);\n`;
      classContent += `            }\n`;
      classContent += `        });\n`;
      classContent += `    }\n`;

      classContent += `}\n`;

      files.push({ path: `services/${serviceName}.java`, content: classContent });
    });

    return files;
  }
};

// Backward compat
window.generateJavaService = App.Converters.JavaService.generateJavaService;
