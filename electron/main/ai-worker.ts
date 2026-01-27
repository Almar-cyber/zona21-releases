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
let featurePipeline: any = null;
let objectDetectionPipeline: any = null;
let classifierPipeline: any = null; // Classificador de imagem genérico
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

// Inicializar modelos de IA
async function initModel(): Promise<boolean> {
  // Se já carregou com sucesso
  if (classifierPipeline) return true;

  // Se falhou anteriormente, não tentar novamente
  if (modelLoadFailed) return false;

  // Se já está carregando, aguardar
  if (initPromise) {
    await initPromise;
    return !!classifierPipeline;
  }

  initPromise = (async () => {
    try {
      parentPort?.postMessage({ type: 'status', status: 'loading_model' });
      console.log('[AI Worker] Iniciando download dos modelos...');
      console.log('[AI Worker] Cache dir:', cacheDir);

      // Carregar modelo de classificação de imagem (ViT treinado no ImageNet)
      // Funciona bem e não tem problemas com tokenização de texto
      console.log('[AI Worker] Carregando pipeline de classificação (ViT)...');
      classifierPipeline = await pipeline('image-classification', 'Xenova/vit-base-patch16-224', {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
            console.log(`[AI Worker] Download ViT: ${progress.file} - ${Math.round(progress.progress)}%`);
          }
        }
      });
      console.log('[AI Worker] Pipeline de classificação carregado!');

      // Sinalizar que está pronto para processar
      parentPort?.postMessage({ type: 'status', status: 'ready' });
      console.log('[AI Worker] Modelos principais carregados!');

      // Carregar modelo para detecção de objetos em background (opcional)
      setTimeout(async () => {
        console.log('[AI Worker] Carregando pipeline de object detection em background...');
        try {
          objectDetectionPipeline = await pipeline('object-detection', 'Xenova/detr-resnet-50', {
            progress_callback: (progress: any) => {
              if (progress.status === 'progress') {
                console.log(`[AI Worker] Download DETR: ${progress.file} - ${Math.round(progress.progress)}%`);
              }
            }
          });
          console.log('[AI Worker] Pipeline de object detection carregado!');
        } catch (err) {
          console.warn('[AI Worker] Object detection não disponível (opcional):', err);
          objectDetectionPipeline = null;
        }
      }, 5000);

      // Tentar carregar features para embeddings em background (pode falhar)
      setTimeout(async () => {
        console.log('[AI Worker] Tentando carregar pipeline de features em background...');
        try {
          featurePipeline = await pipeline('image-feature-extraction', 'Xenova/vit-base-patch16-224', {
            progress_callback: (progress: any) => {
              if (progress.status === 'progress') {
                console.log(`[AI Worker] Download Features: ${progress.file} - ${Math.round(progress.progress)}%`);
              }
            }
          });
          console.log('[AI Worker] Pipeline de features carregado!');
        } catch (err) {
          console.warn('[AI Worker] Features não disponível (busca por similaridade desabilitada):', err);
          featurePipeline = null;
        }
      }, 10000);
    } catch (error) {
      modelLoadFailed = true;
      classifierPipeline = null;
      console.error('[AI Worker] Erro ao carregar modelo:', error);
      parentPort?.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Falha ao carregar modelo'
      });
    }
  })();

  await initPromise;
  return !!classifierPipeline;
}

// Mapeamento de classes ImageNet para tags mais amigáveis
const IMAGENET_TO_TAG: Record<string, string> = {
  // Animais
  'golden retriever': 'dog', 'labrador retriever': 'dog', 'german shepherd': 'dog',
  'poodle': 'dog', 'beagle': 'dog', 'bulldog': 'dog', 'chihuahua': 'dog',
  'tabby': 'cat', 'persian cat': 'cat', 'siamese cat': 'cat', 'egyptian cat': 'cat',
  'tiger cat': 'cat', 'lion': 'wildlife', 'tiger': 'wildlife', 'cheetah': 'wildlife',
  'jay': 'bird', 'magpie': 'bird', 'chickadee': 'bird', 'robin': 'bird',
  'hummingbird': 'bird', 'flamingo': 'bird', 'pelican': 'bird', 'crane': 'bird',
  // Veículos
  'sports car': 'car', 'convertible': 'car', 'minivan': 'car', 'cab': 'car',
  'jeep': 'car', 'limousine': 'car', 'beach wagon': 'car', 'pickup': 'car',
  'motor scooter': 'vehicle', 'motorcycle': 'vehicle', 'bicycle': 'vehicle',
  'mountain bike': 'vehicle', 'airliner': 'vehicle', 'speedboat': 'vehicle',
  // Natureza
  'seashore': 'beach', 'lakeside': 'water', 'cliff': 'landscape', 'valley': 'landscape',
  'volcano': 'mountain', 'alp': 'mountain', 'coral reef': 'underwater',
  'daisy': 'flower', 'rose': 'flower', 'sunflower': 'flower', 'tulip': 'flower',
  // Comida
  'pizza': 'food', 'hamburger': 'food', 'hot dog': 'food', 'ice cream': 'food',
  'espresso': 'drink', 'cup': 'drink', 'wine bottle': 'drink', 'beer glass': 'drink',
  // Arquitetura
  'church': 'architecture', 'castle': 'architecture', 'palace': 'architecture',
  'mosque': 'architecture', 'monastery': 'architecture', 'bell cote': 'architecture',
  'dome': 'architecture', 'stupa': 'architecture', 'barn': 'building',
  'greenhouse': 'building', 'boathouse': 'building',
  // Pessoas (itens relacionados)
  'suit': 'people', 'gown': 'people', 'kimono': 'people', 'bikini': 'people',
  'swimming trunks': 'people', 'bow tie': 'people', 'sombrero': 'people',
};

// Analisar imagem (gerar tags/classificação e embedding)
async function analyzeImage(filePath: string, id: string) {
  const modelReady = await initModel();

  if (!modelReady || !classifierPipeline) {
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
    const tempPath = path.join(os.tmpdir(), `zona21-ai-${Date.now()}.jpg`);

    try {
      await sharp(filePath)
        .resize(224, 224, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(tempPath);

      // Carregar imagem do arquivo temporário
      const image = await RawImage.fromURL(tempPath);

      // Classificar imagem
      let processedTags: Array<{ label: string; score: number }> = [];
      const classification = await classifierPipeline(image, { topk: 5 });
      console.log(`[AI Worker] Classification:`, JSON.stringify(classification).substring(0, 300));

      // Converter classes ImageNet para tags amigáveis
      const tagSet = new Set<string>();
      for (const result of classification) {
        const label = result.label.toLowerCase();
        const score = result.score;

        if (score < 0.1) continue; // Ignorar scores muito baixos

        // Verificar se tem mapeamento direto
        const mappedTag = IMAGENET_TO_TAG[label];
        if (mappedTag && !tagSet.has(mappedTag)) {
          tagSet.add(mappedTag);
          processedTags.push({ label: mappedTag, score });
        } else if (!mappedTag && score > 0.15) {
          // Usar label original se score alto e sem mapeamento
          const cleanLabel = label.split(',')[0].trim().replace(/_/g, ' ');
          if (!tagSet.has(cleanLabel)) {
            tagSet.add(cleanLabel);
            processedTags.push({ label: cleanLabel, score });
          }
        }
      }

      // Extrair features para embedding (opcional - pode não estar disponível)
      let embedding: number[] | null = null;
      if (featurePipeline) {
        try {
          const features = await featurePipeline(image);
          if (features?.data) {
            embedding = Array.from(features.data as Float32Array);
            console.log(`[AI Worker] Embedding size: ${embedding.length}`);
          }
        } catch (err) {
          console.warn('[AI Worker] Erro ao extrair features (continuando sem embedding):', err);
        }
      }

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
