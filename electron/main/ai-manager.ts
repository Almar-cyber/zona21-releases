/**
 * Gerenciador do Worker de IA
 * Controla o ciclo de vida do worker de IA e fila de processamento
 *
 * Funcionalidades:
 * - Auto-tagging de imagens (objetos, cenários)
 * - Embeddings para Smart Culling e busca por similaridade
 * - Detecção de período do dia (via EXIF timestamp)
 * - Detecção de localização (via GPS coordinates)
 */
import { Worker } from 'worker_threads';
import path from 'path';
import { BrowserWindow } from 'electron';
import { dbService } from './database';
import citiesData from './data/brazilian-cities.json';

// Interface para cidades brasileiras
interface City {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

// Cache de cidades
const citiesCache: City[] = citiesData.cities as City[];

interface AIJob {
  id: string;
  type: 'analyze';
  filePath?: string;
  assetId?: string;
}

// Formatos de imagem suportados
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

class AIManager {
  private worker: Worker | null = null;
  private mainWindow: BrowserWindow | null = null;
  private isReady = false;
  private queue: AIJob[] = [];
  private processing: Set<string> = new Set();
  private disabled = false;
  private userDisabled = false;

  private readonly CONCURRENCY = 1;

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
  }

  setUserEnabled(enabled: boolean) {
    this.userDisabled = !enabled;
    if (!enabled) {
      this.queue = [];
      this.processing.clear();
    }
  }

  isUserEnabled() {
    return !this.userDisabled;
  }

  private ensureUserEnabled() {
    if (this.userDisabled) {
      throw new Error('IA desativada');
    }
  }

  async start(): Promise<void> {
    if (this.worker) return;

    try {
      const workerPath = path.join(__dirname, 'ai-worker.js');
      console.log('[AI Manager] Starting worker from:', workerPath);

      const fs = require('fs');
      if (!fs.existsSync(workerPath)) {
        console.error('[AI Manager] Worker file not found:', workerPath);
        return;
      }

      this.worker = new Worker(workerPath);

      this.worker.on('message', (message) => this.handleWorkerMessage(message));
      this.worker.on('error', (error) => {
        console.error('[AI Manager] Worker error:', error);
        this.isReady = false;
        this.disabled = true;
      });
      this.worker.on('exit', (code) => {
        console.log(`[AI Manager] Worker stopped with exit code ${code}`);
        this.isReady = false;
        this.worker = null;
      });

      this.worker.postMessage({ type: 'init' });
    } catch (error) {
      console.error('[AI Manager] Failed to start worker:', error);
      this.worker = null;
      this.isReady = false;
      this.disabled = true;
    }
  }

  stop(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }

  queueAnalysis(assetId: string, filePath: string) {
    if (this.disabled || this.userDisabled) {
      return;
    }

    if (this.queue.some(job => job.assetId === assetId) || this.processing.has(assetId)) {
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      this.markAsProcessed(assetId, true);
      return;
    }

    this.queue.push({
      id: Math.random().toString(36).substring(7),
      type: 'analyze',
      assetId,
      filePath
    });

    this.processQueue();
  }

  private processQueue() {
    if (
      this.userDisabled ||
      !this.worker ||
      !this.isReady ||
      this.processing.size >= this.CONCURRENCY ||
      this.queue.length === 0
    ) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    if (job.type === 'analyze' && job.assetId) {
      this.processing.add(job.assetId);

      this.worker.postMessage({
        type: job.type,
        id: job.assetId,
        payload: {
          filePath: job.filePath
        }
      });
    }
  }

  private handleWorkerMessage(message: any) {
    switch (message.type) {
      case 'status':
        console.log(`[AI Manager] Status: ${message.status}`);
        if (message.status === 'ready') {
          this.isReady = true;
          console.log('[AI Manager] AI Worker ready');
          this.processQueue();
        }
        break;

      case 'result':
        if (message.task === 'analyze') {
          this.handleAnalysisResult(message.id, message.data);
        }
        break;

      case 'error':
        console.error(`[AI Manager] Error processing ${message.id}:`, message.error);
        this.processing.delete(message.id);
        if (message.id && message.error?.includes('não suportado')) {
          this.markAsProcessed(message.id, true);
        }
        this.processQueue();
        break;
    }
  }

  private handleAnalysisResult(assetId: string, data: {
    tags: Array<{ label: string; score: number }>;
    embedding: number[] | null;
  }) {
    this.processing.delete(assetId);

    const validTags = (data.tags || []).filter((r: any) => r.score > 0.05);

    console.log(`[AI Manager] Analysis for ${assetId}: ${validTags.length} tags, embedding: ${data.embedding ? 'yes' : 'no'}`);

    try {
      const db = dbService.getDatabase();

      // Buscar dados do asset para adicionar tags contextuais
      const assetData = db.prepare('SELECT tags, created_at, gps_latitude, gps_longitude FROM assets WHERE id = ?').get(assetId) as any;
      let currentTags: string[] = [];
      try {
        currentTags = JSON.parse(assetData?.tags || '[]');
      } catch {
        currentTags = [];
      }

      // Adicionar tag de período do dia baseado na hora da foto
      const timeOfDayTag = this.getTimeOfDayTag(assetData?.created_at);

      // Adicionar tag de localização baseado nas coordenadas GPS
      const locationTag = this.getLocationTag(assetData?.gps_latitude, assetData?.gps_longitude);

      // Merge tags
      const newTags = validTags.map((t: any) => t.label);
      if (timeOfDayTag && !currentTags.includes(timeOfDayTag) && !newTags.includes(timeOfDayTag)) {
        newTags.push(timeOfDayTag);
      }
      if (locationTag && !currentTags.includes(locationTag) && !newTags.includes(locationTag)) {
        newTags.push(locationTag);
      }
      const combinedTags = [...new Set([...currentTags, ...newTags])];

      // Preparar embedding
      let embeddingBuffer: Buffer | null = null;
      if (data.embedding) {
        embeddingBuffer = Buffer.from(new Float32Array(data.embedding).buffer);
      }

      // Atualizar
      db.prepare(`
        UPDATE assets
        SET tags = ?,
            ai_embedding = ?,
            ai_processed_at = ?
        WHERE id = ?
      `).run(
        JSON.stringify(combinedTags),
        embeddingBuffer,
        Date.now(),
        assetId
      );

      // Notificar UI
      this.mainWindow?.webContents.send('asset-updated', {
        id: assetId,
        tags: combinedTags
      });
    } catch (error) {
      console.error('[AI Manager] Failed to update DB:', error);
    }

    this.processQueue();
  }

  // Determinar período do dia baseado na hora
  private getTimeOfDayTag(timestamp: number | null): string | null {
    if (!timestamp) return null;

    const date = new Date(timestamp);
    const hour = date.getHours();

    if (hour >= 5 && hour < 7) return 'amanhecer';
    if (hour >= 7 && hour < 12) return 'manhã';
    if (hour >= 12 && hour < 14) return 'meio-dia';
    if (hour >= 14 && hour < 17) return 'tarde';
    if (hour >= 17 && hour < 19) return 'entardecer';
    if (hour >= 19 && hour < 21) return 'anoitecer';
    return 'noite';
  }

  // Calcular distância entre dois pontos (fórmula de Haversine simplificada)
  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    // Aproximação simples (funciona bem para distâncias curtas)
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  // Encontrar cidade mais próxima das coordenadas GPS
  private getLocationTag(lat: number | null, lng: number | null): string | null {
    if (lat === null || lng === null) return null;
    if (citiesCache.length === 0) return null;

    let nearestCity: City | null = null;
    let minDistance = Infinity;

    for (const city of citiesCache) {
      const distance = this.getDistance(lat, lng, city.lat, city.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    // Limite de ~100km (aproximadamente 1 grau)
    if (nearestCity && minDistance < 1.0) {
      return `${nearestCity.name} - ${nearestCity.state}`;
    }

    return null;
  }

  private markAsProcessed(assetId: string, skipped: boolean = false) {
    try {
      const db = dbService.getDatabase();
      db.prepare(`
        UPDATE assets
        SET ai_processed_at = ?
        WHERE id = ?
      `).run(Date.now(), assetId);

      if (skipped) {
        console.log(`[AI Manager] Skipped ${assetId} (unsupported format)`);
      }
    } catch (error) {
      console.error('[AI Manager] Failed to mark as processed:', error);
    }
  }

  // Encontrar imagens similares usando embeddings
  async findSimilar(assetId: string, limit: number = 10): Promise<Array<{ assetId: string; score: number }>> {
    this.ensureUserEnabled();

    try {
      const db = dbService.getDatabase();

      const refAsset = db.prepare('SELECT ai_embedding FROM assets WHERE id = ?').get(assetId) as { ai_embedding: Buffer } | undefined;

      if (!refAsset?.ai_embedding) {
        return [];
      }

      const refEmbedding = new Float32Array(refAsset.ai_embedding.buffer, refAsset.ai_embedding.byteOffset, refAsset.ai_embedding.length / 4);
      const refArray = Array.from(refEmbedding);

      const assets = db.prepare(`
        SELECT id, ai_embedding
        FROM assets
        WHERE ai_embedding IS NOT NULL
        AND id != ?
        AND status = 'online'
      `).all(assetId) as Array<{ id: string; ai_embedding: Buffer }>;

      const results: Array<{ assetId: string; score: number }> = [];

      for (const asset of assets) {
        try {
          const embedding = new Float32Array(asset.ai_embedding.buffer, asset.ai_embedding.byteOffset, asset.ai_embedding.length / 4);
          const score = this.cosineSimilarity(refArray, Array.from(embedding));
          results.push({ assetId: asset.id, score });
        } catch {
          continue;
        }
      }

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (error) {
      console.error('[AI Manager] Find similar error:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Smart Culling: Detectar grupos de burst e sugerir a melhor foto
  async smartCull(options?: {
    timeThresholdMs?: number;
    similarityThreshold?: number;
    volumeUuid?: string;
    pathPrefix?: string;
  }): Promise<{
    groups: Array<{
      id: string;
      assetIds: string[];
      suggestedBestId: string;
      scores: Array<{ assetId: string; score: number; reason: string }>;
    }>;
  }> {
    const timeThreshold = options?.timeThresholdMs || 3000;
    const similarityThreshold = options?.similarityThreshold || 0.85;

    try {
      const db = dbService.getDatabase();

      let whereClause = "WHERE a.media_type = 'photo' AND a.status = 'online' AND a.ai_embedding IS NOT NULL AND length(a.ai_embedding) > 0";
      const params: any[] = [];

      if (options?.volumeUuid) {
        whereClause += ' AND a.volume_uuid = ?';
        params.push(options.volumeUuid);
      }

      if (options?.pathPrefix) {
        whereClause += ' AND a.relative_path LIKE ?';
        params.push(`${options.pathPrefix}%`);
      }

      const assets = db.prepare(`
        SELECT a.id, a.created_at, a.ai_embedding, a.file_name
        FROM assets a
        ${whereClause}
        ORDER BY a.created_at ASC
      `).all(...params) as Array<{
        id: string;
        created_at: number;
        ai_embedding: Buffer;
        file_name: string;
      }>;

      if (assets.length === 0) {
        return { groups: [] };
      }

      // Fase 1: Agrupar por proximidade temporal
      const temporalGroups: Array<Array<typeof assets[0]>> = [];
      let currentGroup: Array<typeof assets[0]> = [assets[0]];

      for (let i = 1; i < assets.length; i++) {
        const timeDiff = assets[i].created_at - assets[i - 1].created_at;
        if (timeDiff <= timeThreshold) {
          currentGroup.push(assets[i]);
        } else {
          if (currentGroup.length > 1) {
            temporalGroups.push(currentGroup);
          }
          currentGroup = [assets[i]];
        }
      }
      if (currentGroup.length > 1) {
        temporalGroups.push(currentGroup);
      }

      // Fase 2: Refinar grupos por similaridade
      const refinedGroups: Array<{ id: string; assets: Array<typeof assets[0]> }> = [];

      for (const group of temporalGroups) {
        if (group.length <= 5) {
          let allSimilar = true;
          const embeddings: number[][] = group.map(a => {
            const emb = new Float32Array(a.ai_embedding.buffer, a.ai_embedding.byteOffset, a.ai_embedding.length / 4);
            return Array.from(emb);
          });

          for (let i = 0; i < embeddings.length && allSimilar; i++) {
            for (let j = i + 1; j < embeddings.length && allSimilar; j++) {
              if (this.cosineSimilarity(embeddings[i], embeddings[j]) < similarityThreshold) {
                allSimilar = false;
              }
            }
          }

          if (allSimilar) {
            refinedGroups.push({ id: `burst_${group[0].created_at}`, assets: group });
          }
        } else {
          refinedGroups.push({ id: `burst_${group[0].created_at}`, assets: group });
        }
      }

      // Fase 3: Calcular scores
      const results: Array<{
        id: string;
        assetIds: string[];
        suggestedBestId: string;
        scores: Array<{ assetId: string; score: number; reason: string }>;
      }> = [];

      for (const group of refinedGroups) {
        const scores: Array<{ assetId: string; score: number; reason: string }> = [];

        for (const asset of group.assets) {
          const idx = group.assets.indexOf(asset);
          const centerScore = 1 - Math.abs(idx - group.assets.length / 2) / (group.assets.length / 2);

          let totalScore = centerScore * 0.6;
          let reason = `pos: ${(centerScore * 100).toFixed(0)}%`;

          // Penalizar extremos do burst
          if (idx === 0 || idx === group.assets.length - 1) {
            totalScore -= 0.15;
            reason += ', borda';
          }

          scores.push({ assetId: asset.id, score: totalScore, reason });
        }

        scores.sort((a, b) => b.score - a.score);

        results.push({
          id: group.id,
          assetIds: group.assets.map(a => a.id),
          suggestedBestId: scores[0].assetId,
          scores
        });
      }

      console.log(`[AI Manager] Smart Culling: found ${results.length} burst groups`);
      return { groups: results };
    } catch (error) {
      console.error('[AI Manager] Smart Culling error:', error);
      return { groups: [] };
    }
  }

  // Gerar sugestão de nome inteligente
  generateSmartName(assetId: string): { success: boolean; suggestedName?: string; error?: string } {
    this.ensureUserEnabled();

    try {
      const db = dbService.getDatabase();

      const asset = db.prepare(`
        SELECT file_name, tags, created_at
        FROM assets
        WHERE id = ?
      `).get(assetId) as { file_name: string; tags: string; created_at: number } | undefined;

      if (!asset) {
        return { success: false, error: 'Asset not found' };
      }

      const date = new Date(asset.created_at);
      const dateStr = date.toISOString().split('T')[0];

      let tags: string[] = [];
      try {
        tags = JSON.parse(asset.tags || '[]');
      } catch {
        tags = [];
      }

      const ext = path.extname(asset.file_name).toLowerCase();

      // Filtrar tags de período do dia para o nome
      const periodTags = ['amanhecer', 'manhã', 'meio-dia', 'tarde', 'entardecer', 'anoitecer', 'noite'];
      const mainTags = tags
        .filter(t => !periodTags.includes(t))
        .slice(0, 2)
        .map(t => String(t).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-áéíóúâêîôûãõàèìòùç]/gi, '').toLowerCase())
        .filter(Boolean);

      const tagPart = mainTags.length > 0 ? `_${mainTags.join('_')}` : '';
      const suggestedName = `${dateStr}${tagPart}_001${ext}`;

      return { success: true, suggestedName };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Scanear assets não processados
  scanForUnprocessedAssets() {
    if (this.disabled || this.userDisabled || !this.isReady) {
      return;
    }

    try {
      const db = dbService.getDatabase();
      const assets = db.prepare(`
        SELECT a.id, a.relative_path, v.mount_point
        FROM assets a
        LEFT JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.media_type = 'photo'
        AND a.status = 'online'
        AND v.mount_point IS NOT NULL
        AND (a.ai_processed_at IS NULL OR a.ai_embedding IS NULL)
        LIMIT 100
      `).all() as any[];

      console.log(`[AI Manager] Found ${assets.length} assets to process`);

      for (const asset of assets) {
        if (asset.mount_point && asset.relative_path) {
          const fullPath = path.join(asset.mount_point, asset.relative_path);
          this.queueAnalysis(asset.id, fullPath);
        }
      }
    } catch (error) {
      console.error('[AI Manager] Error scanning for assets:', error);
    }
  }

  // Reprocessar assets sem embedding
  async reprocessForEmbeddings(limit: number = 50): Promise<number> {
    if (this.disabled || this.userDisabled || !this.isReady) {
      return 0;
    }

    try {
      const db = dbService.getDatabase();
      const assets = db.prepare(`
        SELECT a.id, a.relative_path, v.mount_point
        FROM assets a
        LEFT JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.media_type = 'photo'
        AND a.status = 'online'
        AND v.mount_point IS NOT NULL
        AND a.ai_processed_at IS NOT NULL
        AND a.ai_embedding IS NULL
        LIMIT ?
      `).all(limit) as any[];

      const resetStmt = db.prepare('UPDATE assets SET ai_processed_at = NULL WHERE id = ?');
      for (const asset of assets) {
        resetStmt.run(asset.id);
        if (asset.mount_point && asset.relative_path) {
          const fullPath = path.join(asset.mount_point, asset.relative_path);
          this.queueAnalysis(asset.id, fullPath);
        }
      }

      return assets.length;
    } catch (error) {
      console.error('[AI Manager] Error reprocessing:', error);
      return 0;
    }
  }
}

export const aiManager = new AIManager();
