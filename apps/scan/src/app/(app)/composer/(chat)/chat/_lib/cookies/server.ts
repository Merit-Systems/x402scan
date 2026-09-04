import { cookies } from "next/headers";

import { COOKIE_KEYS } from "./keys";

import type { ChatConfig } from "../../../_types/chat-config";

function parseResources(value: string | undefined): ChatConfig["resources"] {
  if (!value) return [];
  return JSON.parse(decodeURIComponent(value)) as ChatConfig["resources"];
}

export const serverCookieUtils = {
  async getConfig(): Promise<ChatConfig> {
    try {
      const cookieStore = await cookies();

      return {
        model: cookieStore.get(COOKIE_KEYS.SELECTED_CHAT_MODEL)?.value,
        resources: parseResources(
          cookieStore.get(COOKIE_KEYS.RESOURCES)?.value
        ),
      };
    } catch (error) {
      console.warn("Failed to read cookies:", error);
      return {};
    }
  },
};
