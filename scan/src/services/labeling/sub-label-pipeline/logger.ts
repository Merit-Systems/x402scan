// ============================================================================
// LOGGING
// ============================================================================
//
// Example output when running the validation pipeline:
//
// ============================================================
// ℹ Starting validation pipeline for AI {"resources":150,"initialSubcategories":5,...}
// ℹ Initial subcategories: Chat/Conversational AI, Image Generation, ...
//
// ────────────────────────────────────────────────────────────
// ℹ 🔄 Iteration 1/3 {"subcategories":[...]}
// ℹ Step 1: Assigning resources to subcategories...
// ℹ Starting resource assignment for 150 resources {"mainCategory":"AI",...}
// ▶ [========            ] 40% Assigned 60/150 resources
// ▶ [====================] 100% Assigned 150/150 resources
// ℹ Assignment complete in 12.3s {"avgConfidence":0.87}
// ℹ Step 2: Analyzing distribution and overlap...
// ℹ
// 📊 Quality Metrics: {"qualityScore":"73.2/100","gini":"0.186",...}
// ℹ
// 📈 Distribution Details:
// ℹ   ✓ Chat/Conversational AI: 45 resources (30.0%) {"isEmpty":false,...}
// ℹ   ✓ Image Generation: 38 resources (25.3%) {"isEmpty":false,...}
// ⚠   ⚠️ Found 12 ambiguous assignments
// ⚠ Top conflicted pairs:
// ⚠   - Chat/Conversational AI ↔ Agent/Automation: 8 conflicts
// ℹ ✨ New best quality score: 73.2/100
// ℹ
// 🎯 Quality Gates: {"meetsThreshold":"✗ Score 73.2 < 75",...}
// ℹ Iteration completed in 15.8s
// ℹ
// Step 3: Requesting LLM feedback for improvements...
// ℹ Feedback received in 2.1s {"severity":"6/10",...}
// ⚠
// 🔍 Problems identified:
// ⚠   1. Chat/Conversational AI and Agent/Automation have significant overlap
// ℹ
// 💡 Suggestions:
// ℹ   1. Consider splitting conversational agents from automation agents
// ...

export interface Logger {
  info: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
  progress: (current: number, total: number, message: string) => void;
}

class ConsoleLogger implements Logger {
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
  };

  info(message: string, meta?: Record<string, any>) {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(
      `${this.colors.cyan}ℹ${this.colors.reset} ${message}${this.colors.dim}${metaStr}${this.colors.reset}`
    );
  }

  warn(message: string, meta?: Record<string, any>) {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.warn(
      `${this.colors.yellow}⚠${this.colors.reset} ${message}${this.colors.dim}${metaStr}${this.colors.reset}`
    );
  }

  error(message: string, meta?: Record<string, any>) {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.error(
      `${this.colors.red}✖${this.colors.reset} ${message}${this.colors.dim}${metaStr}${this.colors.reset}`
    );
  }

  debug(message: string, meta?: Record<string, any>) {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.debug(
      `${this.colors.dim}🔍 ${message}${metaStr}${this.colors.reset}`
    );
  }

  progress(current: number, total: number, message: string) {
    const percentage = ((current / total) * 100).toFixed(0);
    const bar = this.progressBar(current, total, 20);
    console.log(
      `${this.colors.blue}▶${this.colors.reset} ${bar} ${percentage}% ${message}`
    );
  }

  private progressBar(current: number, total: number, width: number): string {
    const filled = Math.floor((current / total) * width);
    const empty = width - filled;
    return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
  }
}

export const defaultLogger = new ConsoleLogger();
