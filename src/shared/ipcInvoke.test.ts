import { describe, it, expect } from 'vitest';
import { ipcInvoke } from './ipcInvoke';

describe('ipcInvoke', () => {
  it('returns resolved value', async () => {
    const fn = async (a: number, b: number) => a + b;
    const res = await ipcInvoke<number>('test.scope', fn, 1, 2);
    expect(res).toBe(3);
  });

  it('throws on error', async () => {
    const fn = async () => {
      throw new Error('boom');
    };

    await expect(ipcInvoke('test.scope', fn)).rejects.toThrow('boom');
  });
});
