// OpenCode Go chat-completions client for the README generator.
// The /models endpoint reports this base URL for chat-completions models.
const DEFAULT_BASE_URL = 'https://opencode.ai/inference/go/openai/v1';

// Chosen in the 2026.10.0 preview rounds: it passed both style gates and
// named change groups by feature area (glm-5.3 and deepseek-v4-pro lost)
export const DEFAULT_MODEL = 'kimi-k3.1-pro';

// Reasoning tokens count toward the limit. 32000 left glm-5.3 no room for
// the answer. 128000 stays below the smallest output limit of the
// candidate models (131072).
const MAX_TOKENS = 128000;

// Long reasoning can take many minutes; streaming keeps the connection open
const TIMEOUT_MS = 30 * 60 * 1000;

interface ChatCompletionChunk {
  usage?: Record<string, unknown>;
  choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
}

/**
 * Send one prompt plus JSON input data and return the model's text.
 * Throws when the key is missing, the request fails, or the text is empty.
 */
export async function generateText(
  prompt: string,
  inputData: unknown,
): Promise<string> {
  const apiKey = process.env['OPENCODE_GO_API_KEY'];
  if (!apiKey) {
    throw new Error('OPENCODE_GO_API_KEY environment variable not set');
  }

  const baseUrl = process.env['OPENCODE_GO_BASE_URL'] || DEFAULT_BASE_URL;
  const model = process.env['OPENCODE_GO_MODEL'] || DEFAULT_MODEL;

  const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
      // OpenCode Go rejects requests without a session id (HTTP 400)
      'x-opencode-session': crypto.randomUUID(),
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      // Without streaming, the server sends no headers until the model
      // finishes, and fetch stops waiting for headers after 300 seconds
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nInput data:\n\`\`\`json\n${JSON.stringify(inputData, null, 2)}\n\`\`\``,
        },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `OpenCode Go request failed (${response.status}): ${await response.text()}`,
    );
  }

  // Server-sent events: one "data: {json}" line per chunk, then [DONE]
  let text = '';
  let finishReason: string | undefined;
  let usage: Record<string, unknown> | undefined;
  let buffer = '';
  const readLine = (line: string): void => {
    const data = line.startsWith('data:') ? line.slice(5).trim() : '';
    if (data === '' || data === '[DONE]') return;
    const chunk = JSON.parse(data) as ChatCompletionChunk;
    text += chunk.choices?.[0]?.delta?.content ?? '';
    finishReason = chunk.choices?.[0]?.finish_reason ?? finishReason;
    usage = chunk.usage ?? usage;
  };
  if (!response.body) {
    throw new Error('OpenCode Go returned an empty response body');
  }
  for await (const part of response.body.pipeThrough(new TextDecoderStream())) {
    buffer += part;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(readLine);
  }
  // The stream can end without a final newline
  readLine(buffer);

  if (text.trim() === '' || finishReason === 'length') {
    throw new Error(
      `Model ${model} returned no complete text (finish_reason: ${finishReason}, ` +
        `usage: ${JSON.stringify(usage)}). ` +
        `If the token limit was hit, reasoning may have used the budget.`,
    );
  }

  return text;
}

/**
 * Retry a request that fails before any response arrives (for example a
 * connect timeout). A request that got a response is never sent again.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, init);
    } catch (error) {
      if (attempt >= attempts || init.signal?.aborted) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
    }
  }
}
