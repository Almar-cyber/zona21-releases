/**
 * Worker Thread para processamento de IA
 * Modelo: ViT (vit-base-patch16-224) para classificação de imagens
 *
 * Funcionalidades:
 * - Classificação de objetos
 * - Classificação de cenários (praia, montanha, cidade, etc.)
 * - Extração de embeddings para Smart Culling e busca por similaridade
 */
import { parentPort } from 'worker_threads';
import { pipeline, env, RawImage } from '@xenova/transformers';
import path from 'path';
import os from 'os';
import fs from 'fs';
import sharp from 'sharp';

// Configurar transformers para ambiente Electron/Node (Worker Thread)
env.allowLocalModels = true;
env.useBrowserCache = false;

// Configurar diretório de cache para modelos
const cacheDir = path.join(os.homedir(), '.cache', 'zona21', 'models');
env.cacheDir = cacheDir;
env.localModelPath = cacheDir;

// Garantir que o diretório existe
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Estado global do worker
let classifierPipeline: any = null;
let featurePipeline: any = null;
let modelLoadFailed = false;
let initPromise: Promise<void> | null = null;

interface AIWorkerMessage {
  type: 'init' | 'analyze';
  payload?: any;
  id?: string;
}

// Inicializar modelos de IA
async function initModel(): Promise<boolean> {
  if (classifierPipeline) return true;
  if (modelLoadFailed) return false;

  if (initPromise) {
    await initPromise;
    return !!classifierPipeline;
  }

  initPromise = (async () => {
    try {
      parentPort?.postMessage({ type: 'status', status: 'loading_model' });
      console.log('[AI Worker] Iniciando download do modelo ViT...');
      console.log('[AI Worker] Cache dir:', cacheDir);

      // Carregar modelo de classificação de imagem (ViT treinado no ImageNet)
      console.log('[AI Worker] Carregando ViT para classificação...');
      classifierPipeline = await pipeline('image-classification', 'Xenova/vit-base-patch16-224', {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
            console.log(`[AI Worker] Download ViT: ${progress.file} - ${Math.round(progress.progress)}%`);
          }
        }
      });
      console.log('[AI Worker] ViT carregado!');

      // Carregar pipeline de features para embeddings (Smart Culling e Similaridade)
      console.log('[AI Worker] Carregando pipeline de features...');
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
        console.warn('[AI Worker] Features não disponível:', err);
        featurePipeline = null;
      }

      // Sinalizar que está pronto
      parentPort?.postMessage({ type: 'status', status: 'ready' });
      console.log('[AI Worker] Modelo pronto!');

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

// Mapeamento expandido de classes ImageNet para tags em português
// Inclui objetos, cenários e contextos
const IMAGENET_TO_TAG: Record<string, string> = {
  // === ANIMAIS ===
  'golden retriever': 'cachorro', 'labrador retriever': 'cachorro', 'german shepherd': 'cachorro',
  'poodle': 'cachorro', 'beagle': 'cachorro', 'bulldog': 'cachorro', 'chihuahua': 'cachorro',
  'pembroke': 'cachorro', 'collie': 'cachorro', 'boxer': 'cachorro', 'rottweiler': 'cachorro',
  'tabby': 'gato', 'persian cat': 'gato', 'siamese cat': 'gato', 'egyptian cat': 'gato', 'tiger cat': 'gato',
  'lion': 'vida selvagem', 'tiger': 'vida selvagem', 'cheetah': 'vida selvagem', 'leopard': 'vida selvagem',
  'jaguar': 'vida selvagem', 'cougar': 'vida selvagem', 'lynx': 'vida selvagem',
  'jay': 'pássaro', 'magpie': 'pássaro', 'chickadee': 'pássaro', 'robin': 'pássaro',
  'hummingbird': 'pássaro', 'flamingo': 'pássaro', 'pelican': 'pássaro', 'crane': 'pássaro',
  'peacock': 'pássaro', 'macaw': 'pássaro', 'lorikeet': 'pássaro', 'toucan': 'pássaro',
  'horse': 'cavalo', 'zebra': 'vida selvagem', 'elephant': 'elefante', 'bear': 'urso',
  'panda': 'panda', 'koala': 'coala', 'hippopotamus': 'hipopótamo', 'rhinoceros': 'rinoceronte',
  'butterfly': 'borboleta', 'bee': 'abelha', 'ladybug': 'joaninha', 'dragonfly': 'libélula',
  'goldfish': 'peixe', 'great white shark': 'tubarão', 'killer whale': 'orca', 'dugong': 'peixe-boi',
  'jellyfish': 'água-viva', 'starfish': 'estrela-do-mar', 'sea anemone': 'anêmona',

  // === VEÍCULOS ===
  'sports car': 'carro', 'convertible': 'carro', 'minivan': 'carro', 'cab': 'táxi',
  'jeep': 'jipe', 'limousine': 'carro', 'beach wagon': 'carro', 'pickup': 'caminhonete',
  'racer': 'carro de corrida', 'ambulance': 'ambulância', 'fire engine': 'bombeiros',
  'police van': 'polícia', 'school bus': 'ônibus escolar', 'trolleybus': 'ônibus',
  'motor scooter': 'moto', 'motorcycle': 'moto', 'moped': 'moto',
  'bicycle-built-for-two': 'bicicleta', 'mountain bike': 'bicicleta', 'unicycle': 'bicicleta',
  'airliner': 'avião', 'airship': 'dirigível', 'warplane': 'avião',
  'speedboat': 'barco', 'gondola': 'gôndola', 'canoe': 'canoa', 'catamaran': 'catamarã',
  'sailboat': 'veleiro', 'schooner': 'veleiro', 'submarine': 'submarino',
  'steam locomotive': 'trem', 'electric locomotive': 'trem', 'bullet train': 'trem',

  // === CENÁRIOS / PAISAGENS ===
  'seashore': 'praia', 'sandbar': 'praia', 'promontory': 'praia',
  'lakeside': 'lago', 'lakeshore': 'lago',
  'cliff': 'penhasco', 'valley': 'vale', 'geyser': 'gêiser',
  'volcano': 'vulcão', 'alp': 'montanha', 'mountain tent': 'acampamento',
  'coral reef': 'recife de coral',
  'daisy': 'jardim', 'rose': 'jardim', 'sunflower': 'campo', 'tulip': 'jardim',
  'rapeseed': 'campo', 'corn': 'campo',

  // === ARQUITETURA / LUGARES ===
  'church': 'igreja', 'castle': 'castelo', 'palace': 'palácio', 'monastery': 'mosteiro',
  'mosque': 'mesquita', 'stupa': 'templo', 'dome': 'arquitetura',
  'barn': 'fazenda', 'greenhouse': 'estufa', 'boathouse': 'marina',
  'bridge': 'ponte', 'suspension bridge': 'ponte', 'viaduct': 'viaduto',
  'tower': 'torre', 'beacon': 'farol', 'triumphal arch': 'monumento',
  'fountain': 'fonte', 'obelisk': 'obelisco', 'totem pole': 'totem',
  'cinema': 'cinema', 'theater curtain': 'teatro',
  'restaurant': 'restaurante', 'bakery': 'padaria', 'butcher shop': 'açougue',
  'barbershop': 'barbearia', 'bookshop': 'livraria', 'confectionery': 'confeitaria',
  'grocery store': 'mercado', 'tobacco shop': 'loja',
  'prison': 'prisão', 'library': 'biblioteca', 'patio': 'terraço',
  'pier': 'pier', 'dock': 'doca', 'dam': 'represa',
  'steel arch bridge': 'ponte', 'streetcar': 'bonde',

  // === AMBIENTES INTERNOS ===
  'dining table': 'sala de jantar', 'desk': 'escritório', 'bookcase': 'biblioteca',
  'file cabinet': 'escritório', 'wardrobe': 'quarto', 'chest': 'quarto',
  'cradle': 'quarto de bebê', 'crib': 'quarto de bebê',
  'bathtub': 'banheiro', 'shower curtain': 'banheiro', 'toilet seat': 'banheiro',
  'washbasin': 'banheiro', 'medicine chest': 'banheiro',
  'studio couch': 'sala', 'folding chair': 'sala', 'rocking chair': 'sala',
  'refrigerator': 'cozinha', 'stove': 'cozinha', 'washer': 'lavanderia',
  'dishwasher': 'cozinha', 'microwave': 'cozinha', 'toaster': 'cozinha',
  'espresso maker': 'cozinha', 'waffle iron': 'cozinha',
  'pool table': 'sala de jogos',

  // === COMIDA ===
  'pizza': 'comida', 'hamburger': 'comida', 'hot dog': 'comida', 'cheeseburger': 'comida',
  'ice cream': 'sobremesa', 'ice lolly': 'sorvete', 'chocolate sauce': 'sobremesa',
  'espresso': 'café', 'cup': 'bebida', 'coffee mug': 'café',
  'wine bottle': 'vinho', 'beer glass': 'cerveja', 'red wine': 'vinho',
  'eggnog': 'bebida', 'cocktail shaker': 'bar',
  'apple': 'fruta', 'banana': 'fruta', 'orange': 'fruta', 'lemon': 'fruta',
  'strawberry': 'fruta', 'pineapple': 'fruta', 'pomegranate': 'fruta', 'fig': 'fruta',
  'cucumber': 'vegetal', 'zucchini': 'vegetal', 'artichoke': 'vegetal',
  'bell pepper': 'vegetal', 'mushroom': 'cogumelo', 'broccoli': 'vegetal',
  'cauliflower': 'vegetal', 'head cabbage': 'vegetal', 'spaghetti squash': 'vegetal',
  'acorn squash': 'vegetal', 'butternut squash': 'vegetal',
  'meat loaf': 'comida', 'bagel': 'pão', 'pretzel': 'pão', 'French loaf': 'pão',
  'guacamole': 'comida', 'trifle': 'sobremesa', 'consomme': 'sopa',
  'burrito': 'comida', 'potpie': 'comida',

  // === ESPORTES / LAZER ===
  'tennis ball': 'tênis', 'basketball': 'basquete', 'soccer ball': 'futebol',
  'golf ball': 'golfe', 'rugby ball': 'rugby', 'volleyball': 'vôlei',
  'baseball': 'beisebol', 'ping-pong ball': 'ping-pong', 'puck': 'hóquei',
  'ski': 'esqui', 'snowboard': 'snowboard', 'surfboard': 'surfe', 'paddleboard': 'stand up',
  'racket': 'raquete', 'balance beam': 'ginástica', 'horizontal bar': 'ginástica',
  'barbell': 'academia', 'dumbbell': 'academia', 'punching bag': 'boxe',
  'swimming trunks': 'piscina', 'bikini': 'praia',
  'hammock': 'descanso', 'sleeping bag': 'camping', 'tent': 'camping',
  'backpack': 'mochila', 'umbrella': 'guarda-chuva',

  // === TECNOLOGIA ===
  'laptop': 'computador', 'desktop computer': 'computador', 'computer keyboard': 'computador',
  'mouse': 'computador', 'monitor': 'computador', 'notebook': 'computador',
  'cellular telephone': 'celular', 'dial telephone': 'telefone', 'pay-phone': 'telefone',
  'television': 'TV', 'screen': 'tela', 'projector': 'projetor',
  'iPod': 'música', 'CD player': 'música', 'tape player': 'música',
  'camera': 'fotografia', 'reflex camera': 'câmera', 'Polaroid camera': 'câmera',
  'tripod': 'fotografia', 'binoculars': 'binóculos',
  'printer': 'impressora', 'photocopier': 'copiadora', 'fax': 'fax',

  // === PESSOAS / ROUPAS (como indicador de presença humana) ===
  'suit': 'evento formal', 'gown': 'evento formal', 'kimono': 'cultura',
  'sombrero': 'festa', 'cowboy hat': 'country', 'mortarboard': 'formatura',
  'bow tie': 'evento formal', 'Windsor tie': 'evento formal',
  'jersey': 'esporte', 'sweatshirt': 'casual', 'cardigan': 'casual',
  'lab coat': 'laboratório', 'apron': 'cozinha',
  'brassiere': 'moda', 'sarong': 'praia', 'swimming cap': 'natação',
  'miniskirt': 'moda', 'hoopskirt': 'fantasia', 'poncho': 'casual',
  'jean': 'casual', 'trench coat': 'casual',
  'diaper': 'bebê', 'bib': 'bebê', 'pajama': 'casa',

  // === INSTRUMENTOS MUSICAIS ===
  'acoustic guitar': 'música', 'electric guitar': 'música', 'banjo': 'música',
  'cello': 'música', 'violin': 'música', 'harp': 'música', 'bassoon': 'música',
  'oboe': 'música', 'flute': 'música', 'sax': 'música', 'cornet': 'música',
  'trombone': 'música', 'French horn': 'música', 'harmonica': 'música',
  'accordion': 'música', 'organ': 'música', 'upright': 'música', 'grand piano': 'música',
  'drum': 'música', 'steel drum': 'música', 'maraca': 'música', 'marimba': 'música',
  'chime': 'música', 'gong': 'música',
  'stage': 'show', 'microphone': 'show', 'spotlight': 'show',

  // === NATUREZA / CLIMA (indicadores) ===
  'rainbow': 'arco-íris', 'cloud': 'nuvem',
  'snowplow': 'neve', 'snowmobile': 'neve',
  'solar dish': 'energia solar', 'wind farm': 'energia eólica', 'windmill': 'moinho',

  // === OBJETOS DIVERSOS ===
  'candle': 'vela', 'torch': 'tocha', 'lampshade': 'abajur',
  'Christmas stocking': 'natal', 'jack-o\'-lantern': 'halloween',
  'balloon': 'festa', 'confetti': 'festa', 'pinwheel': 'festa',
  'teddy': 'brinquedo', 'jigsaw puzzle': 'brinquedo', 'dollhouse': 'brinquedo',
  'piggy bank': 'cofrinho', 'slot': 'cassino', 'roulette wheel': 'cassino',
  'hourglass': 'relógio', 'sundial': 'relógio', 'analog clock': 'relógio', 'digital clock': 'relógio',
  'wall clock': 'relógio', 'stopwatch': 'relógio',
  'safe': 'cofre', 'combination lock': 'cadeado', 'padlock': 'cadeado',
  'envelope': 'carta', 'mailbox': 'correio', 'postage': 'selo',
  'packet': 'embalagem', 'carton': 'caixa', 'plastic bag': 'sacola',
  'shopping basket': 'compras', 'shopping cart': 'compras',
  'vase': 'vaso', 'pot': 'vaso', 'flowerpot': 'vaso',
  'bucket': 'balde', 'pail': 'balde', 'barrel': 'barril',
  'crate': 'caixa', 'hamper': 'cesta',
};

// Analisar imagem
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
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    console.log(`[AI Worker] Processando: ${filePath}`);

    const tempPath = path.join(os.tmpdir(), `zona21-ai-${Date.now()}.jpg`);

    try {
      await sharp(filePath)
        .resize(224, 224, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(tempPath);

      const image = await RawImage.fromURL(tempPath);

      // Classificar imagem (pegar top 15 para ter mais opções de mapeamento)
      const classification = await classifierPipeline(image, { topk: 15 });
      console.log(`[AI Worker] Classification:`, JSON.stringify(classification).substring(0, 400));

      // Converter classes ImageNet para tags em português
      const tagSet = new Set<string>();
      const processedTags: Array<{ label: string; score: number }> = [];

      for (const result of classification) {
        const label = result.label.toLowerCase();
        const score = result.score;

        if (score < 0.05) continue; // Threshold mais baixo para pegar mais contexto

        const mappedTag = IMAGENET_TO_TAG[label];
        if (mappedTag && !tagSet.has(mappedTag)) {
          tagSet.add(mappedTag);
          processedTags.push({ label: mappedTag, score });
        } else if (!mappedTag && score > 0.15) {
          // Usar label original se score alto e sem mapeamento
          const cleanLabel = label.split(',')[0].trim().replace(/_/g, ' ');
          if (!tagSet.has(cleanLabel) && cleanLabel.length < 25) {
            tagSet.add(cleanLabel);
            processedTags.push({ label: cleanLabel, score });
          }
        }
      }

      // Limitar a 6 tags
      const finalTags = processedTags.slice(0, 6);

      // Extrair features para embedding (Smart Culling e Similaridade)
      let embedding: number[] | null = null;
      if (featurePipeline) {
        try {
          const features = await featurePipeline(image);
          if (features?.data) {
            embedding = Array.from(features.data as Float32Array);
            console.log(`[AI Worker] Embedding size: ${embedding.length}`);
          }
        } catch (err) {
          console.warn('[AI Worker] Erro ao extrair features:', err);
        }
      }

      parentPort?.postMessage({
        type: 'result',
        id,
        task: 'analyze',
        data: {
          tags: finalTags,
          embedding: embedding
        }
      });

      console.log(`[AI Worker] Análise concluída: ${finalTags.map(t => t.label).join(', ')}`);
    } finally {
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
  }
});

// Sinalizar que worker iniciou
parentPort?.postMessage({ type: 'status', status: 'idle' });
