import fs from 'fs/promises';
import { match } from 'ts-pattern';
import { config } from 'dotenv';
import { prepareInputData } from '../src/lib/readme-utils.js';

// Load environment variables
config();
import { callClaude, isClaudeAvailable } from '../src/lib/claude-sdk.js';
import {
  createFileOperationHandler,
  handleOperationResult,
} from '../src/lib/patterns.js';

/**
 * Generate README using AI or fallback
 */
async function generateDocs(): Promise<void> {
  console.log('🔄 Generating README documentation...\n');

  const readmePath = './README.md';
  const fileHandler = createFileOperationHandler();

  try {
    // Step 1: Gather all required data
    console.log('📊 Gathering data for README generation...');
    const inputData = await prepareInputData();

    // Skip validation due to zod version conflict with knip
    // const validationResult = ReadmeInputSchema.safeParse(inputData);
    // if (!validationResult.success) {
    //   throw new Error(`Invalid input data: ${validationResult.error.message}`);
    // }

    console.log(
      `   ✓ Package: ${inputData.packageMetadata.name} v${inputData.packageMetadata.version}`,
    );
    console.log(`   ✓ Current version: ${inputData.versionSet.current}`);
    console.log(
      `   ✓ APIs documented: ${Object.keys(inputData.apiStats).length}`,
    );
    console.log(
      `   ✓ Export paths: ${Object.keys(inputData.exports).length} categories\n`,
    );

    // Step 2: Generate README content
    console.log('🤖 Generating README content...');

    // Check if Claude is available
    const claudeAvailable = await isClaudeAvailable();
    if (!claudeAvailable) {
      throw new Error(
        'README generation requires Anthropic API access.\n\n' +
          'To fix this:\n' +
          '1. Get an API key from https://console.anthropic.com/settings/keys\n' +
          '2. Add it to your .env file: ANTHROPIC_API_KEY=your_key_here\n' +
          '3. Ensure you have sufficient credits in your account\n\n' +
          'This ensures high-quality, consistent documentation generation.',
      );
    }

    console.log('   Using Claude API for generation...');
    const result = await callClaude('generate-readme', inputData);

    if (!result.success) {
      // Provide human-friendly error messages
      const errorMessage = match(result.error.code)
        .with(
          'NO_API_KEY',
          () =>
            'API key not configured. Add ANTHROPIC_API_KEY to your .env file.',
        )
        .with(
          'PROMPT_NOT_FOUND',
          () =>
            'README generation prompt not found at .claude/commands/generate-readme.md',
        )
        .with('invalid_request_error', () => {
          if (result.error.message.includes('credit balance')) {
            return 'Insufficient Anthropic API credits. Please add credits at https://console.anthropic.com/settings/billing';
          }
          return `Invalid request: ${result.error.message}`;
        })
        .with(
          'authentication_error',
          () => 'Invalid API key. Check your ANTHROPIC_API_KEY in .env file.',
        )
        .with(
          'rate_limit_error',
          () => 'Rate limit exceeded. Please wait a moment and try again.',
        )
        .with('api_error', () => 'Anthropic API error. Please try again later.')
        .with(
          'overloaded_error',
          () =>
            'Anthropic API is temporarily overloaded. Please try again in a few minutes.',
        )
        .otherwise(() => `Claude API error: ${result.error.message}`);

      throw new Error(`README generation failed: ${errorMessage}`);
    }

    const readmeContent = result.data;

    // Step 3: Write README file
    const writeResult = await fileHandler(
      {
        operation: 'write',
        target: readmePath,
        metadata: { contentLength: readmeContent.length },
      },
      async () => {
        await fs.writeFile(readmePath, readmeContent, 'utf-8');
        return { size: Buffer.byteLength(readmeContent, 'utf-8') };
      },
    );

    handleOperationResult(writeResult, {
      onSuccess: (data) => {
        console.log(`\n✅ README generated successfully!`);
        console.log(`   📄 Updated: ${readmePath} (${data.size} bytes)`);
        console.log(`   📊 Version: ${inputData.versionSet.current}`);
        console.log(`   🕒 Generated at: ${new Date().toLocaleString()}\n`);
      },
      onError: (error) => {
        throw new Error(`Failed to write README: ${error}`);
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ README generation failed:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateDocs().catch(console.error);
}

export { generateDocs };
