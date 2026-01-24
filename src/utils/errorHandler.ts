import { logger } from '../shared/logger';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AppError {
  message: string;
  code: string;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  originalError?: Error;
  userMessage?: string;
}

export class ErrorHandler {
  /**
   * Handle an error with structured logging and optional Sentry reporting
   * @param error - The error to handle
   * @param context - Context string identifying where the error occurred
   * @param severity - Severity level of the error
   * @param userMessage - Optional user-friendly message to display
   * @returns Normalized AppError object
   */
  static handle(
    error: unknown,
    context: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    userMessage?: string
  ): AppError {
    const appError = this.normalizeError(error, context, severity, userMessage);

    // Log estruturado
    logger.error('ErrorHandler', appError.message, {
      code: appError.code,
      severity: appError.severity,
      context: appError.context,
      stack: appError.originalError?.stack
    });

    // Report to Sentry if critical or error
    if ((severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR) && (window as any).Sentry) {
      (window as any).Sentry.captureException(appError.originalError || new Error(appError.message), {
        tags: {
          code: appError.code,
          severity: appError.severity
        },
        contexts: {
          custom: appError.context
        }
      });
    }

    return appError;
  }

  /**
   * Normalize different error types into a consistent AppError format
   */
  private static normalizeError(
    error: unknown,
    context: string,
    severity: ErrorSeverity,
    userMessage?: string
  ): AppError {
    // Handle Error instances
    if (error instanceof Error) {
      return {
        message: error.message,
        code: `${context}.${error.name}`,
        severity,
        originalError: error,
        userMessage: userMessage || this.getUserFriendlyMessage(error),
        context: this.extractErrorContext(error)
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        message: error,
        code: `${context}.StringError`,
        severity,
        userMessage: userMessage || error
      };
    }

    // Handle object errors
    if (error && typeof error === 'object') {
      const errObj = error as any;
      return {
        message: errObj.message || String(error),
        code: `${context}.${errObj.code || 'ObjectError'}`,
        severity,
        userMessage: userMessage || errObj.message || 'Ocorreu um erro inesperado',
        context: errObj
      };
    }

    // Fallback for unknown error types
    return {
      message: String(error),
      code: `${context}.UnknownError`,
      severity,
      userMessage: userMessage || 'Ocorreu um erro inesperado'
    };
  }

  /**
   * Extract useful context from error objects
   */
  private static extractErrorContext(error: Error): Record<string, unknown> {
    const context: Record<string, unknown> = {
      name: error.name,
      message: error.message
    };

    // Extract additional properties from error object
    for (const key in error) {
      if (key !== 'stack' && key !== 'message' && key !== 'name') {
        context[key] = (error as any)[key];
      }
    }

    return context;
  }

  /**
   * Get user-friendly error messages based on error type
   */
  private static getUserFriendlyMessage(error: Error): string {
    const errorMessages: Record<string, string> = {
      // File system errors
      'ENOENT': 'Arquivo não encontrado. Verifique se o disco está conectado.',
      'EACCES': 'Sem permissão para acessar este arquivo.',
      'EPERM': 'Operação não permitida. Verifique as permissões.',
      'EBUSY': 'Arquivo em uso por outro programa. Feche-o e tente novamente.',
      'ENOTDIR': 'Caminho especificado não é um diretório.',
      'EISDIR': 'O caminho especificado é um diretório.',
      'ENOSPC': 'Espaço insuficiente no disco.',

      // Network errors
      'ETIMEDOUT': 'A operação expirou. Verifique sua conexão.',
      'ECONNREFUSED': 'Conexão recusada. Verifique se o serviço está ativo.',
      'ENOTFOUND': 'Recurso não encontrado.',

      // Application errors
      'AbortError': 'Operação cancelada.',
      'TypeError': 'Erro de tipo de dados. Entre em contato com o suporte.',
      'RangeError': 'Valor fora do intervalo permitido.',

      // Default
      'Error': 'Ocorreu um erro inesperado.'
    };

    // Check if error message contains known error codes
    for (const [code, message] of Object.entries(errorMessages)) {
      if (error.name === code || error.message.includes(code)) {
        return message;
      }
    }

    return error.message || 'Ocorreu um erro inesperado.';
  }

  /**
   * Helper to check if an error is of a specific type
   */
  static isErrorType(error: unknown, errorName: string): boolean {
    return error instanceof Error && error.name === errorName;
  }

  /**
   * Helper to safely extract error message
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    return 'Unknown error';
  }
}
