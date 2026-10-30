import { readFileSync } from 'node:fs';

// Shopify's own words for a changed schema item: its description and, for a
// deprecated item, the migration note (deprecationReason). The README and
// CHANGELOG prompts use them to explain what a change means and what to do,
// so the model never has to guess.

interface SchemaMember {
  name: string;
  description?: string | null;
  deprecationReason?: string | null;
}
interface SchemaType extends SchemaMember {
  fields?: SchemaMember[] | null;
  inputFields?: SchemaMember[] | null;
  enumValues?: SchemaMember[] | null;
}
export interface ChangeContext {
  change: string;
  shopifyDescription?: string;
  deprecationReason?: string;
}

const cache = new Map<string, Map<string, SchemaType>>();

function loadTypes(api: string, version: string): Map<string, SchemaType> {
  const key = `${api}/${version}`;
  const cached = cache.get(key);
  if (cached) return cached;
  let types = new Map<string, SchemaType>();
  try {
    const json = JSON.parse(
      readFileSync(`src/graphql-schemas/${key}.json`, 'utf-8'),
    ) as {
      data?: { __schema: { types: SchemaType[] } };
      __schema?: { types: SchemaType[] };
    };
    const schema = json.data?.__schema ?? json.__schema;
    types = new Map((schema?.types ?? []).map((t) => [t.name, t]));
  } catch {
    // A missing schema leaves the change without context
  }
  cache.set(key, types);
  return types;
}

/** Find the type and member that a comparison message names. */
export function parseChangeTarget(
  message: string,
  fallbackName: string,
): { type: string; member?: string } {
  // [pattern, index of the type group, index of the member group (0 = none)]
  const patterns: Array<[RegExp, number, number]> = [
    [/^Argument '([^:']+)[^']*' .*field '([^.']+)\.([^']+)'/, 2, 3],
    [/^(?:Input field|Field) '([^.']+)\.([^']+)' changed/, 1, 2],
    [/^(?:Input field|Field) '([^']+)'.* type '([^']+)'/, 2, 1],
    [/^Enum value '([^']+)'.* enum '([^']+)'/, 2, 1],
    [/^Type '([^']+)'/, 1, 0],
  ];
  for (const [pattern, typeIndex, memberIndex] of patterns) {
    const match = message.match(pattern);
    if (!match) continue;
    const type = match[typeIndex] ?? fallbackName;
    const member = memberIndex > 0 ? match[memberIndex] : undefined;
    return member ? { type, member } : { type };
  }
  return { type: fallbackName };
}

function clean(text: string | null | undefined): string | undefined {
  const value = text?.replace(/\s+/g, ' ').trim();
  return value ? value.slice(0, 300) : undefined;
}

/**
 * Add Shopify's description and migration note to one change. Removed items
 * are looked up in the old schema, other changes in the new one.
 */
export function describeChange(
  api: string,
  fromVersion: string,
  toVersion: string,
  change: { name?: string; changeType?: string; description?: string },
): ChangeContext {
  const message = change.description ?? change.name ?? '';
  const { type, member } = parseChangeTarget(message, change.name ?? '');
  const removed = change.changeType === 'removed' || /removed/i.test(message);
  const schemas = removed
    ? [loadTypes(api, fromVersion), loadTypes(api, toVersion)]
    : [loadTypes(api, toVersion), loadTypes(api, fromVersion)];

  for (const types of schemas) {
    const found = types.get(type);
    if (!found) continue;
    const item = member
      ? [
          ...(found.fields ?? []),
          ...(found.inputFields ?? []),
          ...(found.enumValues ?? []),
        ].find((m) => m.name === member)
      : found;
    if (!item) continue;
    const result: ChangeContext = { change: message };
    const description =
      clean(item.description) ??
      (member ? clean(found.description) : undefined);
    const reason = clean(item.deprecationReason);
    if (description) result.shopifyDescription = description;
    if (reason) result.deprecationReason = reason;
    return result;
  }
  return { change: message };
}
