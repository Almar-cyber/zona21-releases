/**
 * Test script for AI worker functionality
 * Run with: node scripts/test-ai-worker.mjs
 */
import { pipeline, env, RawImage } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Configure for Node.js
env.allowLocalModels = true;
env.useBrowserCache = false;
const cacheDir = path.join(os.homedir(), '.cache', 'zona21', 'models');
env.cacheDir = cacheDir;
env.localModelPath = cacheDir;

console.log('Cache dir:', cacheDir);

// Find a test image
const testDir = '/Users/alexiaolivei/Documents/RTM/100MSDCF';
const files = fs.readdirSync(testDir).filter(f => f.toLowerCase().endsWith('.jpg'));
const testImage = path.join(testDir, files[0]);

console.log('Test image:', testImage);

async function test() {
  try {
    console.log('\n1. Loading classification pipeline...');
    const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', {
      progress_callback: (p) => {
        if (p.status === 'progress') console.log(`  Download: ${p.file} - ${Math.round(p.progress)}%`);
      }
    });
    console.log('Classification pipeline loaded!');

    console.log('\n2. Loading feature extraction pipeline...');
    const featureExtractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32', {
      progress_callback: (p) => {
        if (p.status === 'progress') console.log(`  Download: ${p.file} - ${Math.round(p.progress)}%`);
      }
    });
    console.log('Feature extraction pipeline loaded!');

    console.log('\n3. Loading test image...');
    const imageBuffer = fs.readFileSync(testImage);
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    const image = await RawImage.fromURL(dataUrl);
    console.log('Image loaded! Size:', image.width, 'x', image.height);

    console.log('\n4. Running classification...');
    const labels = ['landscape', 'portrait', 'animal', 'city', 'nature', 'beach', 'mountain', 'party', 'wedding', 'food', 'night', 'sunset', 'water', 'forest', 'indoor', 'outdoor'];
    const startClass = Date.now();
    const classification = await classifier(image, labels);
    console.log('Classification done in', Date.now() - startClass, 'ms');
    console.log('Results:', JSON.stringify(classification, null, 2));

    console.log('\n5. Running feature extraction...');
    const startFeat = Date.now();
    const features = await featureExtractor(image);
    console.log('Feature extraction done in', Date.now() - startFeat, 'ms');
    console.log('Features type:', typeof features);
    console.log('Features data:', features.data ? `Array of ${features.data.length} floats` : 'null');

    // Convert to array
    if (features.data) {
      const embedding = Array.from(features.data);
      console.log('Embedding size:', embedding.length);
      console.log('First 5 values:', embedding.slice(0, 5));
    }

    console.log('\n✅ AI pipeline test PASSED!');
  } catch (error) {
    console.error('\n❌ AI pipeline test FAILED:', error);
  }
}

test();
