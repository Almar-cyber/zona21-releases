/**
 * Gerenciador do Worker de IA
 * Controla o ciclo de vida do worker de IA e fila de processamento
 */
import { Worker } from 'worker_threads';
import path from 'path';
import { BrowserWindow } from 'electron';
import { dbService } from './database';

interface AIJob {
  id: string;
  type: 'analyze' | 'embed_text';
  filePath?: string;
  assetId?: string;
  text?: string;
  resolve?: (value: any) => void;
  reject?: (error: any) => void;
}

// Formatos de imagem suportados pelo CLIP/Transformers.js
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

class AIManager {
  private worker: Worker | null = null;
  private mainWindow: BrowserWindow | null = null;
  private isReady = false;
  private queue: AIJob[] = [];
  private processing: Set<string> = new Set();
  private disabled = false; // Flag para desabilitar se houver erro crítico

  // Limite de concorrência para análise (embora o worker seja single-threaded,
  // isso controla quantos jobs enviamos por vez)
  private readonly CONCURRENCY = 1;

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
  }

  async start(): Promise<void> {
    if (this.worker) return;

    try {
      // O worker sempre é compilado como .js pelo Vite, tanto em dev quanto em prod
      const workerPath = path.join(__dirname, 'ai-worker.js');

      console.log('[AI Manager] Starting worker from:', workerPath);

      // Verificar se o arquivo existe
      const fs = require('fs');
      if (!fs.existsSync(workerPath)) {
        console.error('[AI Manager] Worker file not found:', workerPath);
        console.error('[AI Manager] Directory contents:', fs.readdirSync(__dirname));
        return;
      }

      this.worker = new Worker(workerPath);

      this.worker.on('message', (message) => this.handleWorkerMessage(message));
      this.worker.on('error', (error) => {
        console.error('[AI Manager] Worker error:', error);
        this.isReady = false;
        // Se o worker crashar, desabilitar o AI Manager
        this.disabled = true;
        console.warn('[AI Manager] AI features disabled due to worker error');
      });
      this.worker.on('exit', (code) => {
        console.log(`[AI Manager] Worker stopped with exit code ${code}`);
        this.isReady = false;
        this.worker = null;
      });

      // Inicializar modelo
      this.worker.postMessage({ type: 'init' });
    } catch (error) {
      console.error('[AI Manager] Failed to start worker:', error);
      this.worker = null;
      this.isReady = false;
      this.disabled = true;
      console.warn('[AI Manager] AI features disabled - app will continue without AI capabilities');
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
    // Se o AI Manager foi desabilitado, não aceitar novos jobs
    if (this.disabled) {
      return;
    }

    // Evitar duplicatas na fila
    if (this.queue.some(job => job.assetId === assetId) || this.processing.has(assetId)) {
      return;
    }

    // Verificar se é um formato suportado
    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      // Marcar como processado para não tentar novamente (formato não suportado)
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
    if (!this.worker || !this.isReady || this.processing.size >= this.CONCURRENCY || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    // Jobs de análise de imagem usam assetId
    if (job.type === 'analyze' && job.assetId) {
      this.processing.add(job.assetId);

      this.worker.postMessage({
        type: job.type,
        id: job.assetId, // Usando assetId como ID da mensagem para correlação
        payload: {
          filePath: job.filePath
        }
      });
    }
  }

  private handleWorkerMessage(message: any) {
    console.log(`[AI Manager] Received message type: ${message.type}`);
    
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
        console.log(`[AI Manager] Got result for ${message.id}, task: ${message.task}`);

        // Verificar se é uma resposta para callback pendente (busca semântica)
        if (message.id && this.pendingCallbacks.has(message.id)) {
          const callback = this.pendingCallbacks.get(message.id)!;
          this.pendingCallbacks.delete(message.id);

          if (message.task === 'embed_text') {
            callback.resolve(message.data?.embedding || null);
          } else {
            callback.resolve(message.data);
          }
          return;
        }

        // Resultado de análise de imagem normal
        if (message.task === 'analyze') {
          this.handleAnalysisResult(message.id, message.data);
        }
        break;

      case 'error':
        console.error(`[AI Manager] Error processing ${message.id}:`, message.error);
        this.processing.delete(message.id);
        // Só marcar como processado se for erro de formato não suportado
        // Outros erros permitem retry
        if (message.id && message.error?.includes('não suportado')) {
          this.markAsProcessed(message.id, true);
        }
        this.processQueue();
        break;
    }
  }

  private handleAnalysisResult(assetId: string, data: {
    tags: any[];
    embedding: number[] | null;
    objects?: any[];
    faces?: Array<{ box: { x: number; y: number; width: number; height: number }; confidence: number }>;
  }) {
    this.processing.delete(assetId);

    console.log(`[AI Manager] Received result for ${assetId}:`, JSON.stringify(data).substring(0, 300));

    // Processar tags retornadas (já filtradas pelo worker)
    const validTags = (data.tags || [])
      .filter((r: any) => r.score > 0.1)
      .map((r: any) => ({ label: r.label, score: r.score }));

    // Log de objetos detectados
    if (data.objects && data.objects.length > 0) {
      console.log(`[AI Manager] Detected objects: ${data.objects.map((o: any) => o.label).join(', ')}`);
    }

    // Log de faces/pessoas detectadas
    if (data.faces && data.faces.length > 0) {
      console.log(`[AI Manager] Detected ${data.faces.length} faces/people`);
    }

    console.log(`[AI Manager] Analysis for ${assetId}: found ${validTags.length} tags, embedding: ${data.embedding ? data.embedding.length : 'null'}`);

    // Atualizar banco de dados
    try {
        const db = dbService.getDatabase();
        
        // Buscar tags existentes
        const row = db.prepare('SELECT tags FROM assets WHERE id = ?').get(assetId) as any;
        let currentTags: string[] = [];
        try {
            currentTags = JSON.parse(row?.tags || '[]');
        } catch {
            currentTags = [];
        }

        // Merge tags (evitando duplicatas e mantendo as manuais)
        const newTags = validTags.map((t: any) => t.label);
        const combinedTags = [...new Set([...currentTags, ...newTags])];

        // Preparar embedding para BLOB
        let embeddingBuffer: Buffer | null = null;
        if (data.embedding) {
          // Converter array de números para Float32Array e depois para Buffer
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

        // Salvar faces detectadas
        if (data.faces && data.faces.length > 0) {
          const insertFace = db.prepare(`
            INSERT OR REPLACE INTO faces (id, asset_id, bbox_x, bbox_y, bbox_width, bbox_height, confidence, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (let i = 0; i < data.faces.length; i++) {
            const face = data.faces[i];
            const faceId = `${assetId}_face_${i}`;
            insertFace.run(
              faceId,
              assetId,
              face.box.x,
              face.box.y,
              face.box.width,
              face.box.height,
              face.confidence,
              Date.now()
            );
          }
          console.log(`[AI Manager] Saved ${data.faces.length} faces for ${assetId}`);
        }

        // Notificar UI
        this.mainWindow?.webContents.send('asset-updated', {
          id: assetId,
          tags: combinedTags,
          faceCount: data.faces?.length || 0
        });
    } catch (error) {
        console.error('[AI Manager] Failed to update DB:', error);
    }

    this.processQueue();
  }

  // Marcar asset como processado (com ou sem sucesso)
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

  // Mapa de callbacks pendentes para operações que esperam resposta
  private pendingCallbacks = new Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>();

  // Busca por tags (alternativa à busca semântica)
  // Como usamos ViT em vez de CLIP, não temos embeddings de texto compatíveis
  // Então fazemos busca por tags que correspondem ao termo de busca
  async semanticSearch(query: string, limit: number = 20): Promise<Array<{ assetId: string; score: number }>> {
    try {
      const db = dbService.getDatabase();
      const searchTerm = query.toLowerCase().trim();

      // Buscar tags que correspondem ao termo (em inglês ou português)
      const matchingTags = this.findMatchingTags(searchTerm);

      if (matchingTags.length === 0) {
        console.log(`[AI Manager] No matching tags found for: "${query}"`);
        // Tentar busca direta no campo tags
        const assets = db.prepare(`
          SELECT id FROM assets
          WHERE status = 'online'
          AND tags LIKE ?
          LIMIT ?
        `).all(`%${searchTerm}%`, limit) as Array<{ id: string }>;

        return assets.map((a, idx) => ({
          assetId: a.id,
          score: 1 - (idx * 0.01) // Score decrescente baseado na ordem
        }));
      }

      console.log(`[AI Manager] Searching for tags: ${matchingTags.join(', ')}`);

      // Construir query para buscar assets com essas tags
      const tagConditions = matchingTags.map(() => 'tags LIKE ?').join(' OR ');
      const tagParams = matchingTags.map(tag => `%"${tag}"%`);

      const assets = db.prepare(`
        SELECT id, tags FROM assets
        WHERE status = 'online'
        AND (${tagConditions})
        LIMIT ?
      `).all(...tagParams, limit * 2) as Array<{ id: string; tags: string }>;

      // Calcular score baseado em quantas tags correspondem
      const results: Array<{ assetId: string; score: number }> = [];

      for (const asset of assets) {
        let tagMatches = 0;
        try {
          const assetTags = JSON.parse(asset.tags || '[]') as string[];
          for (const tag of assetTags) {
            if (matchingTags.includes(tag.toLowerCase())) {
              tagMatches++;
            }
          }
        } catch {
          continue;
        }

        if (tagMatches > 0) {
          results.push({
            assetId: asset.id,
            score: tagMatches / matchingTags.length // Score proporcional às correspondências
          });
        }
      }

      // Ordenar por score decrescente
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (error) {
      console.error('[AI Manager] Tag search error:', error);
      return [];
    }
  }

  // Helper: Encontrar tags que correspondem a um termo de busca
  private findMatchingTags(searchTerm: string): string[] {
    const lower = searchTerm.toLowerCase().trim();
    const matches: string[] = [];

    // Mapa de traduções PT -> EN
    const TAG_TRANSLATIONS: Record<string, string> = {
      'cachorro': 'dog', 'gato': 'cat', 'pássaro': 'bird', 'vida selvagem': 'wildlife',
      'animal': 'animal', 'leão': 'lion', 'tigre': 'tiger', 'cavalo': 'horse',
      'praia': 'beach', 'montanha': 'mountain', 'floresta': 'forest', 'paisagem': 'landscape',
      'natureza': 'nature', 'água': 'water', 'céu': 'sky', 'pôr do sol': 'sunset',
      'cidade': 'city', 'rua': 'street', 'arquitetura': 'architecture', 'edifício': 'building',
      'pessoas': 'people', 'pessoa': 'person', 'retrato': 'portrait', 'família': 'family',
      'festa': 'party', 'casamento': 'wedding', 'show': 'concert', 'viagem': 'travel',
      'comida': 'food', 'bebida': 'drink', 'carro': 'car', 'flor': 'flower',
      'palco': 'stage', 'microfone': 'microphone', 'guitarra': 'guitar', 'piano': 'piano',
      'televisão': 'television', 'computador': 'computer', 'restaurante': 'restaurant',
      'interior': 'indoor', 'exterior': 'outdoor', 'noite': 'night', 'manhã': 'morning',
    };

    // Busca em português -> inglês
    if (TAG_TRANSLATIONS[lower]) {
      matches.push(TAG_TRANSLATIONS[lower]);
    }

    // Busca direta em inglês (tags são armazenadas em inglês)
    const englishTags = Object.values(TAG_TRANSLATIONS);
    if (englishTags.includes(lower)) {
      matches.push(lower);
    }

    // Busca parcial
    for (const [pt, en] of Object.entries(TAG_TRANSLATIONS)) {
      if ((pt.includes(lower) || en.includes(lower)) && !matches.includes(en)) {
        matches.push(en);
      }
    }

    return matches;
  }

  // Encontrar imagens similares a um asset
  async findSimilar(assetId: string, limit: number = 10): Promise<Array<{ assetId: string; score: number }>> {
    if (this.disabled) {
      return [];
    }

    try {
      const db = dbService.getDatabase();

      // Buscar embedding do asset de referência
      const refAsset = db.prepare('SELECT ai_embedding FROM assets WHERE id = ?').get(assetId) as { ai_embedding: Buffer } | undefined;

      if (!refAsset?.ai_embedding) {
        console.log(`[AI Manager] Asset ${assetId} has no embedding`);
        return [];
      }

      // Converter BLOB para array
      const refEmbedding = new Float32Array(refAsset.ai_embedding.buffer, refAsset.ai_embedding.byteOffset, refAsset.ai_embedding.length / 4);
      const refArray = Array.from(refEmbedding);

      // Buscar todos os outros assets com embeddings
      const assets = db.prepare(`
        SELECT id, ai_embedding
        FROM assets
        WHERE ai_embedding IS NOT NULL
        AND id != ?
        AND status = 'online'
      `).all(assetId) as Array<{ id: string; ai_embedding: Buffer }>;

      // Calcular similaridade
      const results: Array<{ assetId: string; score: number }> = [];

      for (const asset of assets) {
        try {
          const embedding = new Float32Array(asset.ai_embedding.buffer, asset.ai_embedding.byteOffset, asset.ai_embedding.length / 4);
          const embeddingArray = Array.from(embedding);

          const score = this.cosineSimilarity(refArray, embeddingArray);
          results.push({ assetId: asset.id, score });
        } catch {
          continue;
        }
      }

      // Ordenar por score e retornar top N
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (error) {
      console.error('[AI Manager] Find similar error:', error);
      return [];
    }
  }

  // Helper: Calcular similaridade de cosseno
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

  // Smart Culling: Detectar grupos de burst e sugerir a melhor foto de cada grupo
  async smartCull(options?: {
    timeThresholdMs?: number;  // Intervalo máximo entre fotos do mesmo burst (default: 3000ms)
    similarityThreshold?: number; // Threshold de similaridade para agrupar (default: 0.85)
    volumeUuid?: string; // Filtrar por volume específico
    pathPrefix?: string; // Filtrar por pasta específica
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

      // Query base para buscar fotos com embeddings
      let whereClause = "WHERE a.media_type = 'photo' AND a.status = 'online' AND a.ai_embedding IS NOT NULL";
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
        SELECT a.id, a.created_at, a.ai_embedding, a.file_name,
               (SELECT COUNT(*) FROM faces f WHERE f.asset_id = a.id) as face_count
        FROM assets a
        ${whereClause}
        ORDER BY a.created_at ASC
      `).all(...params) as Array<{
        id: string;
        created_at: number;
        ai_embedding: Buffer;
        file_name: string;
        face_count: number;
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

      // Fase 2: Refinar grupos por similaridade de embedding
      const refinedGroups: Array<{
        id: string;
        assets: Array<typeof assets[0]>;
      }> = [];

      for (const group of temporalGroups) {
        // Para grupos pequenos (2-3), verificar similaridade entre todos
        // Para grupos maiores, usar clustering simplificado
        if (group.length <= 5) {
          // Verificar se o grupo é realmente similar
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
            refinedGroups.push({
              id: `burst_${group[0].created_at}`,
              assets: group
            });
          }
        } else {
          // Para grupos grandes, assumir que são do mesmo burst se temporalmente próximos
          refinedGroups.push({
            id: `burst_${group[0].created_at}`,
            assets: group
          });
        }
      }

      // Fase 3: Calcular scores e sugerir melhor foto
      const results: Array<{
        id: string;
        assetIds: string[];
        suggestedBestId: string;
        scores: Array<{ assetId: string; score: number; reason: string }>;
      }> = [];

      for (const group of refinedGroups) {
        const scores: Array<{ assetId: string; score: number; reason: string }> = [];

        for (const asset of group.assets) {
          // Score baseado em:
          // 1. Quantidade de faces detectadas (mais faces = melhor para grupo)
          // 2. Não ser o primeiro/último do burst (geralmente com mais motion blur)
          // 3. Posição central do grupo
          const idx = group.assets.indexOf(asset);
          const centerScore = 1 - Math.abs(idx - group.assets.length / 2) / (group.assets.length / 2);

          let totalScore = 0;
          let reason = '';

          // Face bonus
          if (asset.face_count > 0) {
            totalScore += asset.face_count * 0.3;
            reason += `${asset.face_count} face(s), `;
          }

          // Center position bonus (menos motion blur)
          totalScore += centerScore * 0.4;
          reason += `pos: ${(centerScore * 100).toFixed(0)}%, `;

          // Evitar extremos do burst
          if (idx === 0 || idx === group.assets.length - 1) {
            totalScore -= 0.1;
            reason += 'edge, ';
          }

          scores.push({
            assetId: asset.id,
            score: totalScore,
            reason: reason.replace(/, $/, '')
          });
        }

        // Ordenar por score e pegar o melhor
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

  // Gerar sugestão de nome inteligente para um asset
  generateSmartName(assetId: string): { success: boolean; suggestedName?: string; error?: string } {
    try {
      const db = dbService.getDatabase();

      const asset = db.prepare(`
        SELECT file_name, tags, created_at, media_type
        FROM assets
        WHERE id = ?
      `).get(assetId) as {
        file_name: string;
        tags: string;
        created_at: number;
        media_type: string;
      } | undefined;

      if (!asset) {
        return { success: false, error: 'Asset not found' };
      }

      // Parse da data
      const date = new Date(asset.created_at);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      // Parse das tags
      let tags: string[] = [];
      try {
        tags = JSON.parse(asset.tags || '[]');
      } catch {
        tags = [];
      }

      // Pegar extensão original
      const ext = path.extname(asset.file_name).toLowerCase();

      // Gerar nome baseado em tags (max 3 tags principais)
      const mainTags = tags.slice(0, 3).map(t =>
        String(t)
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-]/g, '')
          .toLowerCase()
      ).filter(Boolean);

      // Formato: YYYY-MM-DD_tag1_tag2_tag3_001.ext
      // Se não houver tags, usar apenas data
      const tagPart = mainTags.length > 0 ? `_${mainTags.join('_')}` : '';
      const suggestedName = `${dateStr}${tagPart}_001${ext}`;

      return { success: true, suggestedName };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Gerar sugestões de nome para múltiplos assets (batch)
  generateSmartNames(assetIds: string[]): Array<{ assetId: string; suggestedName: string | null }> {
    const results: Array<{ assetId: string; suggestedName: string | null }> = [];

    // Agrupar por data e tags similares para numeração sequencial
    const groupedByDateAndTags = new Map<string, Array<{ assetId: string; ext: string }>>();

    const db = dbService.getDatabase();

    for (const assetId of assetIds) {
      const asset = db.prepare(`
        SELECT file_name, tags, created_at
        FROM assets
        WHERE id = ?
      `).get(assetId) as { file_name: string; tags: string; created_at: number } | undefined;

      if (!asset) {
        results.push({ assetId, suggestedName: null });
        continue;
      }

      const date = new Date(asset.created_at);
      const dateStr = date.toISOString().split('T')[0];

      let tags: string[] = [];
      try {
        tags = JSON.parse(asset.tags || '[]');
      } catch {
        tags = [];
      }

      const mainTags = tags.slice(0, 3).map(t =>
        String(t).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
      ).filter(Boolean);

      const ext = path.extname(asset.file_name).toLowerCase();
      const tagPart = mainTags.join('_');
      const groupKey = `${dateStr}_${tagPart}`;

      if (!groupedByDateAndTags.has(groupKey)) {
        groupedByDateAndTags.set(groupKey, []);
      }
      groupedByDateAndTags.get(groupKey)!.push({ assetId, ext });
    }

    // Gerar nomes com numeração sequencial por grupo
    for (const [groupKey, items] of groupedByDateAndTags) {
      let counter = 1;
      for (const item of items) {
        const num = String(counter).padStart(3, '0');
        const suggestedName = groupKey ? `${groupKey}_${num}${item.ext}` : `photo_${num}${item.ext}`;
        results.push({ assetId: item.assetId, suggestedName });
        counter++;
      }
    }

    return results;
  }

  // Scanear assets que ainda não foram processados pela IA
  scanForUnprocessedAssets() {
    // Só escanear se o AI Manager não estiver desabilitado e o worker estiver pronto
    if (this.disabled) {
      return;
    }

    if (!this.isReady) {
      console.log('[AI Manager] Worker not ready, skipping scan');
      return;
    }

    try {
      const db = dbService.getDatabase();
      // Pegar até 100 assets não processados que são imagens
      // Inclui assets que foram processados mas não têm embedding (para Smart Culling)
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

      console.log(`[AI Manager] Found ${assets.length} assets to process (unprocessed or missing embeddings)`);

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

  // Forçar reprocessamento de assets para gerar embeddings
  async reprocessForEmbeddings(limit: number = 50): Promise<number> {
    if (this.disabled || !this.isReady) {
      return 0;
    }

    try {
      const db = dbService.getDatabase();
      // Buscar assets processados mas sem embedding
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

      console.log(`[AI Manager] Reprocessing ${assets.length} assets for embeddings`);

      // Resetar ai_processed_at para permitir reprocessamento
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
      console.error('[AI Manager] Error reprocessing for embeddings:', error);
      return 0;
    }
  }
}

export const aiManager = new AIManager();
