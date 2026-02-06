/**
 * Configurações centralizadas da aplicação
 * Evita magic numbers e facilita manutenção
 */

export const CONFIG = {
  /**
   * Configurações de paginação
   */
  PAGINATION: {
    PAGE_SIZE: 500,
    LOOKAHEAD_PAGES: 1,
    MAX_PAGES_TO_LOAD: 6
  },

  /**
   * Configurações de grid/layout
   */
  GRID: {
    MIN_COLUMN_WIDTH_LARGE: 200,
    MIN_COLUMN_WIDTH_SMALL: 220,
    GAP_LARGE: 12,
    GAP_SMALL: 14,
    SKELETON_COUNT: 20
  },

  /**
   * Configurações de thumbnails
   */
  THUMBNAILS: {
    SIZE: 512,
    QUALITY: 90,
    VERSION: 'v2'
  },

  /**
   * Configurações de teclado
   */
  KEYBOARD: {
    ARROW_SCROLL_AMOUNT: 1,
    PAGE_SCROLL_MULTIPLIER: 5
  },

  /**
   * Timeouts e delays
   */
  TIMERS: {
    TOAST_DURATION: 5000,
    DEBOUNCE_SEARCH: 300,
    DEBOUNCE_RESIZE: 150,
    AUTOSAVE_DELAY: 1000
  },

  /**
   * Limites de tamanho
   */
  LIMITS: {
    MAX_TAGS_LENGTH: 5000,
    MAX_NOTES_LENGTH: 10000,
    MAX_FILENAME_LENGTH: 255,
    MAX_SEARCH_QUERY_LENGTH: 500,
    MAX_SELECTED_ASSETS: 10000
  },

  /**
   * Cores de label
   */
  COLOR_LABELS: ['red', 'yellow', 'green', 'blue', 'purple', 'none'] as const,

  /**
   * Rating values
   */
  RATING: {
    MIN: 0,
    MAX: 5
  },

  /**
   * Extensões de arquivo suportadas
   */
  FILE_EXTENSIONS: {
    VIDEO: ['.mp4', '.mov', '.avi', '.mkv', '.mxf', '.m4v', '.mpg', '.mpeg', '.insv', '.lrv'],
    PHOTO: [
      '.jpg',
      '.jpeg',
      '.png',
      '.tiff',
      '.tif',
      '.cr2',
      '.cr3',
      '.arw',
      '.nef',
      '.dng',
      '.raf',
      '.rw2',
      '.orf',
      '.pef',
      '.heic',
      '.heif',
      '.insp'
    ]
  },

  /**
   * Configurações de export
   */
  EXPORT: {
    MAX_BATCH_SIZE: 1000,
    CHUNK_SIZE: 10
  }
} as const;

/**
 * Mensagens de erro amigáveis
 */
export const ERROR_MESSAGES = {
  // File system errors
  ENOENT: 'Arquivo não encontrado. Verifique se o disco está conectado.',
  EACCES: 'Sem permissão para acessar este arquivo.',
  EPERM: 'Operação não permitida. Verifique as permissões.',
  EBUSY: 'Arquivo em uso por outro programa. Feche-o e tente novamente.',
  ENOTDIR: 'Caminho especificado não é um diretório.',
  EISDIR: 'O caminho especificado é um diretório.',
  ENOSPC: 'Espaço insuficiente no disco.',

  // Network errors
  ETIMEDOUT: 'A operação expirou. Verifique sua conexão.',
  ECONNREFUSED: 'Conexão recusada. Verifique se o serviço está ativo.',
  ENOTFOUND: 'Recurso não encontrado.',

  // Application errors
  AbortError: 'Operação cancelada.',
  TypeError: 'Erro de tipo de dados. Entre em contato com o suporte.',
  RangeError: 'Valor fora do intervalo permitido.',

  // Default
  DEFAULT: 'Ocorreu um erro inesperado.'
} as const;

/**
 * Atalhos de teclado
 */
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',

  // Selection
  SELECT_ALL: 'a',
  CLEAR_SELECTION: 'Escape',

  // Actions
  DELETE: 'Delete',
  MARK: 'm',
  REJECT: 'x',
  RATE_1: '1',
  RATE_2: '2',
  RATE_3: '3',
  RATE_4: '4',
  RATE_5: '5',
  RATE_0: '0',

  // UI
  TOGGLE_SIDEBAR: 'b',
  TOGGLE_GRID_SIZE: 'g'
} as const;

/**
 * Z-index layers da aplicação
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
  NOTIFICATION: 80
} as const;
