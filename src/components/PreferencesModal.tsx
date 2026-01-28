import { useState, useEffect } from 'react';
import Icon from './Icon';
import ConfirmDialog from './ConfirmDialog';
import logoFull from '../assets/logotipo-white.png';
import { APP_VERSION } from '../version';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'export' | 'about'>('general');
  const [exportPath, setExportPath] = useState<string>('');
  const [telemetryEnabled, setTelemetryEnabled] = useState<boolean | null>(null);
  const [updateAutoCheck, setUpdateAutoCheck] = useState<boolean | null>(null);
  const [updateStatus, setUpdateStatus] = useState<any>({ state: 'idle' });
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [aiStatus, setAiStatus] = useState<{ total: number; processed: number; pending: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    (async () => {
      try {
        const consent = await window.electronAPI.getTelemetryConsent();
        setTelemetryEnabled(consent ?? false);
      } catch {
        setTelemetryEnabled(false);
      }

      try {
        const result = await (window.electronAPI as any).getDefaultExportPath?.();
        setExportPath(result?.path || '');
      } catch {
        setExportPath('');
      }

      try {
        const settings = await (window.electronAPI as any).getUpdateSettings?.();
        setUpdateAutoCheck(settings?.autoCheck ?? true);
        setUpdateStatus(settings?.status || { state: 'idle' });
      } catch {
        setUpdateAutoCheck(true);
      }

      // Listen for update status changes
      try {
        (window.electronAPI as any).onUpdateStatus?.((st: any) => {
          setUpdateStatus(st || { state: 'idle' });
        });
      } catch {
        // ignore
      }

      // Load AI settings
      try {
        const aiSettings = await (window.electronAPI as any).aiGetSettings?.();
        setAiEnabled(aiSettings?.enabled ?? true);
      } catch {
        setAiEnabled(true);
      }

      try {
        const status = await (window.electronAPI as any).aiGetStatus?.();
        setAiStatus(status);
      } catch {
        // ignore
      }
    })();
  }, [isOpen]);

  const handleTelemetryChange = async (enabled: boolean) => {
    setTelemetryEnabled(enabled);
    try {
      await window.electronAPI.setTelemetryConsent(enabled);
    } catch (err) {
      console.error('Failed to save telemetry preference:', err);
    }
  };

  const handleSelectExportPath = async () => {
    try {
      const result = await (window.electronAPI as any).selectDirectory?.();
      if (result?.path) {
        setExportPath(result.path);
        await (window.electronAPI as any).setDefaultExportPath?.(result.path);
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const handleClearExportPath = async () => {
    setExportPath('');
    try {
      await (window.electronAPI as any).setDefaultExportPath?.(null);
    } catch (err) {
      console.error('Failed to clear export path:', err);
    }
  };

  const handleUpdateAutoCheckChange = async (enabled: boolean) => {
    setUpdateAutoCheck(enabled);
    try {
      await (window.electronAPI as any).setUpdateAutoCheck?.(enabled);
    } catch (err) {
      console.error('Failed to save update auto-check preference:', err);
    }
  };

  const handleClearAppData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Limpar dados do app',
      message: 'Isso vai apagar todos os dados do app (banco de dados, cache, logs) e reiniciar. Esta ação não pode ser desfeita.',
      confirmLabel: 'Limpar e reiniciar',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await window.electronAPI.clearAppData();
        } catch (err) {
          console.error('Failed to clear app data:', err);
        }
      }
    });
  };

  const handleAiEnabledChange = async (enabled: boolean) => {
    const previousValue = aiEnabled ?? true;
    setAiEnabled(enabled);
    try {
      await (window.electronAPI as any).aiSetEnabled?.(enabled);
      window.dispatchEvent(
        new CustomEvent('ai-settings-changed', {
          detail: { enabled }
        })
      );
    } catch (err) {
      console.error('Failed to save AI preference:', err);
      setAiEnabled(previousValue);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as const, label: 'Geral', icon: 'settings' },
    { id: 'ai' as const, label: 'Zona I.A.', icon: 'auto_awesome' },
    { id: 'export' as const, label: 'Exportação', icon: 'folder' },
    { id: 'about' as const, label: 'Sobre', icon: 'info' },
  ];

  const aiFeatures = [
    {
      icon: 'label',
      title: 'Auto-tagging',
      description: 'Classificação automática usando Vision Transformer (objetos, cenas, animais)',
      accentBg: 'bg-purple-500/10',
      accentRing: 'ring-purple-500/30',
      iconColor: 'text-purple-300'
    },
    {
      icon: 'auto_awesome',
      title: 'Smart Culling',
      description: 'Detecta sequências em burst e sugere as melhores fotos',
      accentBg: 'bg-yellow-500/10',
      accentRing: 'ring-yellow-500/20',
      iconColor: 'text-yellow-200'
    },
    {
      icon: 'drive_file_rename_outline',
      title: 'Smart Rename',
      description: 'Renomeação inteligente baseada nas tags de IA detectadas',
      accentBg: 'bg-blue-500/10',
      accentRing: 'ring-blue-500/25',
      iconColor: 'text-blue-300'
    },
    {
      icon: 'location_on',
      title: 'Detecção de Localização',
      description: 'Identifica cidade e estado baseado em coordenadas GPS (EXIF)',
      accentBg: 'bg-green-500/10',
      accentRing: 'ring-green-500/25',
      iconColor: 'text-green-300'
    },
    {
      icon: 'schedule',
      title: 'Período do Dia',
      description: 'Detecta manhã, tarde, noite baseado no horário da foto (EXIF)',
      accentBg: 'bg-orange-500/10',
      accentRing: 'ring-orange-500/25',
      iconColor: 'text-orange-300'
    }
  ] as const;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mh-popover w-full max-w-2xl h-[520px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Icon name="settings" size={18} className="text-gray-400" />
            <h2 className="text-base font-semibold text-white">Preferências</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
            aria-label="Fechar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-40 border-r border-white/10 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-[#4F46E5] text-white shadow-[0_2px_8px_rgba(79,70,229,0.3)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Diagnósticos</h3>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telemetryEnabled ?? false}
                      onChange={(e) => handleTelemetryChange(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                    <div>
                      <div className="text-sm text-gray-200">Enviar diagnósticos anônimos</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Ajuda a melhorar o app enviando informações sobre erros e crashes (sem dados pessoais).
                      </div>
                    </div>
                  </label>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Atualizações</h3>
                  <label className="flex items-start gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={updateAutoCheck ?? true}
                      onChange={(e) => handleUpdateAutoCheckChange(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                    <div>
                      <div className="text-sm text-gray-200">Verificar atualizações automaticamente</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        O app verifica por novas versões ao iniciar.
                      </div>
                    </div>
                  </label>

                  <div className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 mb-3">
                    {(() => {
                      const st = updateStatus?.state;
                      if (st === 'checking') return 'Verificando atualizações...';
                      if (st === 'available') return `Atualização disponível${updateStatus?.version ? `: v${updateStatus.version}` : ''}`;
                      if (st === 'not-available') return 'Você já está na versão mais recente.';
                      if (st === 'download-progress') {
                        const p = typeof updateStatus?.percent === 'number' ? updateStatus.percent : null;
                        return `Baixando...${p === null ? '' : ` ${Math.round(p)}%`}`;
                      }
                      if (st === 'downloaded') return `Atualização baixada${updateStatus?.version ? `: v${updateStatus.version}` : ''}. Pronto para instalar.`;
                      if (st === 'error') return 'Não foi possível verificar atualizações.';
                      return 'Pronto para verificar.';
                    })()}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="mh-btn mh-btn-gray px-3 py-2 text-sm flex-1"
                      onClick={async () => {
                        try {
                          await (window.electronAPI as any).checkForUpdates?.();
                        } catch (err) {
                          console.error('Failed to check for updates:', err);
                        }
                      }}
                    >
                      Checar agora
                    </button>

                    {updateStatus?.state === 'available' && (
                      <button
                        type="button"
                        className="mh-btn mh-btn-indigo px-3 py-2 text-sm flex-1"
                        onClick={async () => {
                          try {
                            await (window.electronAPI as any).downloadUpdate?.();
                          } catch (err) {
                            console.error('Failed to download update:', err);
                          }
                        }}
                      >
                        Baixar
                      </button>
                    )}

                    {updateStatus?.state === 'downloaded' && (
                      <button
                        type="button"
                        className="mh-btn mh-btn-indigo px-3 py-2 text-sm flex-1"
                        onClick={async () => {
                          try {
                            await (window.electronAPI as any).installUpdate?.();
                          } catch (err) {
                            console.error('Failed to install update:', err);
                          }
                        }}
                      >
                        Instalar
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Página do Beta</h3>
                  <button
                    type="button"
                    className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                    onClick={async () => {
                      const url = 'https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/';
                      try {
                        await (window.electronAPI as any).openExternal?.(url);
                      } catch (err) {
                        console.error('Failed to open external link:', err);
                      }
                    }}
                  >
                    <Icon name="open_in_new" size={16} className="mr-1" />
                    Abrir página do beta
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Acesse a página do beta para baixar versões anteriores ou ver novidades.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Logs e Diagnóstico</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                      onClick={async () => {
                        try {
                          const result = await (window.electronAPI as any).exportLogs?.();
                          if (result?.success && result?.content) {
                            const blob = new Blob([result.content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `zona21-logs-${new Date().toISOString().slice(0, 10)}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } else {
                            window.dispatchEvent(
                              new CustomEvent('zona21-toast', {
                                detail: { type: 'info', message: 'Nenhum log disponível para exportar.' }
                              })
                            );
                          }
                        } catch (err) {
                          console.error('Failed to export logs:', err);
                        }
                      }}
                    >
                      <Icon name="download" size={16} className="mr-1" />
                      Exportar logs
                    </button>
                    <button
                      type="button"
                      className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                      onClick={async () => {
                        try {
                          const result = await (window.electronAPI as any).getLogPath?.();
                          if (result?.success && result?.path) {
                            await (window.electronAPI as any).revealPath?.(result.path);
                          }
                        } catch (err) {
                          console.error('Failed to open logs folder:', err);
                        }
                      }}
                    >
                      <Icon name="folder_open" size={16} className="mr-1" />
                      Abrir pasta de logs
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Exporte os logs para compartilhar com o suporte ou diagnóstico de problemas.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Tutorial</h3>
                  <button
                    type="button"
                    className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                    onClick={() => {
                      localStorage.removeItem(`zona21-onboarding-${APP_VERSION}`);
                      window.location.reload();
                    }}
                  >
                    <Icon name="school" size={16} className="mr-1" />
                    Ver tutorial novamente
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Reinicia o tutorial de introdução ao app.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Dados do App</h3>
                  <button
                    type="button"
                    onClick={handleClearAppData}
                    className="mh-btn mh-btn-gray px-3 py-2 text-sm text-red-400 hover:text-red-300"
                  >
                    <Icon name="delete_forever" size={16} className="mr-1" />
                    Limpar todos os dados e reiniciar
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Remove banco de dados, cache e logs. O app será reiniciado.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Processamento de IA</h3>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiEnabled ?? true}
                      onChange={(e) => handleAiEnabledChange(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                    <div>
                      <div className="text-sm text-gray-200">Ativar funcionalidades de IA</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Auto-tagging, Smart Culling, Smart Rename, detecção de localização e período do dia.
                        Processamento 100% local (seus arquivos nunca saem do computador).
                      </div>
                    </div>
                  </label>
                </div>

                {aiEnabled && aiStatus && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Status do Processamento</h3>
                    <div className="rounded border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Fotos processadas</span>
                        <span className="text-sm text-gray-200 font-medium">
                          {aiStatus.processed} / {aiStatus.total}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: aiStatus.total > 0 ? `${(aiStatus.processed / aiStatus.total) * 100}%` : '0%' }}
                        />
                      </div>
                      {aiStatus.pending > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {aiStatus.pending} fotos aguardando processamento
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Funcionalidades</h3>
                  <div className="space-y-3">
                    {aiFeatures.map((feature) => (
                      <div
                        key={feature.title}
                        className="flex items-start gap-3 px-3 py-2"
                      >
                        <div
                          className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${feature.accentBg}`}
                        >
                          <Icon name={feature.icon} size={18} className={feature.iconColor} />
                        </div>
                        <div className="flex-1 text-sm">
                          <div className="text-gray-200 font-medium">{feature.title}</div>
                          <div className="text-xs text-gray-500">{feature.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Sobre o processamento</h3>
                  <div className="text-xs text-gray-500 space-y-2">
                    <p>
                      <strong className="text-gray-400">Modelo:</strong> Vision Transformer (ViT-base-patch16-224) via Transformers.js
                    </p>
                    <p>
                      <strong className="text-gray-400">Privacidade:</strong> 100% local — seus arquivos nunca saem do computador
                    </p>
                    <p>
                      <strong className="text-gray-400">Cache:</strong> Na primeira vez, os modelos (~200MB) são baixados e ficam em cache
                    </p>
                    <p>
                      <strong className="text-gray-400">Performance:</strong> Processamento em background via Worker Thread, não afeta o uso normal
                    </p>
                    <p className="text-gray-600 text-[11px] mt-3">
                      O modelo ViT é treinado no ImageNet-1k e oferece classificação precisa de objetos e cenas. Embeddings são extraídos para Smart Culling e análise de qualidade.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Pasta padrão de exportação</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={exportPath}
                      readOnly
                      placeholder="Nenhuma pasta selecionada (usa Downloads)"
                      className="flex-1 px-3 py-2 text-sm mh-control bg-gray-800/50"
                    />
                    <button
                      type="button"
                      onClick={handleSelectExportPath}
                      className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                    >
                      Escolher
                    </button>
                    {exportPath && (
                      <button
                        type="button"
                        onClick={handleClearExportPath}
                        className="mh-btn mh-btn-gray h-9 w-9 flex items-center justify-center"
                        title="Limpar"
                      >
                        <Icon name="close" size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Quando não selecionada, os arquivos exportados vão para a pasta Downloads.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <img src={logoFull} alt="Zona21" className="h-10 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Versão {APP_VERSION}</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sobre</h4>
                  <p className="text-sm text-gray-300">
                    Zona21 é um app de curadoria de mídia para fotógrafos e cinegrafistas. 
                    Organize, selecione e exporte seus melhores trabalhos de forma rápida e eficiente.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Atalhos</h4>
                  <p className="text-sm text-gray-300">
                    Pressione <kbd className="px-1.5 py-0.5 text-xs bg-white/10 border border-white/10 rounded">?</kbd> para ver todos os atalhos de teclado.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Créditos</h4>
                  <p className="text-sm text-gray-500">
                    © 2026 Almar. Todos os direitos reservados.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog?.isOpen ?? false}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
