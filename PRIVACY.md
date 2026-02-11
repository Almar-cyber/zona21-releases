# Politica de Privacidade — Zona21

**Ultima atualizacao**: Fevereiro 2026

## Resumo rapido

O Zona21 processa tudo no seu computador. Suas fotos e videos nunca saem do seu PC. A gente so recebe dados quando voce escolhe mandar feedback.

## O que fica no seu PC (nunca sai)

- Banco de dados do catalogo (SQLite)
- Thumbnails e cache
- Preferencias e configuracoes
- Progresso de onboarding
- Historico de sessoes

Tudo isso fica salvo localmente na pasta de dados do app. Nada e enviado pra nenhum servidor.

## O que e enviado (so quando voce escolhe)

### Feedback (opcional)

Quando voce envia feedback pelo app, a gente recebe:

- **Titulo e descricao** que voce escreveu
- **Screenshots e audio** (se voce anexou)
- **Email** (se voce preencheu — e opcional)
- **Info do sistema**: versao do app, sistema operacional, tema ativo

Isso vai pra uma planilha Google Sheets que a gente usa pra resolver bugs e priorizar melhorias. Nenhum dado e vendido ou compartilhado com terceiros.

**Importante**: Voce decide se quer mandar feedback ou nao. Sem feedback enviado = zero dados nossos.

### Verificacao de atualizacoes

O app checa o GitHub Releases (repositorio publico) pra ver se tem versao nova. So baixa metadata (numero da versao e notas de release). Voce pode desativar nas Preferencias.

### Google Fonts (site)

O site (zona21.app) usa fontes do Google (Inter). Isso e padrao da web e o Google pode ver seu IP quando carrega a fonte. O app desktop nao faz essa requisicao.

## O que a gente NAO faz

- Nao rastreia voce
- Nao vende dados
- Nao usa cookies de tracking
- Nao envia suas fotos ou videos pra lugar nenhum
- Nao tem analytics no app
- Nao coleta dados automaticamente (so no feedback manual)

## Seus direitos (LGPD)

De acordo com a Lei Geral de Protecao de Dados (Lei 13.709/2018), voce pode a qualquer momento:

- **Acessar seus dados**: Peca por email ou GitHub Issue que a gente mostra o que tem
- **Corrigir seus dados**: Se mandou algo errado no feedback, avisa que a gente corrige
- **Apagar seus dados**: A gente deleta da planilha de feedbacks
- **Exportar seu catalogo**: O banco de dados e um arquivo SQLite — e seu, leva pra onde quiser
- **Revogar**: Nao enviar mais feedback = zero dados enviados

## Armazenamento de dados

| Dado | Onde fica | Quem tem acesso |
|------|-----------|-----------------|
| Catalogo (fotos, tags, notas) | Seu PC (SQLite) | So voce |
| Thumbnails e cache | Seu PC | So voce |
| Preferencias | Seu PC (localStorage/JSON) | So voce |
| Feedback enviado | Google Sheets (Almar) | Equipe Zona21 |

## Seguranca

- Feedback e enviado via HTTPS (criptografado em transito)
- O app nao tem servidor proprio — so usa Google Sheets pra receber feedback
- Nenhuma senha ou credencial e armazenada
- O codigo fonte esta disponivel no GitHub pra verificacao

## Alteracoes nesta politica

Se a gente mudar algo relevante, a politica atualizada vai tar aqui neste arquivo e no site. A data de ultima atualizacao fica no topo.

## Contato

Duvidas sobre privacidade? Voce pode:

- Abrir uma issue no [GitHub](https://github.com/Almar-cyber/zona21/issues)
- Mandar email pra **privacidade@zona21.app**

---

Zona21 e feito com carinho pela Almar. Seus arquivos sao seus.
