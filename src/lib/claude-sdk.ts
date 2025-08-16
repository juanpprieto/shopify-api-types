import Anthropic from '@anthropic-ai/sdk';

// Type for Anthropic message response - removed as it's inferred from SDK
import fs from 'fs/promises';
import { match, P } from 'ts-pattern';

// Type for Claude SDK error with 2025 fields
type ClaudeError = {
  code?: string;
  message: string;
  type?: string;
  request_id?: string;
};

// Result type using ts-pattern principles
export type ClaudeResult<T> =
  | { success: true; data: T; request_id?: string }
  | { success: false; error: ClaudeError };

// Cache for prompt content
const promptCache = new Map<string, string>();

// Singleton client instance (best practice)
let clientInstance: Anthropic | null = null;

/**
 * Load a prompt from the .claude/commands directory
 */
async function loadPrompt(promptName: string): Promise<string | null> {
  // Check cache first
  if (promptCache.has(promptName)) {
    return promptCache.get(promptName) ?? null;
  }

  try {
    const promptPath = `./.claude/commands/${promptName}.md`;
    const content = await fs.readFile(promptPath, 'utf-8');
    promptCache.set(promptName, content);
    return content;
  } catch (error) {
    // Silent warning in production mode
    if (process.env['NODE_ENV'] !== 'production') {
      console.error(`Failed to load prompt ${promptName}:`, error);
    }
    return null;
  }
}

/**
 * Initialize Anthropic client with best practices
 */
function getClient(): Anthropic | null {
  if (clientInstance) {
    return clientInstance;
  }

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return null;
  }

  // Initialize with 2025 best practices
  clientInstance = new Anthropic({
    apiKey,
    maxRetries: 2, // SDK default, but explicit for clarity
    timeout: 60000, // 60 seconds timeout for non-streaming
    defaultHeaders: {
      'anthropic-version': '2023-06-01', // Current stable version
    },
  });

  return clientInstance;
}

/**
 * Call Claude using the SDK with a prompt and input data
 * Following 2025 best practices for error handling and retries
 */
export async function callClaude<T = unknown>(
  promptName: string,
  inputData: T,
  options: {
    model?: string;
    stream?: boolean;
    maxRetries?: number;
    timeout?: number;
  } = {},
): Promise<ClaudeResult<string>> {
  const {
    // IMPORTANT: Using Sonnet model for cost efficiency (5x cheaper than Opus)
    // Sonnet: $3/M input + $15/M output vs Opus: $15/M input + $75/M output
    model = 'claude-sonnet-4-20250514',
    stream = false,
    maxRetries,
    timeout,
  } = options;

  // Initialize client
  const client = getClient();
  if (!client) {
    return {
      success: false,
      error: {
        code: 'NO_API_KEY',
        message: 'ANTHROPIC_API_KEY environment variable not set',
      },
    };
  }

  // Load prompt
  const promptContent = await loadPrompt(promptName);
  if (!promptContent) {
    return {
      success: false,
      error: {
        code: 'PROMPT_NOT_FOUND',
        message: `Prompt file not found: ${promptName}.md`,
      },
    };
  }

  // Prepare the message
  const userMessage = `${promptContent}

Input data:
\`\`\`json
${JSON.stringify(inputData, null, 2)}
\`\`\``;

  try {
    // Use SDK's built-in retry mechanism
    const response = await client.messages.create(
      {
        model,
        max_tokens: 8192, // Sufficient for README generation (Claude 4 supports up to 64K)
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
        stream,
      },
      {
        // Per-request options override
        ...(maxRetries !== undefined && { maxRetries }),
        ...(timeout !== undefined && { timeout }),
      },
    );

    // Handle streaming response differently
    if (stream) {
      // For streaming, we'd need different handling
      throw new Error('Streaming not implemented yet');
    }

    // Type guard to ensure we have a Message
    if (!('content' in response)) {
      throw new Error('Unexpected response format');
    }

    // Extract text from response
    const messageResponse = response;
    const content = messageResponse.content
      .filter((block: { type: string; text?: string }) => block.type === 'text')
      .map((block: { type: string; text?: string }) => block.text ?? '')
      .join('\n');

    const requestId = (response as { _request_id?: string })._request_id;

    return {
      success: true,
      data: content,
      ...(requestId && { request_id: requestId }), // Only include if defined
    };
  } catch (error) {
    // Enhanced error handling with pattern matching
    const errorDetails = match(error)
      .with({ status: 429 }, (e) => ({
        code: 'rate_limit_error',
        message: (e as { message?: string }).message || 'Rate limit exceeded',
        request_id: (e as { headers?: Record<string, string> }).headers?.[
          'request-id'
        ],
      }))
      .with({ status: 500 }, (e) => ({
        code: 'api_error',
        message: (e as { message?: string }).message || 'Internal server error',
        request_id: (e as { headers?: Record<string, string> }).headers?.[
          'request-id'
        ],
      }))
      .with({ status: 529 }, (e) => ({
        code: 'overloaded_error',
        message:
          (e as { message?: string }).message || 'API temporarily overloaded',
        request_id: (e as { headers?: Record<string, string> }).headers?.[
          'request-id'
        ],
      }))
      .with(
        { error: { type: P.string, message: P.string } },
        (e: {
          error: { type: string; message: string };
          headers?: Record<string, string>;
        }) => ({
          code: e.error.type,
          message: e.error.message,
          type: e.error.type,
          request_id: e.headers?.['request-id'],
        }),
      )
      .with({ message: P.string }, (e) => ({
        message: e.message,
      }))
      .otherwise(() => ({
        message: String(error),
      }));

    return {
      success: false,
      error: errorDetails as ClaudeError,
    };
  }
}

/**
 * Check if Claude SDK is available (API key is set)
 */
export async function isClaudeAvailable(): Promise<boolean> {
  return Boolean(process.env['ANTHROPIC_API_KEY']);
}

/**
 * Helper to log errors with request ID for debugging
 */
export function logClaudeError(error: ClaudeError, context: string): void {
  const requestIdPart = error.request_id
    ? ` [Request ID: ${error.request_id}]`
    : '';
  console.error(
    `Claude API Error in ${context}: ${error.message}${requestIdPart}`,
  );

  if (error.code) {
    console.error(`Error code: ${error.code}`);
  }
}
