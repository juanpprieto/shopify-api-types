// OpenCode Go chat-completions client for the README generator.
// The /models endpoint reports this base URL for chat-completions models.
const DEFAULT_BASE_URL = 'https://opencode.ai/inference/go/openai/v1';

// Chosen by a bake-off on the 2026.10.0 README (see CONTRIBUTING.md)
const DEFAULT_MODEL = 'glm-5.3';

// Reasoning tokens count toward the limit; a low cap can leave no room
// for the visible answer
const MAX_TOKENS = 32000;

const TIMEOUT_MS = 10 * 60 * 1000;

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
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

  const response = await fetch(`${baseUrl}/chat/completions`, {
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

  const completion = (await response.json()) as ChatCompletion;
  const choice = completion.choices?.[0];
  const text = choice?.message?.content ?? '';

  if (text.trim() === '') {
    throw new Error(
      `Model ${model} returned no text (finish_reason: ${choice?.finish_reason}). ` +
        `If the token limit was hit, reasoning may have used the budget.`,
    );
  }

  return text;
}
