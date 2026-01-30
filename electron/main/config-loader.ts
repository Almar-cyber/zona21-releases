import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { logger } from './logger';

interface InstagramConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

interface AppConfig {
  instagram: InstagramConfig;
}

class ConfigLoader {
  private config: AppConfig | null = null;

  /**
   * Carrega a configuração do Instagram de múltiplas fontes (ordem de prioridade):
   * 1. Variáveis de ambiente (INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET)
   * 2. Arquivo instagram-config.json na raiz do projeto (dev/prod)
   * 3. Arquivo instagram-config.json no userData (produção)
   */
  loadConfig(): AppConfig | null {
    if (this.config) {
      return this.config;
    }

    // 1. Tentar variáveis de ambiente (prioridade máxima)
    if (process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET) {
      logger.info('config-loader', 'Loading Instagram config from environment variables');
      this.config = {
        instagram: {
          appId: process.env.INSTAGRAM_APP_ID,
          appSecret: process.env.INSTAGRAM_APP_SECRET,
          redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'zona21://oauth/callback',
        },
      };
      return this.config;
    }

    // 2. Tentar arquivo instagram-config.json na raiz do projeto (desenvolvimento)
    const projectRootConfig = path.join(process.cwd(), 'instagram-config.json');
    if (fs.existsSync(projectRootConfig)) {
      try {
        logger.info('config-loader', 'Loading Instagram config from project root', {
          path: projectRootConfig,
        });
        const fileContent = fs.readFileSync(projectRootConfig, 'utf-8');
        const jsonConfig = JSON.parse(fileContent);
        this.config = jsonConfig;
        return this.config;
      } catch (error) {
        logger.error('config-loader', 'Failed to parse instagram-config.json from project root', error);
      }
    }

    // 3. Tentar arquivo instagram-config.json no userData (produção)
    const userDataConfig = path.join(app.getPath('userData'), 'instagram-config.json');
    if (fs.existsSync(userDataConfig)) {
      try {
        logger.info('config-loader', 'Loading Instagram config from userData', {
          path: userDataConfig,
        });
        const fileContent = fs.readFileSync(userDataConfig, 'utf-8');
        const jsonConfig = JSON.parse(fileContent);
        this.config = jsonConfig;
        return this.config;
      } catch (error) {
        logger.error('config-loader', 'Failed to parse instagram-config.json from userData', error);
      }
    }

    // 4. Configuração padrão (placeholder) - app não funcionará até configurar
    logger.warn(
      'config-loader',
      'No Instagram config found! Please create instagram-config.json or set environment variables.'
    );
    logger.warn('config-loader', `Checked paths:`, {
      projectRoot: projectRootConfig,
      userData: userDataConfig,
      envVars: 'INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET',
    });

    this.config = {
      instagram: {
        appId: 'YOUR_INSTAGRAM_APP_ID',
        appSecret: 'YOUR_INSTAGRAM_APP_SECRET',
        redirectUri: 'zona21://oauth/callback',
      },
    };

    return this.config;
  }

  /**
   * Obtém credenciais do Instagram
   */
  getInstagramCredentials(): InstagramConfig | null {
    const config = this.loadConfig();
    return config?.instagram ?? null;
  }

  /**
   * Verifica se as credenciais do Instagram estão configuradas (não são placeholders)
   */
  isInstagramConfigured(): boolean {
    const config = this.loadConfig();
    if (!config || !config.instagram) return false;
    return (
      config.instagram.appId !== 'YOUR_INSTAGRAM_APP_ID' &&
      config.instagram.appSecret !== 'YOUR_INSTAGRAM_APP_SECRET' &&
      config.instagram.appId.length > 0 &&
      config.instagram.appSecret.length > 0
    );
  }

  /**
   * Cria arquivo de exemplo de configuração no userData (para facilitar ao usuário)
   */
  createExampleConfigFile(): string {
    const exampleConfigPath = path.join(app.getPath('userData'), 'instagram-config.example.json');
    const exampleConfig = {
      instagram: {
        appId: 'YOUR_INSTAGRAM_APP_ID',
        appSecret: 'YOUR_INSTAGRAM_APP_SECRET',
        redirectUri: 'zona21://oauth/callback',
      },
      _notes: {
        appId: 'Obtenha em: https://developers.facebook.com/ > Seu App > Instagram API (Platform API)',
        appSecret: "Clique em 'Show' ao lado do App Secret para ver",
        howToUse:
          "1. Renomeie este arquivo para 'instagram-config.json', 2. Substitua YOUR_INSTAGRAM_APP_ID e YOUR_INSTAGRAM_APP_SECRET pelas suas credenciais reais",
        requirement: 'IMPORTANTE: Sua conta Instagram deve ser Business ou Creator. Contas pessoais não funcionam.',
      },
    };

    try {
      fs.writeFileSync(exampleConfigPath, JSON.stringify(exampleConfig, null, 2), 'utf-8');
      logger.info('config-loader', 'Created example config file', { path: exampleConfigPath });
      return exampleConfigPath;
    } catch (error) {
      logger.error('config-loader', 'Failed to create example config file', error);
      throw error;
    }
  }

  /**
   * Retorna o caminho onde o usuário deve colocar o arquivo de config
   */
  getConfigPath(): string {
    return path.join(app.getPath('userData'), 'instagram-config.json');
  }

  /**
   * Reseta o cache de configuração (útil para testes ou reload)
   */
  reset(): void {
    this.config = null;
  }
}

// Singleton
export const configLoader = new ConfigLoader();
