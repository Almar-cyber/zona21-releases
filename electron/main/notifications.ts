import { Notification, BrowserWindow } from 'electron';
import { join } from 'path';
import { logger } from './logger';

export interface NotificationOptions {
  body: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  silent?: boolean;
}

class NotificationManager {
  private iconPath: string;

  constructor() {
    // Caminho para o ícone da aplicação
    this.iconPath = join(__dirname, '../../resources/icon.png');
  }

  /**
   * Envia notificação (nativa + toast UI)
   */
  notify(title: string, options: NotificationOptions): void {
    logger.info('notification-manager', 'Sending notification', { title, type: options.type });

    // 1. Native notification (macOS/Windows/Linux)
    if (Notification.isSupported()) {
      try {
        const notification = new Notification({
          title,
          body: options.body,
          icon: this.iconPath,
          silent: options.silent ?? false,
        });

        notification.show();

        notification.on('click', () => {
          // Focar na janela quando clicar na notificação
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            const mainWindow = windows[0];
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
            mainWindow.focus();
          }
        });
      } catch (error) {
        logger.error('notification-manager', 'Failed to show native notification', error);
      }
    }

    // 2. Toast UI (renderer process)
    this.sendToastToRenderer(title, options);
  }

  /**
   * Envia toast para o renderer process
   */
  private sendToastToRenderer(title: string, options: NotificationOptions): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      try {
        win.webContents.send('zona21-toast', {
          type: options.type || 'info',
          message: `${title}: ${options.body}`,
          duration: options.duration || 5000,
        });
      } catch (error) {
        logger.error('notification-manager', 'Failed to send toast to renderer', error);
      }
    });
  }

  /**
   * Notificação de sucesso
   */
  success(title: string, body: string, duration?: number): void {
    this.notify(title, { body, type: 'success', duration });
  }

  /**
   * Notificação de erro
   */
  error(title: string, body: string, duration?: number): void {
    this.notify(title, { body, type: 'error', duration });
  }

  /**
   * Notificação de informação
   */
  info(title: string, body: string, duration?: number): void {
    this.notify(title, { body, type: 'info', duration });
  }

  /**
   * Notificação de aviso
   */
  warning(title: string, body: string, duration?: number): void {
    this.notify(title, { body, type: 'warning', duration });
  }

  /**
   * Verifica se notificações nativas estão disponíveis
   */
  isNativeSupported(): boolean {
    return Notification.isSupported();
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();
