package controllers.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import controllers.actions.Authenticated;
import libraries.CsvImportHandler;
import models.Users;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Http;
import play.mvc.Result;
import services.UsersService;
import libraries.CsvResult;
import javax.inject.Inject;
import java.time.Instant;
import java.util.concurrent.CompletionStage;

/**
 * ユーザー のコントローラー
 */
@Authenticated
public class UsersController extends Controller {

    private final UsersService usersService;

    @Inject
    public UsersController(UsersService usersService) {
        this.usersService = usersService;
    }

    public CompletionStage<Result> find(Http.Request request) {
        int offset = request.queryString("offset").map(Integer::parseInt).orElse(0);
        int limit = request.queryString("limit").map(Integer::parseInt).orElse(Integer.MAX_VALUE);
        JsonNode json = request.body().asJson();
        Users filter = json == null ? new Users() : Json.fromJson(json, Users.class);
        return usersService.find(filter, offset, limit).thenApply(result -> ok(result));
    }

    public CompletionStage<Result> findById(Http.Request request, Long id) {
        return usersService.findById(id).thenApply(usersOpt ->
            usersOpt.map(m -> ok(Json.toJson(m)))
                .orElse(notFound())
        );
    }

    public CompletionStage<Result> create(Http.Request request) {
        JsonNode json = request.body().asJson();
        Users users = Json.fromJson(json, Users.class);
        return usersService.create(users).thenApply(inserted ->
            created(Json.toJson(inserted))
        );
    }

    public CompletionStage<Result> update(Http.Request request, Long id) {
        JsonNode json = request.body().asJson();
        Users users = Json.fromJson(json, Users.class);
        return usersService.update(id, users).thenApply(updated ->
            ok(Json.toJson(updated))
        );
    }

    public CompletionStage<Result> delete(Http.Request request, Long id, String updatedAt) {
        return usersService.delete(id, Instant.parse(updatedAt)).thenApply(result -> ok());
    }

    public CompletionStage<Result> exportCsv(Http.Request request) {
        JsonNode json = request.body().asJson();
        Users filter = json == null ? new Users() : Json.fromJson(json, Users.class);
        return usersService.exportCsv(filter).thenApply(csv ->
            CsvResult.ok(csv, "users.csv")
        );
    }

    public CompletionStage<Result> importCsv(Http.Request request) {
        return CsvImportHandler.handle(request, file ->
            usersService.importCsv(file).thenApply(result -> {
                ObjectNode successJson = Json.newObject();
                successJson.put("message", "CSV imported successfully.");
                successJson.put("imported_count", result);
                return ok(successJson);
            }
        ));
    }
}