import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Load .env so that its values win over variables exported in the shell.
// Node's --env-file never overrides an existing variable, so a stale key
// exported in a shell profile would hide the key in .env. CI has no .env
// and uses its secrets.
if (existsSync('.env')) {
  Object.assign(process.env, parseEnv(readFileSync('.env', 'utf-8')));
}
