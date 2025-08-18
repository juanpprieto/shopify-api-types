# Contributing

## Development Setup

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm test

# Build the package
npm run build
```

## Code Quality

This project uses the strictest TypeScript and Prettier configurations. All code
must pass linting, formatting, and type checks.

## Pre-commit Hooks

Husky and lint-staged are configured to ensure code quality before commits.

## Claude AI Configuration

The documentation generation uses Claude AI. The model selection works as
follows:

1. **Environment Variable** (highest priority): Set `ANTHROPIC_MODEL` to use a
   specific model

   ```bash
   export ANTHROPIC_MODEL="claude-opus-4-1-20250805"
   ```

2. **Automatic Latest** (development): In non-production environments, uses
   `claude-sonnet-4-0` alias which automatically points to the latest Sonnet 4
   version

3. **Stable Version** (production): In production, uses a specific version
   (`claude-sonnet-4-20250514`) for consistency

This approach ensures:

- Flexibility for testing new models via environment variable
- Automatic updates in development environments
- Stability in production environments
