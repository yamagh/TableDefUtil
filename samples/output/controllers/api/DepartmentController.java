package controllers.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import controllers.actions.Authenticated;
import libraries.CsvImportHandler;
import models.Department;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Http;
import play.mvc.Result;
import services.DepartmentService;
import libraries.CsvResult;
import javax.inject.Inject;
import java.time.Instant;
import java.util.concurrent.CompletionStage;

/**
 * 部署 のコントローラー
 */
@Authenticated
public class DepartmentController extends Controller {

    private final DepartmentService departmentService;

    @Inject
    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    public CompletionStage<Result> find(Http.Request request) {
        int offset = request.queryString("offset").map(Integer::parseInt).orElse(0);
        int limit = request.queryString("limit").map(Integer::parseInt).orElse(Integer.MAX_VALUE);
        JsonNode json = request.body().asJson();
        Department filter = json == null ? new Department() : Json.fromJson(json, Department.class);
        return departmentService.find(filter, offset, limit).thenApply(result -> ok(result));
    }

    public CompletionStage<Result> findById(Http.Request request, Long id) {
        return departmentService.findById(id).thenApply(departmentOpt ->
            departmentOpt.map(m -> ok(Json.toJson(m)))
                .orElse(notFound())
        );
    }

    public CompletionStage<Result> create(Http.Request request) {
        JsonNode json = request.body().asJson();
        Department department = Json.fromJson(json, Department.class);
        return departmentService.create(department).thenApply(inserted ->
            created(Json.toJson(inserted))
        );
    }

    public CompletionStage<Result> update(Http.Request request, Long id) {
        JsonNode json = request.body().asJson();
        Department department = Json.fromJson(json, Department.class);
        return departmentService.update(id, department).thenApply(updated ->
            ok(Json.toJson(updated))
        );
    }

    public CompletionStage<Result> delete(Http.Request request, Long id, String updatedAt) {
        return departmentService.delete(id, Instant.parse(updatedAt)).thenApply(result -> ok());
    }

    public CompletionStage<Result> exportCsv(Http.Request request) {
        JsonNode json = request.body().asJson();
        Department filter = json == null ? new Department() : Json.fromJson(json, Department.class);
        return departmentService.exportCsv(filter).thenApply(csv ->
            CsvResult.ok(csv, "department.csv")
        );
    }

    public CompletionStage<Result> importCsv(Http.Request request) {
        return CsvImportHandler.handle(request, file ->
            departmentService.importCsv(file).thenApply(result -> {
                ObjectNode successJson = Json.newObject();
                successJson.put("message", "CSV imported successfully.");
                successJson.put("imported_count", result);
                return ok(successJson);
            }
        ));
    }
}