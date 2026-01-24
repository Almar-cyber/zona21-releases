import fs from 'fs';
import path from 'path';

export function normalizePathPrefix(prefixRaw: string): string {
  return String(prefixRaw || '').replace(/^\/+|\/+$/g, '');
}

export async function ensureUniquePath(dir: string, baseName: string): Promise<string> {
  const parsed = path.parse(baseName);
  let attempt = 0;
  while (true) {
    const suffix = attempt === 0 ? '' : ` (${attempt})`;
    const name = `${parsed.name}${suffix}${parsed.ext}`;
    const candidate = path.join(dir, name);
    try {
      await fs.promises.access(candidate);
      attempt++;
    } catch {
      return candidate;
    }
  }
}
