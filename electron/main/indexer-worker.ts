/**
 * Worker Thread para indexação de arquivos
 * Roda em processo separado para não bloquear a UI
 */
import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const stat = promisify(fs.stat);

const THUMB_VERSION = 'v2';
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.mxf', '.m4v', '.mpg', '.mpeg'];
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.cr2', '.cr3', '.arw', '.nef', '.dng', '.heic', '.heif'];

// Configurações de throttling
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 50; // 50ms entre batches para não sobrecarregar

interface WorkerMessage {
  type: 'start' | 'pause' | 'resume' | 'cancel';
  dirPath?: string;
  volumeUuid?: string;
  volumeMountPoint?: string;
  cacheDir?: string;
}

interface ProgressMessage {
  type: 'progress' | 'completed' | 'error' | 'paused' | 'cancelled';
  total?: number;
  indexed?: number;
  currentFile?: string | null;
  status?: string;
  error?: string;
  results?: any[];
}

let isPaused = false;
let isCancelled = false;

// Função para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Scan directory recursivamente
async function scanDirectory(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  
  const scan = async (currentPath: string) => {
    try {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (isCancelled) return;
        
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          // Ignorar pastas ocultas
          if (!entry.name.startsWith('.')) {
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          // Ignorar arquivos ocultos e metadados do macOS
          if (entry.name.startsWith('.') || entry.name.startsWith('._')) {
            continue;
          }
          
          const ext = path.extname(entry.name).toLowerCase();
          if (VIDEO_EXTENSIONS.includes(ext) || PHOTO_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning ${currentPath}:`, err);
    }
  };

  await scan(dirPath);
  return files;
}

// Calcular hash parcial do arquivo (primeiros 64KB)
async function calculatePartialHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath, { start: 0, end: 65535 });
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Indexar um arquivo (versão simplificada - metadata básica)
async function indexFileBasic(
  filePath: string, 
  volumeUuid: string, 
  volumeMountPoint: string,
  cacheDir: string
): Promise<any> {
  const stats = await stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mediaType = VIDEO_EXTENSIONS.includes(ext) ? 'video' : 'photo';
  const relativePath = path.relative(volumeMountPoint, filePath);
  
  // Hash parcial usando stream (não carrega tudo na memória)
  let partialHash = '';
  try {
    partialHash = await calculatePartialHash(filePath);
  } catch {
    partialHash = crypto.createHash('sha256').update(filePath + stats.size).digest('hex');
  }

  const id = crypto
    .createHash('sha256')
    .update(`${volumeUuid}:${relativePath}`)
    .digest('hex')
    .slice(0, 36);

  return {
    id,
    volumeUuid,
    relativePath,
    fileName: path.basename(filePath),
    fileSize: stats.size,
    partialHash,
    mediaType,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    rating: 0,
    flagged: false,
    rejected: false,
    tags: [],
    notes: '',
    colorLabel: null,
    thumbnailPaths: [],
    waveformPath: null,
    proxyPath: null,
    fullResPreviewPath: null,
    indexedAt: new Date(),
    status: 'online',
    // Marcar para processamento posterior de thumbnail/metadata
    needsThumbnail: true,
    needsMetadata: true
  };
}

// Processar arquivos com throttling
async function processFiles(
  files: string[],
  volumeUuid: string,
  volumeMountPoint: string,
  cacheDir: string
): Promise<any[]> {
  const results: any[] = [];
  let indexed = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    // Verificar se foi cancelado ou pausado
    if (isCancelled) {
      parentPort?.postMessage({ type: 'cancelled', indexed, total: files.length });
      return results;
    }

    while (isPaused && !isCancelled) {
      parentPort?.postMessage({ type: 'paused', indexed, total: files.length });
      await sleep(500); // Verificar a cada 500ms se retomou
    }

    const batch = files.slice(i, i + BATCH_SIZE);
    
    // Processar batch em paralelo
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          return await indexFileBasic(file, volumeUuid, volumeMountPoint, cacheDir);
        } catch (err) {
          console.error(`Error indexing ${file}:`, err);
          return null;
        }
      })
    );

    // Adicionar resultados válidos
    for (const result of batchResults) {
      if (result) {
        results.push(result);
        indexed++;
      }
    }

    // Enviar progresso
    parentPort?.postMessage({
      type: 'progress',
      total: files.length,
      indexed,
      currentFile: batch[batch.length - 1],
      status: 'indexing'
    });

    // Throttling: delay entre batches para não sobrecarregar CPU
    if (i + BATCH_SIZE < files.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return results;
}

// Handler de mensagens do processo principal
parentPort?.on('message', async (message: WorkerMessage) => {
  switch (message.type) {
    case 'start':
      isPaused = false;
      isCancelled = false;
      
      try {
        const { dirPath, volumeUuid, volumeMountPoint, cacheDir } = message;
        
        if (!dirPath || !volumeUuid || !volumeMountPoint || !cacheDir) {
          parentPort?.postMessage({ type: 'error', error: 'Missing required parameters' });
          return;
        }

        // Fase 1: Scan (rápido)
        parentPort?.postMessage({ type: 'progress', status: 'scanning', total: 0, indexed: 0 });
        const files = await scanDirectory(dirPath);
        
        if (isCancelled) {
          parentPort?.postMessage({ type: 'cancelled' });
          return;
        }

        parentPort?.postMessage({ 
          type: 'progress', 
          status: 'indexing', 
          total: files.length, 
          indexed: 0 
        });

        // Fase 2: Indexar (com throttling)
        const results = await processFiles(files, volumeUuid, volumeMountPoint, cacheDir);

        if (!isCancelled) {
          parentPort?.postMessage({
            type: 'completed',
            total: files.length,
            indexed: results.length,
            results
          });
        }
      } catch (error) {
        parentPort?.postMessage({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
      break;

    case 'pause':
      isPaused = true;
      break;

    case 'resume':
      isPaused = false;
      break;

    case 'cancel':
      isCancelled = true;
      isPaused = false;
      break;
  }
});

// Sinalizar que o worker está pronto
parentPort?.postMessage({ type: 'ready' });
