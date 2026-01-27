import { BrowserWindow } from 'electron';

let mainWindowRef: BrowserWindow | null = null;

/**
 * Define a referência da janela principal para uso nos handlers IPC
 */
export function setMainWindow(win: BrowserWindow | null) {
  mainWindowRef = win;
}

/**
 * Retorna a referência da janela principal
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindowRef;
}

/**
 * Envia mensagem para o renderer de forma segura,
 * verificando se a janela ainda existe e não foi destruída
 */
export function safeSend(channel: string, ...args: unknown[]) {
  try {
    if (mainWindowRef && !mainWindowRef.isDestroyed() && mainWindowRef.webContents && !mainWindowRef.webContents.isDestroyed()) {
      mainWindowRef.webContents.send(channel, ...args);
    }
  } catch {
    // Silenciosamente ignora erros de envio
  }
}
