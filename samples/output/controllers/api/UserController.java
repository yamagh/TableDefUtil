package controllers.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import controllers.actions.Authenticated;
import libraries.CsvImportHandler;
import models.User;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Http;
import play.mvc.Result;
import services.UserService;
import libraries.CsvResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.concurrent.CompletionStage;
import javax.inject.Inject;
import java.time.Instant;

/**
 * ユーザー のコントローラー
 */
@Authenticated
public class UserController extends Controller {

    private final UserService userService;

    @Inject
    public UserController(UserService userService) {
        this.userService = userService;
    }

    public CompletionStage<Result> find(Http.Request request) {
        int offset = request.queryString("offset").map(Integer::parseInt).orElse(0);
        int limit = request.queryString("limit").map(Integer::parseInt).orElse(Integer.MAX_VALUE);
        Map<String, String> params = request.queryString().entrySet().stream()
            .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue()[0]));
        ObjectMapper mapper = new ObjectMapper();
        User filter = mapper.convertValue(params, User.class);
        return userService.find(filter, offset, limit).thenApply(result -> ok(result));
    }

    public CompletionStage<Result> findById(Http.Request request, Long id) {
        return userService.findById(id).thenApply(userOpt ->
            userOpt.map(m -> ok(Json.toJson(m)))
                .orElse(notFound())
        );
    }

    public CompletionStage<Result> create(Http.Request request) {
        JsonNode json = request.body().asJson();
        User user = Json.fromJson(json, User.class);
        return userService.create(user).thenApply(inserted ->
            created(Json.toJson(inserted))
        );
    }

    public CompletionStage<Result> update(Http.Request request, Long id) {
        JsonNode json = request.body().asJson();
        User user = Json.fromJson(json, User.class);
        return userService.update(id, user).thenApply(updated ->
            ok(Json.toJson(updated))
        );
    }

    public CompletionStage<Result> delete(Http.Request request, Long id, String updatedAt) {
        return userService.delete(id, Instant.parse(updatedAt)).thenApply(result -> ok());
    }

    public CompletionStage<Result> exportCsv(Http.Request request) {
        Map<String, String> params = request.queryString().entrySet().stream()
            .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue()[0]));
        ObjectMapper mapper = new ObjectMapper();
        User filter = mapper.convertValue(params, User.class);
        return userService.exportCsv(filter).thenApply(csv ->
            CsvResult.ok(csv, "user.csv")
        );
    }

    public CompletionStage<Result> importCsv(Http.Request request) {
        return CsvImportHandler.handle(request, file ->
            userService.importCsv(file).thenApply(result -> {
                ObjectNode successJson = Json.newObject();
                successJson.put("message", "CSV imported successfully.");
                successJson.put("imported_count", result);
                return ok(successJson);
            }
        ));
    }
}