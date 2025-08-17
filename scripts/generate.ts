#!/usr/bin/env node
import { match } from 'ts-pattern';
import { generatePackageExports } from './generate-exports.js';
import { generateIndexFiles } from './generate-indexes.js';
import { generateComparisonFiles } from './generate-comparisons.js';

/**
 * Consolidated generation script with subcommands
 * Usage: tsx scripts/generate.ts <command> [options]
 */

type Command = 'exports' | 'indexes' | 'comparisons' | 'all';

interface CommandHandler {
  description: string;
  run: () => Promise<void>;
}

const commands: Record<Command, CommandHandler> = {
  exports: {
    description: 'Generate package.json exports for all API versions',
    run: generatePackageExports,
  },
  indexes: {
    description: 'Generate index.ts files for all APIs and versions',
    run: generateIndexFiles,
  },
  comparisons: {
    description: 'Generate schema comparison files between versions',
    run: generateComparisonFiles,
  },
  all: {
    description: 'Run all generation tasks in sequence',
    run: async () => {
      console.log('🔄 Running all generation tasks...\n');

      // Run in the correct order
      console.log('1️⃣  Generating indexes...');
      await generateIndexFiles();

      console.log('\n2️⃣  Generating exports...');
      await generatePackageExports();

      console.log('\n3️⃣  Generating comparisons...');
      await generateComparisonFiles();

      console.log('\n✅ All generation tasks completed!');
    },
  },
};

function showHelp(): void {
  console.log(`
Usage: tsx scripts/generate.ts <command>

Commands:
${Object.entries(commands)
  .map(([name, { description }]) => `  ${name.padEnd(12)} ${description}`)
  .join('\n')}

Examples:
  tsx scripts/generate.ts exports      # Generate package.json exports
  tsx scripts/generate.ts indexes      # Generate index files
  tsx scripts/generate.ts comparisons  # Generate comparison files
  tsx scripts/generate.ts all          # Run all generation tasks
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const commandName = args[0];

  if (!commandName || commandName === 'help' || commandName === '--help') {
    showHelp();
    process.exit(0);
  }

  const result = match(commandName)
    .when(
      (cmd): cmd is Command => cmd in commands,
      async (cmd) => {
        const command = commands[cmd];
        console.log(`🚀 Running: ${command.description}\n`);

        try {
          await command.run();
          process.exit(0);
        } catch (error) {
          console.error('❌ Generation failed:', error);
          process.exit(1);
        }
      },
    )
    .otherwise(() => {
      console.error(`❌ Unknown command: ${commandName}`);
      showHelp();
      process.exit(1);
    });

  await result;
}

// Export for testing
export { commands, type Command };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
