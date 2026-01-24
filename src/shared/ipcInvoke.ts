import { logger } from './logger';

type AnyFn = (...args: any[]) => Promise<any>;

export async function ipcInvoke<T>(scope: string, fn: AnyFn, ...args: any[]): Promise<T> {
  try {
    return (await fn(...args)) as T;
  } catch (error) {
    logger.error(scope, 'IPC call failed', error);
    throw error;
  }
}
