-- Performance indexes for agents and tools queries
-- See: apps/scan/src/services/db/agent-config/list.ts
-- See: apps/scan/src/services/db/composer/tool-call.ts

-- Indexes for Agents query optimization
CREATE INDEX IF NOT EXISTS "Message_chatId_createdAt_role_idx" 
  ON "public"."Message" ("chatId", "createdAt") WHERE role = 'assistant';

CREATE INDEX IF NOT EXISTS "Chat_userAgentConfigurationId_idx" 
  ON "public"."Chat" ("userAgentConfigurationId") WHERE "userAgentConfigurationId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "ToolCall_chatId_createdAt_idx" 
  ON "public"."ToolCall" ("chatId", "createdAt");

-- Indexes for Tools query optimization
CREATE INDEX IF NOT EXISTS "ToolCall_resourceId_idx" 
  ON "public"."ToolCall" ("resourceId");

CREATE INDEX IF NOT EXISTS "AgentConfigurationResource_resourceId_idx" 
  ON "public"."AgentConfigurationResource" ("resourceId");

CREATE INDEX IF NOT EXISTS "AgentConfigurationResource_agentConfigurationId_idx" 
  ON "public"."AgentConfigurationResource" ("agentConfigurationId");

-- Indexes for Feed query optimization
-- See: apps/scan/src/services/db/agent-config/feed.ts
CREATE INDEX IF NOT EXISTS "ToolCall_createdAt_desc_idx" 
  ON "public"."ToolCall" ("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Message_createdAt_desc_role_user_idx" 
  ON "public"."Message" ("createdAt" DESC) WHERE role = 'user';
