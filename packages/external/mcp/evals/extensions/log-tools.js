/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Find the Claude session log file by sessionId
 * Session logs are stored in ~/.claude/projects/[encoded-path]/[sessionId].jsonl
 */
function findSessionLogFile(sessionId) {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');

  if (!fs.existsSync(claudeProjectsDir)) {
    return null;
  }

  // Search all project directories for the session file
  const projectDirs = fs.readdirSync(claudeProjectsDir);

  for (const dir of projectDirs) {
    const sessionFile = path.join(claudeProjectsDir, dir, `${sessionId}.jsonl`);
    if (fs.existsSync(sessionFile)) {
      return sessionFile;
    }
  }

  return null;
}

/**
 * Parse a Claude session log file and extract all tool calls
 */
function parseSessionLog(sessionFilePath) {
  const content = fs.readFileSync(sessionFilePath, 'utf-8');
  const lines = content.trim().split('\n');

  const toolCalls = [];
  const toolResults = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);

      // Look for assistant messages with tool_use
      if (entry.type === 'assistant' && entry.message?.content) {
        for (const block of entry.message.content) {
          if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id,
              name: block.name,
              input: block.input,
              timestamp: entry.timestamp,
              model: entry.message.model,
            });
          }
        }
      }

      // Look for tool results
      if (entry.type === 'user' && entry.message?.content) {
        for (const block of entry.message.content) {
          if (block.type === 'tool_result') {
            const isError = block.is_error || false;
            let resultPreview = '';

            if (typeof block.content === 'string') {
              resultPreview = block.content.slice(0, 200);
            } else if (Array.isArray(block.content)) {
              const textBlock = block.content.find(b => b.type === 'text');
              if (textBlock) {
                resultPreview = textBlock.text.slice(0, 200);
              }
            }

            toolResults.push({
              tool_use_id: block.tool_use_id,
              is_error: isError,
              preview: resultPreview,
              timestamp: entry.timestamp,
            });
          }
        }
      }
    } catch {
      // Skip malformed lines
    }
  }

  return { toolCalls, toolResults };
}

/**
 * Categorize tool calls by type
 */
function categorizeToolCalls(toolCalls) {
  const categories = {
    mcp: [], // MCP tools (mcp__*)
    builtin: [], // Built-in Claude Code tools
    web: [], // Web tools (WebSearch, WebFetch)
    file: [], // File tools (Read, Write, Edit, etc.)
    shell: [], // Shell/Bash tools
    other: [], // Other tools
  };

  const builtinFileTools = [
    'Read',
    'Write',
    'Edit',
    'MultiEdit',
    'Glob',
    'Grep',
    'LS',
    'Delete',
  ];
  const builtinWebTools = ['WebSearch', 'WebFetch'];
  const builtinShellTools = ['Bash', 'Shell', 'Task'];

  for (const call of toolCalls) {
    const name = call.name;

    if (name.startsWith('mcp__')) {
      categories.mcp.push(call);
    } else if (builtinWebTools.includes(name)) {
      categories.web.push(call);
      categories.builtin.push(call);
    } else if (builtinFileTools.includes(name)) {
      categories.file.push(call);
      categories.builtin.push(call);
    } else if (builtinShellTools.includes(name)) {
      categories.shell.push(call);
      categories.builtin.push(call);
    } else {
      categories.other.push(call);
    }
  }

  return categories;
}

/**
 * Match tool calls with their results
 */
function matchToolCallsWithResults(toolCalls, toolResults) {
  const resultsById = {};
  for (const result of toolResults) {
    resultsById[result.tool_use_id] = result;
  }

  return toolCalls.map(call => ({
    ...call,
    result: resultsById[call.id] || null,
  }));
}

/**
 * Promptfoo extension for logging tool usage from Claude session logs
 */
module.exports = async function (hookName, context) {
  if (hookName === 'afterEach') {
    const raw = context.result.response?.raw;
    const sessionId = context.result.response?.sessionId;

    let toolAnalysis = null;

    // Try to parse session log if we have a sessionId
    if (sessionId) {
      const sessionFile = findSessionLogFile(sessionId);

      if (sessionFile) {
        try {
          const { toolCalls, toolResults } = parseSessionLog(sessionFile);
          const matchedCalls = matchToolCallsWithResults(
            toolCalls,
            toolResults
          );
          const categories = categorizeToolCalls(toolCalls);

          // Count successful vs failed calls
          const successfulCalls = matchedCalls.filter(
            c => c.result && !c.result.is_error
          );
          const failedCalls = matchedCalls.filter(
            c => c.result && c.result.is_error
          );
          const pendingCalls = matchedCalls.filter(c => !c.result);

          toolAnalysis = {
            totalCalls: toolCalls.length,
            successfulCalls: successfulCalls.length,
            failedCalls: failedCalls.length,
            pendingCalls: pendingCalls.length,
            byCategory: {
              mcp: categories.mcp.length,
              web: categories.web.length,
              file: categories.file.length,
              shell: categories.shell.length,
              other: categories.other.length,
            },
            mcpTools: [...new Set(categories.mcp.map(c => c.name))],
            webTools: [...new Set(categories.web.map(c => c.name))],
            allToolNames: [...new Set(toolCalls.map(c => c.name))],
            calls: matchedCalls,
          };
        } catch (e) {
          console.error('Failed to parse session log:', e.message);
        }
      }
    }

    // Also parse the raw response for additional metrics
    let rawMetrics = {};
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        rawMetrics = {
          numTurns: parsed.num_turns,
          durationMs: parsed.duration_ms,
          durationApiMs: parsed.duration_api_ms,
          totalCostUsd: parsed.total_cost_usd,
          modelUsage: parsed.modelUsage,
          permissionDenials: parsed.permission_denials || [],
        };
      } catch {
        // Ignore parse errors
      }
    }

    // Build comprehensive tool usage data
    const toolUsage = {
      sessionId,
      ...rawMetrics,
      toolAnalysis,
    };

    // Add to result metadata (appears in viewer)
    context.result.metadata = context.result.metadata || {};
    context.result.metadata.toolUsage = {
      numTurns: rawMetrics.numTurns || 0,
      totalCalls: toolAnalysis?.totalCalls || 0,
      mcpCalls: toolAnalysis?.byCategory?.mcp || 0,
      webCalls: toolAnalysis?.byCategory?.web || 0,
      fileCalls: toolAnalysis?.byCategory?.file || 0,
      shellCalls: toolAnalysis?.byCategory?.shell || 0,
      successRate: toolAnalysis
        ? (
            (toolAnalysis.successfulCalls /
              Math.max(toolAnalysis.totalCalls, 1)) *
            100
          ).toFixed(1) + '%'
        : 'N/A',
      mcpToolsUsed: toolAnalysis?.mcpTools || [],
      allToolsUsed: toolAnalysis?.allToolNames || [],
      costUsd: rawMetrics.totalCostUsd,
      permissionDenials:
        rawMetrics.permissionDenials?.map(d => d.tool_name) || [],
    };

    // Add as named scores (appears as metrics in viewer columns)
    context.result.namedScores = context.result.namedScores || {};
    context.result.namedScores.num_turns = rawMetrics.numTurns || 0;
    context.result.namedScores.total_tool_calls = toolAnalysis?.totalCalls || 0;
    context.result.namedScores.mcp_calls = toolAnalysis?.byCategory?.mcp || 0;
    context.result.namedScores.web_calls = toolAnalysis?.byCategory?.web || 0;
    context.result.namedScores.file_calls = toolAnalysis?.byCategory?.file || 0;
    context.result.namedScores.successful_calls =
      toolAnalysis?.successfulCalls || 0;
    context.result.namedScores.failed_calls = toolAnalysis?.failedCalls || 0;
    context.result.namedScores.cost_usd = rawMetrics.totalCostUsd || 0;
    context.result.namedScores.duration_sec = rawMetrics.durationMs
      ? rawMetrics.durationMs / 1000
      : 0;

    // Log to console
    const providerLabel = context.result.provider?.label || 'Unknown';
    const testDesc = context.result.testCase?.description || 'Unknown';

    console.log('\n=== Tool Usage Summary ===');
    console.log(`Provider: ${providerLabel}`);
    console.log(`Test: ${testDesc}`);
    console.log(`Turns: ${rawMetrics.numTurns || 0}`);
    console.log(
      `Tool Calls: ${toolAnalysis?.totalCalls || 0} total (${toolAnalysis?.successfulCalls || 0} success, ${toolAnalysis?.failedCalls || 0} failed)`
    );
    console.log(
      `  MCP: ${toolAnalysis?.byCategory?.mcp || 0}, Web: ${toolAnalysis?.byCategory?.web || 0}, File: ${toolAnalysis?.byCategory?.file || 0}`
    );
    if (toolAnalysis?.mcpTools?.length > 0) {
      console.log(`  MCP Tools: ${toolAnalysis.mcpTools.join(', ')}`);
    }
    if (rawMetrics.permissionDenials?.length > 0) {
      console.log(
        `  Denied: ${rawMetrics.permissionDenials.map(d => d.tool_name).join(', ')}`
      );
    }
    console.log(`Cost: $${(rawMetrics.totalCostUsd || 0).toFixed(4)}`);

    // Write detailed log to JSONL file
    const logEntry = {
      timestamp: new Date().toISOString(),
      provider: providerLabel,
      test: testDesc,
      ...toolUsage,
    };

    const logFile = path.join(__dirname, '..', 'tool-usage-log.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    // Write latest single result for quick inspection
    fs.writeFileSync(
      path.join(__dirname, '..', 'tool-usage.json'),
      JSON.stringify(toolUsage, null, 2)
    );

    return context;
  }

  if (hookName === 'afterAll') {
    console.log('\n=== Evaluation Complete ===');
    console.log(`Total test cases: ${context.results?.length || 0}`);

    // Calculate aggregate stats
    let totalCost = 0;
    let totalTurns = 0;
    let totalToolCalls = 0;
    let totalMcpCalls = 0;
    let passCount = 0;

    for (const result of context.results || []) {
      if (result.namedScores) {
        totalCost += result.namedScores.cost_usd || 0;
        totalTurns += result.namedScores.num_turns || 0;
        totalToolCalls += result.namedScores.total_tool_calls || 0;
        totalMcpCalls += result.namedScores.mcp_calls || 0;
      }
      if (result.success) passCount++;
    }

    const count = context.results?.length || 1;
    console.log(
      `Pass rate: ${passCount}/${count} (${((passCount / count) * 100).toFixed(1)}%)`
    );
    console.log(`Total cost: $${totalCost.toFixed(4)}`);
    console.log(`Average turns: ${(totalTurns / count).toFixed(1)}`);
    console.log(`Total tool calls: ${totalToolCalls} (${totalMcpCalls} MCP)`);
  }
};
