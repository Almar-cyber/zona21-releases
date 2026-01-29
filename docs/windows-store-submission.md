# Windows Store Submission Guide

## Pré-requisitos
- Windows Developer Account ativo
- MSIX build configurado
- Certificado de publisher (opcional para testes)

## Passos de Submissão

### 1) Gerar MSIX para Store
```bash
# Build local para testes
npm run electron:build:win:msix-store

# Ou via CI (baixar artifact "zona21-windows-store")
```

### 2) Testar localmente
```bash
# Instalar MSIX localmente
Add-AppxPackage -Path .\Zona21-0.4.8.msix
```

### 3) Preparar para Store
1. Acessar [Partner Center](https://partner.microsoft.com/dashboard)
2. Ir para "Apps & games" → "New app"
3. Preencher informações básicas
4. Fazer upload do MSIX

### 4) Configurações na Store

#### App Identity
- **Name**: Zona21
- **Category**: Photo & Video
- **Subcategory**: Photo & video editing

#### Pricing and availability
- **Price**: Free (ou escolher)
- **Availability**: All markets
- **Visibility**: Public Store

#### Properties
- **Age rating**: PEGI 3 (ou conforme conteúdo)
- **Language**: Portuguese (Brazil) + English
- **Description**: Usar do appxmanifest

#### Store listing
- **Title**: Zona21
- **Description**: Plataforma profissional de ingestão, catalogação e seleção de mídia para foto e vídeo
- **Features**: 
  - Smart Culling com IA
  - Organização inteligente
  - Suporte RAW
  - Performance otimizada
- **Screenshots**: 5-8 imagens
- **Trailer**: Opcional

### 5) Certificação
A Microsoft vai testar:
- ✅ Instalação/desinstalação
- ✅ Funcionalidades básicas
- ✅ Compliance com políticas
- ✅ Performance

### 6) Publicação
- **Release**: Manual ou automático
- **Rollout**: 10% → 50% → 100% (recomendado)

## Requisitos Técnicos

### Capabilities no Manifest
```xml
<Capabilities>
  <rescap:Capability Name="runFullTrust" />
  <Capability Name="internetClient" />
  <Capability Name="privateNetworkClientServer" />
  <Capability Name="picturesLibrary" />
  <Capability Name="videosLibrary" />
  <Capability Name="removableStorage" />
</Capabilities>
```

### Requisitos de Performance
- **Startup time**: < 3 segundos
- **Memory usage**: < 1GB
- **Disk space**: < 500MB

## Troubleshooting

### Common Issues
1. **"App doesn't launch"**: Verificar dependencies no manifest
2. **"Crash on startup"**: Testar em múltiplas máquinas Windows
3. **"Store certification failed"**: Revisar capabilities e permissions

### Debug Tools
- **Event Viewer**: Windows Logs → Application
- **Microsoft Store**: Feedback Hub
- **Local testing**: `Add-AppxPackage -ForceUpdateFromAnyVersion`

## Processo de Update

### Automatic Updates
- Store gerencia automaticamente
- Usuários recebem notificação
- Update transparente

### Manual Updates
- Submeter nova versão
- Aprovação da Microsoft
- Rollout controlado

## Analytics

### Métricas disponíveis
- Downloads por dia/país
- Instalações ativas
- Crash reports
- User feedback
- Rating/reviews

### Acesso
- Partner Center → Analytics
- Dashboard personalizado
- Export de dados

## Timeline Estimada

| Fase | Tempo |
|------|-------|
| Build MSIX | 1-2 dias |
| Testes locais | 2-3 dias |
| Submissão | 1 dia |
| Certificação | 3-7 dias |
| Publicação | 1 dia |

**Total**: 7-14 dias

## Contatos Suporte

- **Microsoft Developer Support**: Partner Center → Support
- **Windows Store Team**: docs.microsoft.com/windows/apps
- **Community**: Microsoft Q&A

## Next Steps

1. [ ] Testar build MSIX localmente
2. [ ] Preparar screenshots e descrição
3. [ ] Submeter para certificação
4. [ ] Configurar rollout strategy
5. [ ] Monitorar analytics pós-lançamento
