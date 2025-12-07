/**
 * Javaコントローラークラス生成
 */
function generateJavaController(tables) {
  const files = [];

  tables.forEach(table => {
    const modelName = toPascalCase(table.tableName);
    const serviceName = `${modelName}Service`;
    const controllerName = `${modelName}Controller`;
    const serviceVar = toCamelCase(serviceName);
    const modelVar = toCamelCase(modelName);
    const pkColumn = table.columns.find(c => c.pkfk === 'PK') || { colName: 'id', type: 'bigint' };
    const pkName = toCamelCase(pkColumn.colName);
    const pkType = pkColumn.type.toLowerCase().includes('big') ? 'Long' : 'Integer';


    let classContent = `package controllers.api;\n\n`;
    classContent += `import com.fasterxml.jackson.databind.JsonNode;\n`;
    classContent += `import com.fasterxml.jackson.databind.node.ObjectNode;\n`;
    classContent += `import controllers.actions.Authenticated;\n`;
    classContent += `import libraries.CsvImportHandler;\n`;
    classContent += `import models.${modelName};\n`;
    classContent += `import play.libs.Json;\n`;
    classContent += `import play.mvc.Controller;\n`;
    classContent += `import play.mvc.Http;\n`;
    classContent += `import play.mvc.Result;\n`;
    classContent += `import services.${serviceName};\n`;
    classContent += `import libraries.CsvResult;\n`;
    classContent += `import com.fasterxml.jackson.databind.ObjectMapper;\n`;
    classContent += `import java.util.Map;\n`;
    classContent += `import java.util.stream.Collectors;\n`;
    classContent += `import java.util.concurrent.CompletionStage;\n`;
    classContent += `import javax.inject.Inject;\n`;
    classContent += `import java.time.Instant;\n\n`;

    classContent += `/**\n * ${table.tableNameJP} のコントローラー\n */\n`;
    classContent += `@Authenticated\n`;
    classContent += `public class ${controllerName} extends Controller {\n\n`;
    classContent += `    private final ${serviceName} ${serviceVar};\n\n`;
    classContent += `    @Inject\n`;
    classContent += `    public ${controllerName}(${serviceName} ${serviceVar}) {\n`;
    classContent += `        this.${serviceVar} = ${serviceVar};\n`;
    classContent += `    }\n\n`;

    // find
    classContent += `    public CompletionStage<Result> find(Http.Request request) {\n`;
    classContent += `        int offset = request.queryString("offset").map(Integer::parseInt).orElse(0);\n`;
    classContent += `        int limit = request.queryString("limit").map(Integer::parseInt).orElse(Integer.MAX_VALUE);\n`;
    classContent += `        Map<String, String> params = request.queryString().entrySet().stream()\n`;
    classContent += `            .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue()[0]));\n`;
    classContent += `        params.remove("offset");\n`;
    classContent += `        params.remove("limit");\n`;
    classContent += `        ObjectMapper mapper = new ObjectMapper();\n`;
    classContent += `        ${modelName} filter = mapper.convertValue(params, ${modelName}.class);\n`;
    classContent += `        return ${serviceVar}.find(filter, offset, limit).thenApply(result -> ok(result));\n`;
    classContent += `    }\n\n`;

    // findById
    classContent += `    public CompletionStage<Result> findById(Http.Request request, ${pkType} ${pkName}) {\n`;
    classContent += `        return ${serviceVar}.findById(${pkName}).thenApply(${modelVar}Opt ->\n`;
    classContent += `            ${modelVar}Opt.map(m -> ok(Json.toJson(m)))\n`;
    classContent += `                .orElse(notFound())\n`;
    classContent += `        );\n`;
    classContent += `    }\n\n`;

    // create
    classContent += `    public CompletionStage<Result> create(Http.Request request) {\n`;
    classContent += `        JsonNode json = request.body().asJson();\n`;
    classContent += `        ${modelName} ${modelVar} = Json.fromJson(json, ${modelName}.class);\n`;
    classContent += `        return ${serviceVar}.create(${modelVar}).thenApply(inserted ->\n`;
    classContent += `            created(Json.toJson(inserted))\n`;
    classContent += `        );\n`;
    classContent += `    }\n\n`;

    // update
    classContent += `    public CompletionStage<Result> update(Http.Request request, ${pkType} ${pkName}) {\n`;
    classContent += `        JsonNode json = request.body().asJson();\n`;
    classContent += `        ${modelName} ${modelVar} = Json.fromJson(json, ${modelName}.class);\n`;
    classContent += `        return ${serviceVar}.update(${pkName}, ${modelVar}).thenApply(updated ->\n`;
    classContent += `            ok(Json.toJson(updated))\n`;
    classContent += `        );\n`;
    classContent += `    }\n\n`;

    // delete
    classContent += `    public CompletionStage<Result> delete(Http.Request request, ${pkType} ${pkName}, String updatedAt) {\n`;
    classContent += `        return ${serviceVar}.delete(${pkName}, Instant.parse(updatedAt)).thenApply(result -> ok());\n`;
    classContent += `    }\n\n`;

    // exportCsv
    classContent += `    public CompletionStage<Result> exportCsv(Http.Request request) {\n`;
    classContent += `        Map<String, String> params = request.queryString().entrySet().stream()\n`;
    classContent += `            .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue()[0]));\n`;
    classContent += `        ObjectMapper mapper = new ObjectMapper();\n`;
    classContent += `        ${modelName} filter = mapper.convertValue(params, ${modelName}.class);\n`;
    classContent += `        return ${serviceVar}.exportCsv(filter).thenApply(csv ->\n`;
    classContent += `            CsvResult.ok(csv, "${table.tableName}.csv")\n`;
    classContent += `        );\n`;
    classContent += `    }\n\n`;

    // importCsv
    classContent += `    public CompletionStage<Result> importCsv(Http.Request request) {\n`;
    classContent += `        return CsvImportHandler.handle(request, file ->\n`;
    classContent += `            ${serviceVar}.importCsv(file).thenApply(result -> {\n`;
    classContent += `                ObjectNode successJson = Json.newObject();\n`;
    classContent += `                successJson.put("message", "CSV imported successfully.");\n`;
    classContent += `                successJson.put("imported_count", result);\n`;
    classContent += `                return ok(successJson);\n`;
    classContent += `            }\n`;
    classContent += `        ));\n`;
    classContent += `    }\n`;

    classContent += `}\n`;

    files.push({ path: `controllers/api/${controllerName}.java`, content: classContent });
  });

  return files;
}
