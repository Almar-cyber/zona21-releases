#!/usr/bin/env node

import http from 'http';

const checkUrl = (url) => {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data.substring(0, 500) });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
};

console.log('🔍 Verificando Vite dev server na porta 5174...\n');

const htmlResult = await checkUrl('http://localhost:5174/');
console.log('📄 HTML principal:', htmlResult.error || `${htmlResult.status} - ${htmlResult.data.includes('root') ? '✅ div#root encontrado' : '❌ div#root não encontrado'}`);

const mainResult = await checkUrl('http://localhost:5174/src/main.tsx');
console.log('📦 main.tsx:', mainResult.error || `${mainResult.status} - ${mainResult.data.substring(0, 100)}...`);

const appResult = await checkUrl('http://localhost:5174/src/App.tsx');
console.log('📦 App.tsx:', appResult.error || `${appResult.status} - ${appResult.data.substring(0, 100)}...`);

console.log('\n✅ Se todos os arquivos carregaram, o problema está no console do navegador.');
console.log('⚠️  Abra a aba Console no DevTools e procure por erros em vermelho.');
