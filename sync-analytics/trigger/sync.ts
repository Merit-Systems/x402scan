import { schedules } from "@trigger.dev/sdk";
import { SyncConfig } from "./types";
import { createClient } from "@clickhouse/client";

export function createAnalyticsSyncTask(config: SyncConfig) {
    const clickhouse = createClient({
        url: process.env.CLICKHOUSE_URL,
        username: process.env.CLICKHOUSE_USER,
        password: process.env.CLICKHOUSE_PASSWORD,
    });
    return schedules.task({
        id: 'sync-analytics-' + config.name,
        cron: config.cron,
        maxDuration: config.maxDuration,
        machine: config.machine,
        run: async () => {
            const resultSet = await clickhouse.query({
                query: config.query,
                format: 'JSONEachRow',
            });
            const data = await resultSet.json();
            await config.persist(data);
        }
    })
}