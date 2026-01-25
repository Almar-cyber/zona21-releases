import { logger } from './logger';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  details?: unknown;
}

const errorMessages: Record<string, string> = {
  // Database errors
  'DB_CONNECTION_FAILED': 'Não foi possível conectar ao banco de dados. Tente reiniciar o app.',
  'DB_QUERY_FAILED': 'Erro ao acessar os dados. Tente novamente.',
  'DB_WRITE_FAILED': 'Não foi possível salvar os dados. Verifique o espaço em disco.',
  
  // File system errors
  'FILE_NOT_FOUND': 'Arquivo não encontrado. Ele pode ter sido movido ou excluído.',
  'FILE_ACCESS_DENIED': 'Sem permissão para acessar este arquivo. Verifique as permissões.',
  'FILE_READ_ERROR': 'Não foi possível ler o arquivo. Tente novamente.',
  'FILE_WRITE_ERROR': 'Não foi possível salvar o arquivo. Verifique o espaço em disco.',
  'DIRECTORY_NOT_FOUND': 'Pasta não encontrada. Ela pode ter sido movida ou excluída.',
  
  // Volume errors
  'VOLUME_NOT_FOUND': 'Volume não encontrado. Ele pode ter sido desconectado.',
  'VOLUME_DISCONNECTED': 'Volume desconectado. Reconecte o disco e tente novamente.',
  'VOLUME_EJECT_FAILED': 'Não foi possível ejetar o disco. Feche todos os arquivos abertos.',
  
  // Index errors
  'INDEX_SCAN_FAILED': 'Erro ao escanear a pasta. Verifique se você tem permissão de acesso.',
  'INDEX_FILE_FAILED': 'Erro ao indexar arquivo. O arquivo pode estar corrompido.',
  'THUMBNAIL_GENERATION_FAILED': 'Não foi possível gerar miniatura. O arquivo pode estar corrompido.',
  
  // Export errors
  'EXPORT_FAILED': 'Falha na exportação. Verifique o espaço em disco e permissões.',
  'EXPORT_PATH_INVALID': 'Caminho de exportação inválido. Escolha outra pasta.',
  
  // Network errors
  'NETWORK_ERROR': 'Erro de conexão. Verifique sua internet.',
  'UPDATE_CHECK_FAILED': 'Não foi possível verificar atualizações. Tente novamente mais tarde.',
  'DOWNLOAD_FAILED': 'Falha no download. Verifique sua conexão.',
  
  // Generic errors
  'UNKNOWN_ERROR': 'Ocorreu um erro inesperado. Tente novamente.',
  'OPERATION_CANCELLED': 'Operação cancelada.',
  'INVALID_INPUT': 'Dados inválidos. Verifique e tente novamente.',
  'TIMEOUT': 'A operação demorou muito. Tente novamente.',
};

export function createAppError(
  code: string,
  originalError?: Error | unknown,
  customMessage?: string
): AppError {
  const userMessage = customMessage || errorMessages[code] || errorMessages['UNKNOWN_ERROR'];
  const message = originalError instanceof Error ? originalError.message : String(originalError || code);
  
  return {
    code,
    message,
    userMessage,
    details: originalError
  };
}

export function handleError(
  scope: string,
  code: string,
  originalError?: Error | unknown,
  customMessage?: string
): AppError {
  const appError = createAppError(code, originalError, customMessage);
  
  logger.error(scope, `[${code}] ${appError.message}`, {
    code,
    userMessage: appError.userMessage,
    stack: originalError instanceof Error ? originalError.stack : undefined
  });
  
  return appError;
}

export function toIpcResult<T>(
  data?: T,
  error?: AppError
): { success: boolean; data?: T; error?: string; code?: string } {
  if (error) {
    return {
      success: false,
      error: error.userMessage,
      code: error.code
    };
  }
  return {
    success: true,
    data
  };
}

export function wrapIpcHandler<T>(
  scope: string,
  handler: () => Promise<T> | T,
  errorCode: string = 'UNKNOWN_ERROR'
): Promise<{ success: boolean; data?: T; error?: string; code?: string }> {
  return Promise.resolve()
    .then(() => handler())
    .then((data) => toIpcResult(data))
    .catch((err) => {
      const appError = handleError(scope, errorCode, err);
      return toIpcResult<T>(undefined, appError);
    });
}

export function inferErrorCode(error: Error | unknown): string {
  if (!(error instanceof Error)) return 'UNKNOWN_ERROR';
  
  const msg = error.message.toLowerCase();
  
  if (msg.includes('enoent') || msg.includes('no such file')) return 'FILE_NOT_FOUND';
  if (msg.includes('eacces') || msg.includes('permission denied')) return 'FILE_ACCESS_DENIED';
  if (msg.includes('enospc') || msg.includes('no space')) return 'FILE_WRITE_ERROR';
  if (msg.includes('database') || msg.includes('sqlite')) return 'DB_QUERY_FAILED';
  if (msg.includes('network') || msg.includes('fetch')) return 'NETWORK_ERROR';
  if (msg.includes('timeout')) return 'TIMEOUT';
  
  return 'UNKNOWN_ERROR';
}

export function handleAndInfer(
  scope: string,
  error: Error | unknown,
  customMessage?: string
): AppError {
  const code = inferErrorCode(error);
  return handleError(scope, code, error, customMessage);
}
