import Anthropic from '@anthropic-ai/sdk';

// Result type for Claude API calls
export type ClaudeResult<T> =
  { success: true; data: T } | { success: false; error: { message: string } };

// Model configuration with fallback hierarchy
const CLAUDE_MODELS = {
  // Primary: Use environment variable if set
  fromEnv: process.env['ANTHROPIC_MODEL'],
  // Secondary: cheapest current Sonnet model
  latest: 'claude-sonnet-5',
  // Tertiary: fallback if the primary model is unavailable
  fallback: 'claude-sonnet-4-6',
} as const;

/**
 * Get the Claude model to use, with automatic fallback
 */
function getClaudeModel(): string {
  // 1. Check environment variable first (for explicit control)
  if (CLAUDE_MODELS.fromEnv) {
    return CLAUDE_MODELS.fromEnv;
  }

  // 2. Use latest alias for automatic updates (development/staging)
  if (process.env['NODE_ENV'] !== 'production') {
    return CLAUDE_MODELS.latest;
  }

  // 3. Use specific version in production for stability
  return CLAUDE_MODELS.fallback;
}

/**
 * Call Claude using the SDK with a prompt and input data
 */
export async function callClaude(
  promptName: string,
  inputData: unknown,
): Promise<ClaudeResult<string>> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    return {
      success: false,
      error: { message: 'ANTHROPIC_API_KEY environment variable not set' },
    };
  }

  try {
    const client = new Anthropic({ apiKey });
    const model = getClaudeModel();

    const response = await client.messages.create({
      model,
      // Adaptive thinking counts toward max_tokens; a low cap can leave
      // zero room for the visible answer
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: `${promptName}\n\nInput data:\n\`\`\`json\n${JSON.stringify(inputData, null, 2)}\n\`\`\``,
        },
      ],
    });

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n');

    if (content.trim() === '') {
      return {
        success: false,
        error: {
          message:
            `Model returned no text (stop_reason: ${response.stop_reason}). ` +
            `If max_tokens was hit, thinking may have consumed the budget.`,
        },
      };
    }

    return { success: true, data: content };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Check if Claude SDK is available (API key is set)
 */
export async function isClaudeAvailable(): Promise<boolean> {
  return Boolean(process.env['ANTHROPIC_API_KEY']);
}
