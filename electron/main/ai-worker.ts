/**
 * Worker Thread para processamento de IA
 * Executa modelos pesados (CLIP, Face Detection) em background
 */
import { parentPort } from 'worker_threads';
import { pipeline, env, RawImage } from '@xenova/transformers';
import path from 'path';
import os from 'os';
import fs from 'fs';
import sharp from 'sharp';

// Configurar transformers para ambiente Electron/Node (Worker Thread)
env.allowLocalModels = true;
env.useBrowserCache = false; // Desabilitar cache de browser (não funciona em Node)

// Configurar diretório de cache para modelos
const cacheDir = path.join(os.homedir(), '.cache', 'zona21', 'models');
env.cacheDir = cacheDir;
env.localModelPath = cacheDir;

// Garantir que o diretório existe
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Estado global do worker
let clipPipeline: any = null;
let featurePipeline: any = null;
let objectDetectionPipeline: any = null;
let modelLoadFailed = false;
let initPromise: Promise<void> | null = null;

interface AIWorkerMessage {
  type: 'init' | 'analyze' | 'search' | 'similarity' | 'embed_text';
  payload?: any;
  id?: string;
}

interface ClassificationResult {
  label: string;
  score: number;
}

// Processa resultados da classificação CLIP com threshold adaptativo
function processClassificationResults(results: ClassificationResult[]): ClassificationResult[] {
  if (!results || results.length === 0) return [];

  // Ordenar por score decrescente
  const sorted = [...results].sort((a, b) => b.score - a.score);

  // Estratégia adaptativa:
  // 1. Sempre incluir a tag com maior score se > 0.15
  // 2. Incluir tags adicionais se score > 0.12 E diferença para a top < 0.15
  // 3. Máximo de 5 tags por imagem
  const processedTags: ClassificationResult[] = [];
  const topScore = sorted[0]?.score || 0;

  // Threshold mínimo absoluto
  const MIN_THRESHOLD = 0.12;
  // Diferença máxima em relação ao top score
  const MAX_DIFF = 0.15;
  // Máximo de tags
  const MAX_TAGS = 5;

  for (const result of sorted) {
    if (processedTags.length >= MAX_TAGS) break;

    // Primeira tag precisa de score mínimo de 0.15
    if (processedTags.length === 0) {
      if (result.score >= 0.15) {
        processedTags.push(result);
      }
      continue;
    }

    // Tags subsequentes: score >= MIN_THRESHOLD e diferença aceitável do top
    if (result.score >= MIN_THRESHOLD && (topScore - result.score) <= MAX_DIFF) {
      processedTags.push(result);
    }
  }

  // Normalizar labels (substituir underscore por espaço para display)
  return processedTags.map(t => ({
    label: t.label.replace(/_/g, ' '),
    score: t.score
  }));
}

// Inicializar modelo CLIP
async function initModel(): Promise<boolean> {
  // Se já carregou com sucesso
  if (clipPipeline && featurePipeline) return true;
  
  // Se falhou anteriormente, não tentar novamente
  if (modelLoadFailed) return false;
  
  // Se já está carregando, aguardar
  if (initPromise) {
    await initPromise;
    return clipPipeline && featurePipeline;
  }

  initPromise = (async () => {
    try {
      parentPort?.postMessage({ type: 'status', status: 'loading_model' });
      console.log('[AI Worker] Iniciando download dos modelos CLIP...');
      console.log('[AI Worker] Cache dir:', cacheDir);
      
      // Carregar modelo para classificação (tags)
      console.log('[AI Worker] Carregando pipeline de classificação...');
      clipPipeline = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
            console.log(`[AI Worker] Download: ${progress.file} - ${Math.round(progress.progress)}%`);
          }
        }
      });
      console.log('[AI Worker] Pipeline de classificação carregado!');

      // Carregar modelo para embeddings (vetores)
      console.log('[AI Worker] Carregando pipeline de features...');
      featurePipeline = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32', {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
            console.log(`[AI Worker] Download: ${progress.file} - ${Math.round(progress.progress)}%`);
          }
        }
      });
      console.log('[AI Worker] Pipeline de features carregado!');

      // Carregar modelo para detecção de objetos (inclui pessoas/faces)
      console.log('[AI Worker] Carregando pipeline de object detection...');
      try {
        objectDetectionPipeline = await pipeline('object-detection', 'Xenova/detr-resnet-50', {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              console.log(`[AI Worker] Download: ${progress.file} - ${Math.round(progress.progress)}%`);
            }
          }
        });
        console.log('[AI Worker] Pipeline de object detection carregado!');
      } catch (err) {
        console.warn('[AI Worker] Object detection não disponível (opcional):', err);
        objectDetectionPipeline = null;
      }

      parentPort?.postMessage({ type: 'status', status: 'ready' });
      console.log('[AI Worker] Modelos carregados com sucesso!');
    } catch (error) {
      modelLoadFailed = true;
      clipPipeline = null;
      featurePipeline = null;
      console.error('[AI Worker] Erro ao carregar modelo:', error);
      parentPort?.postMessage({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Falha ao carregar modelo' 
      });
    }
  })();

  await initPromise;
  return clipPipeline && featurePipeline;
}

// Analisar imagem (gerar tags/classificação e embedding)
async function analyzeImage(filePath: string, id: string) {
  const modelReady = await initModel();
  
  if (!modelReady || !clipPipeline || !featurePipeline) {
    parentPort?.postMessage({
      type: 'error',
      id,
      error: 'Modelo não disponível - falha no carregamento'
    });
    return;
  }

  try {
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    console.log(`[AI Worker] Processando: ${filePath}`);

    // Criar arquivo temporário redimensionado
    // RawImage.fromURL com base64 grande pode falhar, então usamos arquivo temp
    const tempPath = path.join(os.tmpdir(), `zona21-ai-${Date.now()}.jpg`);

    try {
      await sharp(filePath)
        .resize(512, 512, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(tempPath);

      // Carregar imagem do arquivo temporário
      const image = await RawImage.fromURL(tempPath);
    
    // Lista expandida de categorias para classificação
    // Organizada por grupos semânticos para melhor cobertura
    const labels = [
      // Período do dia (time of day detection)
      'morning', 'afternoon', 'evening', 'night', 'sunset', 'sunrise', 'golden_hour', 'blue_hour',

      // Ambiente
      'indoor', 'outdoor',

      // Paisagens e natureza
      'landscape', 'nature', 'beach', 'mountain', 'forest', 'desert', 'snow', 'water', 'sky', 'clouds',

      // Urbano
      'city', 'street', 'architecture', 'building',

      // Pessoas e retratos
      'portrait', 'selfie', 'group_photo', 'people',

      // Animais
      'animal', 'dog', 'cat', 'bird', 'wildlife',

      // Eventos e ocasiões
      'party', 'wedding', 'birthday', 'graduation', 'concert', 'sports', 'travel', 'vacation',

      // Objetos e comida
      'food', 'drink', 'car', 'vehicle', 'flower', 'plant',

      // Estilo fotográfico
      'macro', 'aerial', 'underwater', 'black_and_white', 'studio'
    ];

    // Executar pipelines em paralelo usando a imagem carregada
    const [classification, features] = await Promise.all([
      clipPipeline(image, labels),
      featurePipeline(image)
    ]);
    
    // Log para debug
    console.log(`[AI Worker] Classification result:`, JSON.stringify(classification).substring(0, 200));
    console.log(`[AI Worker] Features type:`, typeof features, features?.data ? 'has data' : 'no data');
    
    // Converter Tensor para Array normal se necessário
    let embedding: number[] | null = null;
    if (features?.data) {
      embedding = Array.from(features.data as Float32Array);
      console.log(`[AI Worker] Embedding size: ${embedding.length}`);
    }

    // Processar classificações - pegar as mais relevantes
    // CLIP retorna scores de 0-1, usamos threshold adaptativo
    const processedTags = processClassificationResults(classification);

    // Detectar objetos/pessoas se o pipeline estiver disponível
    let detectedObjects: Array<{ label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } }> = [];
    let faces: Array<{ box: { x: number; y: number; width: number; height: number }; confidence: number }> = [];

    if (objectDetectionPipeline) {
      try {
        const detections = await objectDetectionPipeline(image, { threshold: 0.7 });
        detectedObjects = detections;

        // Filtrar pessoas como proxy para faces
        const personDetections = detections.filter((d: any) => d.label === 'person');
        faces = personDetections.map((d: any) => ({
          box: {
            x: d.box.xmin,
            y: d.box.ymin,
            width: d.box.xmax - d.box.xmin,
            height: d.box.ymax - d.box.ymin
          },
          confidence: d.score
        }));

        console.log(`[AI Worker] Detectados ${detectedObjects.length} objetos, ${faces.length} pessoas`);
      } catch (err) {
        console.warn('[AI Worker] Erro na detecção de objetos:', err);
      }
    }

    parentPort?.postMessage({
      type: 'result',
      id,
      task: 'analyze',
      data: {
        tags: processedTags,
        embedding: embedding,
        objects: detectedObjects,
        faces: faces
      }
    });

      console.log(`[AI Worker] Análise concluída para ${id}`);
    } finally {
      // Limpar arquivo temporário
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch {
        // Ignorar erros ao deletar temp file
      }
    }
  } catch (error) {
    parentPort?.postMessage({
      type: 'error',
      id,
      error: error instanceof Error ? error.message : 'Erro na análise'
    });
  }
}

// Gerar embedding de texto para busca semântica
async function embedText(text: string, id: string) {
  const modelReady = await initModel();

  if (!modelReady || !featurePipeline) {
    parentPort?.postMessage({
      type: 'error',
      id,
      error: 'Modelo não disponível - falha no carregamento'
    });
    return;
  }

  try {
    console.log(`[AI Worker] Gerando embedding para texto: "${text}"`);

    // CLIP pode gerar embeddings de texto diretamente
    // Usamos o tokenizer/text encoder do modelo
    const { AutoTokenizer, CLIPTextModelWithProjection } = await import('@xenova/transformers');

    // Carregar tokenizer e modelo de texto se ainda não carregados
    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
    const textModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32');

    // Tokenizar o texto
    const textInputs = tokenizer(text, { padding: true, truncation: true });

    // Gerar embedding
    const textOutput = await textModel(textInputs);

    let embedding: number[] | null = null;
    if (textOutput?.text_embeds?.data) {
      embedding = Array.from(textOutput.text_embeds.data as Float32Array);
      // Normalizar o vetor (L2 normalization para distância de cosseno)
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      embedding = embedding.map(val => val / norm);
    }

    parentPort?.postMessage({
      type: 'result',
      id,
      task: 'embed_text',
      data: { embedding }
    });

    console.log(`[AI Worker] Embedding de texto gerado, tamanho: ${embedding?.length || 0}`);
  } catch (error) {
    console.error('[AI Worker] Erro ao gerar embedding de texto:', error);
    parentPort?.postMessage({
      type: 'error',
      id,
      error: error instanceof Error ? error.message : 'Erro ao gerar embedding de texto'
    });
  }
}

// Calcular similaridade de cosseno entre dois vetores
function cosineSimilarity(a: number[], b: number[]): number {
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

// Handler de mensagens
parentPort?.on('message', async (message: AIWorkerMessage) => {
  switch (message.type) {
    case 'init':
      await initModel();
      break;

    case 'analyze':
      if (message.payload?.filePath) {
        await analyzeImage(message.payload.filePath, message.id || 'unknown');
      }
      break;

    case 'embed_text':
      if (message.payload?.text) {
        await embedText(message.payload.text, message.id || 'unknown');
      }
      break;
  }
});

// Sinalizar que worker iniciou
parentPort?.postMessage({ type: 'status', status: 'idle' });
