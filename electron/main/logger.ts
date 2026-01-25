import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_LOG_FILES = 3;

let logFilePath: string | null = null;
let logStream: fs.WriteStream | null = null;

function getLogFilePath(): string {
  if (logFilePath) return logFilePath;
  
  try {
    const userDataPath = app.getPath('userData');
    const logsDir = path.join(userDataPath, 'logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    logFilePath = path.join(logsDir, 'zona21.log');
    return logFilePath;
  } catch {
    return '';
  }
}

function rotateLogsIfNeeded(): void {
  try {
    const filePath = getLogFilePath();
    if (!filePath || !fs.existsSync(filePath)) return;
    
    const stats = fs.statSync(filePath);
    if (stats.size < MAX_LOG_SIZE) return;
    
    // Close current stream
    if (logStream) {
      logStream.end();
      logStream = null;
    }
    
    // Rotate logs
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldPath = `${filePath}.${i}`;
      const newPath = `${filePath}.${i + 1}`;
      if (fs.existsSync(oldPath)) {
        if (i === MAX_LOG_FILES - 1) {
          fs.unlinkSync(oldPath);
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }
    
    fs.renameSync(filePath, `${filePath}.1`);
  } catch {
    // Ignore rotation errors
  }
}

function writeToFile(line: string): void {
  try {
    const filePath = getLogFilePath();
    if (!filePath) return;
    
    rotateLogsIfNeeded();
    
    if (!logStream) {
      logStream = fs.createWriteStream(filePath, { flags: 'a' });
    }
    
    logStream.write(line + '\n');
  } catch {
    // Ignore file write errors
  }
}

function getMinLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL;
  const v = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v;
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  const min = getMinLevel();
  return levelOrder[level] >= levelOrder[min];
}

export function log(level: LogLevel, scope: string, message: string, data?: unknown) {
  if (!shouldLog(level)) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${scope}]`;
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  const fullLine = `${prefix} ${message}${dataStr}`;

  // Console output
  if (level === 'error') {
    console.error(prefix, message, data ?? '');
  } else if (level === 'warn') {
    console.warn(prefix, message, data ?? '');
  } else if (level === 'debug') {
    console.debug(prefix, message, data ?? '');
  } else {
    console.log(prefix, message, data ?? '');
  }
  
  // File output
  writeToFile(fullLine);
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown) => log('debug', scope, message, data),
  info: (scope: string, message: string, data?: unknown) => log('info', scope, message, data),
  warn: (scope: string, message: string, data?: unknown) => log('warn', scope, message, data),
  error: (scope: string, message: string, data?: unknown) => log('error', scope, message, data)
};

export function getLogPath(): string {
  return getLogFilePath();
}

export async function exportLogs(): Promise<{ path: string; content: string }> {
  const filePath = getLogFilePath();
  if (!filePath || !fs.existsSync(filePath)) {
    return { path: '', content: '' };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return { path: filePath, content };
}

export function closeLogger(): void {
  if (logStream) {
    logStream.end();
    logStream = null;
  }
}
