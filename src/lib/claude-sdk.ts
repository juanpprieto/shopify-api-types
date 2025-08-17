import Anthropic from '@anthropic-ai/sdk';

// Result type for Claude API calls
export type ClaudeResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

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
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
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
