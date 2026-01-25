// Wrapper para sharp com fallback
let sharpInstance: any = null;

try {
  // Tentar importar sharp
  sharpInstance = require('sharp');
  console.log('[Sharp] Carregado com sucesso');
} catch (error) {
  console.warn('[Sharp] Não disponível, usando fallback');
  // Fallback: não processa imagens que precisam de sharp
}

export const sharp = sharpInstance;
