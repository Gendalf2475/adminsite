# Majure LuckPerms Bridge

Paper 1.20+ plugin that connects LuckPerms staff groups to the MAJURE admin panel.

## Build

```bash
./gradlew build
```

The plugin jar is created in `build/libs/`.

## Install

1. Put LuckPerms and `MajureLuckPermsBridge-0.2.0.jar` in the Paper server `plugins/` directory. Remove older Majure bridge jars first.
2. Start the server once so `plugins/MajureLuckPermsBridge/config.yml` is created.
3. Set `adminBaseUrl`, `apiToken`, `serverName`, and `staffGroups`.
4. Keep `staffGroups` aligned with the site `.env` value `LUCKPERMS_STAFF_GROUPS`.
5. Set `pollIntervalSeconds: 1` if rank changes should be picked up almost immediately.
6. Restart the server or run `/majurebridge reload`.
7. Run `/majurebridge status` to verify the admin URL, one-second polling, and the last successful API request.

The plugin pulls queued rank changes from the site, applies the selected LuckPerms group, and posts the execution result back to the site.
