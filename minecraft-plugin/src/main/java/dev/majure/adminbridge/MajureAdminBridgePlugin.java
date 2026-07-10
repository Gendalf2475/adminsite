package dev.majure.adminbridge;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.NodeType;
import net.luckperms.api.node.types.InheritanceNode;
import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.RegisteredServiceProvider;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public final class MajureAdminBridgePlugin extends JavaPlugin {
    private static final String MINECRAFT_USERNAME_PATTERN = "^[A-Za-z0-9_]{2,16}$";

    private LuckPerms luckPerms;
    private PluginConfig bridgeConfig;
    private AdminApiClient apiClient;
    private BukkitTask pollTask;
    private BukkitTask syncTask;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        if (!setupLuckPerms()) {
            getLogger().severe("LuckPerms provider is not available. Disabling MajureLuckPermsBridge.");
            Bukkit.getPluginManager().disablePlugin(this);
            return;
        }
        reloadBridge();
        if (!bridgeConfig.isConfigured()) {
            getLogger().severe("config.yml is incomplete. Set adminBaseUrl, apiToken, serverName, and staffGroups.");
            Bukkit.getPluginManager().disablePlugin(this);
            return;
        }
        scheduleTasks();
        getLogger().info("Majure LuckPerms bridge enabled for " + bridgeConfig.staffGroups().size() + " staff groups.");
    }

    @Override
    public void onDisable() {
        cancelTasks();
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("majure.bridge.admin")) {
            sender.sendMessage("No permission.");
            return true;
        }
        String action = args.length == 0 ? "status" : args[0].toLowerCase();
        switch (action) {
            case "reload" -> {
                reloadConfig();
                reloadBridge();
                if (!bridgeConfig.isConfigured()) {
                    sender.sendMessage("Majure bridge config is incomplete.");
                    return true;
                }
                scheduleTasks();
                sender.sendMessage("Majure bridge reloaded.");
            }
            case "sync" -> {
                triggerStaffSync();
                sender.sendMessage("Majure staff sync queued.");
            }
            case "poll" -> {
                Bukkit.getScheduler().runTaskAsynchronously(this, this::pollCommandsSafely);
                sender.sendMessage("Majure command poll queued.");
            }
            default -> sender.sendMessage("Majure bridge is running. Use /" + label + " <reload|sync|poll>.");
        }
        return true;
    }

    private boolean setupLuckPerms() {
        RegisteredServiceProvider<LuckPerms> provider = Bukkit.getServicesManager().getRegistration(LuckPerms.class);
        if (provider == null) {
            return false;
        }
        luckPerms = provider.getProvider();
        return true;
    }

    private void reloadBridge() {
        bridgeConfig = PluginConfig.load(this);
        apiClient = new AdminApiClient(bridgeConfig);
    }

    private void scheduleTasks() {
        cancelTasks();
        pollTask = Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::pollCommandsSafely, 100L, bridgeConfig.pollIntervalTicks());
        syncTask = Bukkit.getScheduler().runTaskTimer(this, this::triggerStaffSync, 200L, bridgeConfig.syncIntervalTicks());
    }

    private void cancelTasks() {
        if (pollTask != null) {
            pollTask.cancel();
            pollTask = null;
        }
        if (syncTask != null) {
            syncTask.cancel();
            syncTask = null;
        }
    }

    private void pollCommandsSafely() {
        try {
            for (AdminApiClient.AdminCommand command : apiClient.pullCommands()) {
                handleCommand(command);
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            getLogger().warning("Command polling was interrupted.");
        } catch (Exception exception) {
            getLogger().warning("Failed to poll commands: " + exception.getMessage());
        }
    }

    private void handleCommand(AdminApiClient.AdminCommand command) {
        CommandOutcome outcome;
        if (!"luckperms_change_group".equals(command.type())) {
            outcome = CommandOutcome.failure("Unsupported command type: " + command.type());
        } else {
            outcome = applyLuckPermsGroup(command.payload());
        }

        if (outcome.success()) {
            getLogger().info("Command " + command.id() + " completed successfully.");
        } else {
            getLogger().warning("Command " + command.id() + " failed: " + outcome.errorMessage());
        }

        try {
            apiClient.reportCommandResult(command.id(), outcome.success(), outcome.result(), outcome.errorMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            getLogger().warning("Command result reporting was interrupted for " + command.id());
        } catch (Exception exception) {
            getLogger().warning("Failed to report command result for " + command.id() + ": " + exception.getMessage());
        }
    }

    private CommandOutcome applyLuckPermsGroup(JsonObject payload) {
        try {
            String group = PluginConfig.normalizeGroup(requiredString(payload, "group"));
            if (!bridgeConfig.isStaffGroup(group)) {
                return CommandOutcome.failure("Group is not allowed by plugin staffGroups: " + group);
            }

            String username = requiredString(payload, "username");
            if (!username.matches(MINECRAFT_USERNAME_PATTERN)) {
                return CommandOutcome.failure("Invalid Minecraft username: " + username);
            }
            replaceStaffGroup(username, group);

            JsonObject result = new JsonObject();
            result.addProperty("username", username);
            result.addProperty("group", group);
            return CommandOutcome.success(result);
        } catch (Exception exception) {
            return CommandOutcome.failure(exception.getMessage());
        }
    }

    private void replaceStaffGroup(String username, String group) throws Exception {
        for (String staffGroup : bridgeConfig.staffGroups()) {
            if (!staffGroup.equals(group)) {
                dispatchLuckPermsCommand("lp user " + username + " parent remove " + staffGroup);
            }
        }
        dispatchLuckPermsCommand("lp user " + username + " parent add " + group);
    }

    private void dispatchLuckPermsCommand(String command) throws Exception {
        Boolean dispatched = Bukkit.getScheduler()
                .callSyncMethod(this, () -> Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command))
                .get(bridgeConfig.requestTimeout().toMillis(), TimeUnit.MILLISECONDS);
        if (!Boolean.TRUE.equals(dispatched)) {
            throw new IllegalStateException("LuckPerms command was not accepted: " + command);
        }
    }

    private void triggerStaffSync() {
        OfflinePlayer[] players = Bukkit.getOfflinePlayers();
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> syncStaffSafely(players));
    }

    private void syncStaffSafely(OfflinePlayer[] players) {
        try {
            List<AdminApiClient.StaffSyncRow> rows = collectStaffRows(players);
            if (rows.isEmpty()) {
                getLogger().fine("No configured staff groups found during sync.");
                return;
            }
            apiClient.syncStaff(rows);
            getLogger().info("Synced " + rows.size() + " LuckPerms staff records to admin panel.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            getLogger().warning("Staff sync was interrupted.");
        } catch (Exception exception) {
            getLogger().warning("Failed to sync staff: " + exception.getMessage());
        }
    }

    private List<AdminApiClient.StaffSyncRow> collectStaffRows(OfflinePlayer[] players) throws Exception {
        List<AdminApiClient.StaffSyncRow> rows = new ArrayList<>();
        for (OfflinePlayer player : players) {
            String username = player.getName();
            if (username == null || username.isBlank()) {
                continue;
            }
            User user = await(luckPerms.getUserManager().loadUser(player.getUniqueId()), bridgeConfig.requestTimeout());
            Optional<String> group = findConfiguredStaffGroup(user);
            group.ifPresent(value -> rows.add(new AdminApiClient.StaffSyncRow(
                    username,
                    value,
                    value,
                    "ACTIVE"
            )));
        }
        return rows;
    }

    private Optional<String> findConfiguredStaffGroup(User user) {
        Set<String> userGroups = new HashSet<>();
        user.getNodes(NodeType.INHERITANCE).forEach(node -> userGroups.add(PluginConfig.normalizeGroup(node.getGroupName())));
        for (String group : bridgeConfig.staffGroups()) {
            if (userGroups.contains(group)) {
                return Optional.of(group);
            }
        }
        return Optional.empty();
    }

    private static String requiredString(JsonObject object, String key) {
        String value = optionalString(object, key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Command payload is missing " + key + ".");
        }
        return value;
    }

    private static String optionalString(JsonObject object, String key) {
        JsonElement element = object.get(key);
        return element == null || element.isJsonNull() ? null : element.getAsString().trim();
    }

    private static <T> T await(java.util.concurrent.CompletableFuture<T> future, Duration timeout) throws Exception {
        return future.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
    }

    private record CommandOutcome(boolean success, JsonObject result, String errorMessage) {
        static CommandOutcome success(JsonObject result) {
            return new CommandOutcome(true, result, null);
        }

        static CommandOutcome failure(String message) {
            return new CommandOutcome(false, null, message == null || message.isBlank() ? "Unknown error" : message);
        }
    }
}
