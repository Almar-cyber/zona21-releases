import path from 'path';

/**
 * Sanitiza nome de arquivo removendo caracteres perigosos e path traversal
 * SECURITY: Previne path traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed';
  }

  return fileName
    .replace(/[\/\\]/g, '_')     // Remove path separators / e \
    .replace(/\.\./g, '_')        // Remove ..
    .replace(/^\.+/, '_')         // Remove . no início
    .replace(/\0/g, '')           // Remove null bytes
    .replace(/[<>:"|?*]/g, '_')   // Remove caracteres inválidos no Windows
    .trim()
    .slice(0, 255) || 'unnamed';  // Limitar tamanho e fallback
}

/**
 * Valida que o caminho de destino está dentro do diretório esperado
 * SECURITY: Previne path traversal attacks
 */
export function validateDestinationPath(destPath: string, allowedBaseDir: string): boolean {
  try {
    const resolvedDest = path.resolve(destPath);
    const resolvedBase = path.resolve(allowedBaseDir);

    // Verificar que destPath começa com allowedBaseDir
    return resolvedDest.startsWith(resolvedBase + path.sep) || resolvedDest === resolvedBase;
  } catch {
    return false;
  }
}

/**
 * Constrói caminho seguro combinando diretório base com nome de arquivo sanitizado
 * SECURITY: Combina sanitização com validação de path
 */
export function buildSafePath(baseDir: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  const fullPath = path.join(baseDir, safeName);

  if (!validateDestinationPath(fullPath, baseDir)) {
    throw new Error('Invalid destination path - potential path traversal attempt');
  }

  return fullPath;
}

/**
 * Rate limiter simples para prevenir abuse de operações sensíveis
 * SECURITY: Previne DoS e abuse de APIs
 */
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetAt: number }>();

  /**
   * Verifica se uma operação pode prosseguir baseado em rate limit
   * @param key - Identificador único da operação (ex: 'oauth:userId')
   * @param maxAttempts - Número máximo de tentativas
   * @param windowMs - Janela de tempo em milissegundos
   * @returns true se pode prosseguir, false se excedeu o limite
   */
  canProceed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Reseta o contador para uma chave específica
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Limpa entries expirados (chamar periodicamente)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetAt) {
        this.attempts.delete(key);
      }
    }
  }
}

/**
 * Valida que um array de IDs não excede limite e contém apenas IDs válidos
 * SECURITY: Previne SQL injection e DoS via arrays muito grandes
 */
export function validateAssetIds(assetIds: unknown, maxLength = 1000): string[] {
  if (!Array.isArray(assetIds)) {
    throw new Error('Asset IDs must be an array');
  }

  if (assetIds.length === 0) {
    return [];
  }

  if (assetIds.length > maxLength) {
    throw new Error(`Too many assets. Maximum ${maxLength} allowed`);
  }

  // Validar que todos são strings com formato válido (UUID-like)
  const validIds = assetIds.filter(id =>
    typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 64
  );

  if (validIds.length !== assetIds.length) {
    throw new Error('Invalid asset ID format detected');
  }

  return validIds;
}

/**
 * Mascara informações sensíveis para logging seguro
 * SECURITY: Previne vazamento de dados sensíveis em logs
 */
export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (!data || data.length <= visibleChars) {
    return '***';
  }

  return data.slice(0, visibleChars) + '*'.repeat(Math.min(data.length - visibleChars, 10));
}

// Instância global do rate limiter
export const globalRateLimiter = new RateLimiter();

// Limpar rate limiter a cada 5 minutos
setInterval(() => {
  globalRateLimiter.cleanup();
}, 5 * 60 * 1000);
