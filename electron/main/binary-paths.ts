/**
 * Helper para resolver paths de binários em produção (app empacotado)
 * 
 * Quando o app está empacotado com electron-builder:
 * - Arquivos ficam dentro de app.asar
 * - Binários executáveis precisam estar em app.asar.unpacked
 * - Os paths retornados pelos installers apontam para dentro do asar
 * - Precisamos substituir 'app.asar' por 'app.asar.unpacked'
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';

/**
 * Corrige o path de um binário para funcionar no app empacotado
 */
export function resolveUnpackedPath(originalPath: string): string {
  if (!originalPath) return originalPath;
  
  // Se não estiver empacotado, usar path original
  if (!app.isPackaged) return originalPath;
  
  // Substituir app.asar por app.asar.unpacked
  const unpackedPath = originalPath.replace('app.asar', 'app.asar.unpacked');
  
  // Verificar se o arquivo existe no path unpacked
  if (fs.existsSync(unpackedPath)) {
    return unpackedPath;
  }
  
  // Fallback: tentar encontrar no diretório de recursos
  const resourcesPath = path.join((process as any).resourcesPath, 'app.asar.unpacked', 'node_modules');
  if (originalPath.includes('node_modules')) {
    const modulePath = originalPath.split('node_modules').pop();
    if (modulePath) {
      const altPath = path.join(resourcesPath, modulePath);
      if (fs.existsSync(altPath)) {
        return altPath;
      }
    }
  }
  
  return originalPath;
}

/**
 * Obtém o path do ffmpeg bundled
 */
export function getFfmpegPath(): string | null {
  try {
    const installer = require('@ffmpeg-installer/ffmpeg');
    const originalPath = installer?.path;
    if (!originalPath) return null;
    
    const resolved = resolveUnpackedPath(originalPath);
    
    // Verificar se é executável
    if (fs.existsSync(resolved)) {
      return resolved;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtém o path do ffprobe bundled
 */
export function getFfprobePath(): string | null {
  try {
    const installer = require('@ffprobe-installer/ffprobe');
    const originalPath = installer?.path;
    if (!originalPath) return null;
    
    const resolved = resolveUnpackedPath(originalPath);
    
    if (fs.existsSync(resolved)) {
      return resolved;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Log de diagnóstico para debug de paths
 */
export function logBinaryPaths(): void {
  console.log('[BinaryPaths] app.isPackaged:', app.isPackaged);
  console.log('[BinaryPaths] (process as any).resourcesPath:', (process as any).resourcesPath);
  console.log('[BinaryPaths] ffmpeg:', getFfmpegPath());
  console.log('[BinaryPaths] ffprobe:', getFfprobePath());
}
