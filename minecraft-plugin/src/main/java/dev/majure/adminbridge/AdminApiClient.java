package dev.majure.adminbridge;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

public final class AdminApiClient {
    private final Gson gson = new Gson();
    private final HttpClient httpClient;
    private final PluginConfig config;

    public AdminApiClient(PluginConfig config) {
        this.config = config;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(config.requestTimeout())
                .build();
    }

    public List<AdminCommand> pullCommands() throws IOException, InterruptedException {
        JsonObject response = post("/api/integrations/minecraft/pull-commands", new JsonObject());
        JsonArray data = response.has("data") && response.get("data").isJsonArray()
                ? response.getAsJsonArray("data")
                : new JsonArray();

        List<AdminCommand> commands = new ArrayList<>();
        for (JsonElement element : data) {
            if (!element.isJsonObject()) continue;
            JsonObject object = element.getAsJsonObject();
            String id = stringValue(object, "id");
            String type = stringValue(object, "type");
            JsonObject payload = object.has("payload") && object.get("payload").isJsonObject()
                    ? object.getAsJsonObject("payload")
                    : new JsonObject();
            if (!id.isBlank() && !type.isBlank()) {
                commands.add(new AdminCommand(id, type, payload));
            }
        }
        return commands;
    }

    public void reportCommandResult(String commandId, boolean success, JsonObject result, String errorMessage) throws IOException, InterruptedException {
        JsonObject body = new JsonObject();
        body.addProperty("commandId", commandId);
        body.addProperty("success", success);
        if (result != null) {
            body.add("result", result);
        }
        if (errorMessage != null && !errorMessage.isBlank()) {
            body.addProperty("errorMessage", errorMessage);
        }
        post("/api/integrations/minecraft/command-result", body);
    }

    public void syncStaff(List<StaffSyncRow> rows) throws IOException, InterruptedException {
        JsonObject body = new JsonObject();
        body.addProperty("serverName", config.serverName());
        JsonArray staff = new JsonArray();
        for (StaffSyncRow row : rows) {
            JsonObject item = new JsonObject();
            item.addProperty("username", row.username());
            item.addProperty("currentLuckPermsGroup", row.currentLuckPermsGroup());
            item.addProperty("projectPosition", row.projectPosition());
            item.addProperty("status", row.status());
            staff.add(item);
        }
        body.add("staff", staff);
        post("/api/integrations/minecraft/sync-staff", body);
    }

    private JsonObject post(String path, JsonObject body) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(config.adminBaseUrl() + path))
                .timeout(config.requestTimeout())
                .header("authorization", "Bearer " + config.apiToken())
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Admin API returned " + response.statusCode() + ": " + response.body());
        }
        if (response.body() == null || response.body().isBlank()) {
            return new JsonObject();
        }
        JsonElement parsed = JsonParser.parseString(response.body());
        return parsed.isJsonObject() ? parsed.getAsJsonObject() : new JsonObject();
    }

    private static String stringValue(JsonObject object, String key) {
        JsonElement value = object.get(key);
        return value == null || value.isJsonNull() ? "" : value.getAsString();
    }

    public record AdminCommand(String id, String type, JsonObject payload) {
    }

    public record StaffSyncRow(String username, String currentLuckPermsGroup, String projectPosition, String status) {
    }
}
