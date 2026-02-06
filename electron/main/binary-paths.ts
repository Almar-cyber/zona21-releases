/**
 * Resolução robusta de binários FFmpeg/FFprobe
 *
 * Cadeia de fallback:
 * 1. Bundled via @ffmpeg-installer (dev mode)
 * 2. asar.unpacked (app empacotado)
 * 3. FFmpeg do sistema (which/where)
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

// Cache para evitar re-resolução
let cachedFfmpegPath: string | null | undefined;
let cachedFfprobePath: string | null | undefined;

function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolve o binário usando múltiplas estratégias
 */
function findBinary(name: 'ffmpeg' | 'ffprobe'): string | null {
  const isWin = process.platform === 'win32';
  const binaryName = isWin ? `${name}.exe` : name;
  const platform = `${process.platform}-${process.arch}`;
  const installerPkg = name === 'ffmpeg'
    ? '@ffmpeg-installer/ffmpeg'
    : '@ffprobe-installer/ffprobe';

  // Estratégia 1: require() do installer (funciona em dev)
  try {
    const installer = require(installerPkg);
    if (installer?.path && fileExists(installer.path)) {
      console.log(`[BinaryPaths] ${name} encontrado via installer: ${installer.path}`);
      return installer.path;
    }
    // Se o path existe mas asar precisa de unpacked
    if (installer?.path && app.isPackaged) {
      const unpackedPath = installer.path.replace('app.asar', 'app.asar.unpacked');
      if (fileExists(unpackedPath)) {
        console.log(`[BinaryPaths] ${name} encontrado via asar.unpacked (installer): ${unpackedPath}`);
        return unpackedPath;
      }
    }
  } catch {
    // Pacote não encontrado ou erro de require - continuar para próxima estratégia
  }

  // Estratégia 2: Caminho direto no asar.unpacked (app empacotado)
  if (app.isPackaged && (process as any).resourcesPath) {
    const platformPkg = name === 'ffmpeg'
      ? `@ffmpeg-installer/${platform}`
      : `@ffprobe-installer/${platform}`;

    const candidates = [
      path.join((process as any).resourcesPath, 'app.asar.unpacked', 'node_modules', ...platformPkg.split('/'), binaryName),
      path.join((process as any).resourcesPath, 'app.asar.unpacked', 'node_modules', ...installerPkg.split('/'), binaryName),
    ];

    for (const candidate of candidates) {
      if (fileExists(candidate)) {
        console.log(`[BinaryPaths] ${name} encontrado via asar.unpacked: ${candidate}`);
        return candidate;
      }
    }
  }

  // Estratégia 3: FFmpeg do sistema via PATH
  try {
    const cmd = isWin ? 'where' : 'which';
    const result = execFileSync(cmd, [name], {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim().split('\n')[0];

    if (result && fileExists(result)) {
      console.log(`[BinaryPaths] ${name} encontrado via sistema: ${result}`);
      return result;
    }
  } catch {
    // Não encontrado no PATH
  }

  // Estratégia 4: Caminhos comuns do Homebrew (macOS)
  if (process.platform === 'darwin') {
    const homebrewPaths = [
      `/opt/homebrew/bin/${name}`,
      `/usr/local/bin/${name}`,
    ];
    for (const p of homebrewPaths) {
      if (fileExists(p)) {
        console.log(`[BinaryPaths] ${name} encontrado via homebrew: ${p}`);
        return p;
      }
    }
  }

  console.warn(`[BinaryPaths] ${name} NÃO encontrado em nenhuma estratégia`);
  return null;
}

export function getFfmpegPath(): string | null {
  if (cachedFfmpegPath !== undefined) return cachedFfmpegPath;
  cachedFfmpegPath = findBinary('ffmpeg');
  return cachedFfmpegPath;
}

export function getFfprobePath(): string | null {
  if (cachedFfprobePath !== undefined) return cachedFfprobePath;
  cachedFfprobePath = findBinary('ffprobe');
  return cachedFfprobePath;
}

export function logBinaryPaths(): void {
  console.log('[BinaryPaths] app.isPackaged:', app.isPackaged);
  console.log('[BinaryPaths] resourcesPath:', (process as any).resourcesPath);
  console.log('[BinaryPaths] ffmpeg:', getFfmpegPath());
  console.log('[BinaryPaths] ffprobe:', getFfprobePath());
}

export function validateFfmpegBinaries(): { success: boolean; ffmpegPath?: string; ffprobePath?: string; error?: string } {
  const ffmpegPath = getFfmpegPath();
  const ffprobePath = getFfprobePath();

  if (!ffmpegPath) {
    return {
      success: false,
      error: 'FFmpeg não encontrado. Instale via: brew install ffmpeg'
    };
  }

  if (!ffprobePath) {
    return {
      success: false,
      error: 'FFprobe não encontrado. Instale via: brew install ffmpeg'
    };
  }

  return { success: true, ffmpegPath, ffprobePath };
}
