
import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import { fileURLToPath } from 'url';

// Skip local model checks for this POC to allow downloading from Hub
env.allowLocalModels = false;
env.useBrowserCache = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('🔄 Loading CLIP model (Xenova/clip-vit-base-patch32)...');
  
  // Create the image classification pipeline
  // This will download the quantized model (~300MB) on first run
  const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  
  console.log('✅ Model loaded successfully!');

  // Test with a sample image (using a public URL for the POC to ensure it works without file system issues)
  // In the real app, we will use local file paths
  const imageUrl = 'https://raw.githubusercontent.com/Almar-cyber/zona21/main/resources/icon.png';
  
  const candidateLabels = ['logo', 'animal', 'person', 'scenery'];
  
  console.log(`🖼️  Processing image: ${imageUrl}`);
  console.log(`🏷️  Candidate labels: ${candidateLabels.join(', ')}`);
  
  const output = await classifier(imageUrl, candidateLabels);
  
  console.log('\n📊 Results:');
  console.log(JSON.stringify(output, null, 2));
}

run().catch(console.error);
