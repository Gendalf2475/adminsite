package dev.majure.adminbridge;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.plugin.java.JavaPlugin;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

public record PluginConfig(
        String adminBaseUrl,
        String apiToken,
        String serverName,
        List<String> staffGroups,
        Duration pollInterval,
        Duration syncInterval,
        Duration requestTimeout
) {
    public static PluginConfig load(JavaPlugin plugin) {
        FileConfiguration config = plugin.getConfig();
        return new PluginConfig(
                trimTrailingSlashes(config.getString("adminBaseUrl", "")),
                trim(config.getString("apiToken", "")),
                trim(config.getString("serverName", "main")),
                normalizeGroups(config.getStringList("staffGroups")),
                seconds(config.getLong("pollIntervalSeconds", 1), 1),
                seconds(config.getLong("syncIntervalSeconds", 300), 10),
                seconds(config.getLong("requestTimeoutSeconds", 10), 1)
        );
    }

    public boolean isConfigured() {
        return !adminBaseUrl.isBlank()
                && !apiToken.isBlank()
                && !"replace-with-plugin-token".equals(apiToken)
                && !serverName.isBlank()
                && !staffGroups.isEmpty();
    }

    public long pollIntervalTicks() {
        return Math.max(20L, pollInterval.toSeconds() * 20L);
    }

    public long syncIntervalTicks() {
        return Math.max(200L, syncInterval.toSeconds() * 20L);
    }

    public boolean isStaffGroup(String group) {
        return staffGroups.contains(normalizeGroup(group));
    }

    public static String normalizeGroup(String group) {
        return trim(group).toLowerCase(Locale.ROOT);
    }

    private static List<String> normalizeGroups(List<String> groups) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String group : groups) {
            String value = normalizeGroup(group);
            if (!value.isBlank()) {
                normalized.add(value);
            }
        }
        return new ArrayList<>(normalized);
    }

    private static Duration seconds(long seconds, long minimum) {
        return Duration.ofSeconds(Math.max(minimum, seconds));
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimTrailingSlashes(String value) {
        String trimmed = trim(value);
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
