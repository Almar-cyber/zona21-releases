import { useState, useEffect } from 'react';
import MaterialIcon from './MaterialIcon';
import logoFull from '../assets/logotipo-white.png';
import { APP_VERSION } from '../version';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'export' | 'about'>('general');
  const [exportPath, setExportPath] = useState<string>('');
  const [telemetryEnabled, setTelemetryEnabled] = useState<boolean | null>(null);
  const [updateAutoCheck, setUpdateAutoCheck] = useState<boolean | null>(null);
  const [updateStatus, setUpdateStatus] = useState<any>({ state: 'idle' });

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

  const handleClearAppData = async () => {
    const ok = confirm('Isso vai apagar todos os dados do app (banco de dados, cache, logs) e reiniciar. Continuar?');
    if (!ok) return;
    try {
      await window.electronAPI.clearAppData();
    } catch (err) {
      console.error('Failed to clear app data:', err);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general' as const, label: 'Geral', icon: 'settings' },
    { id: 'export' as const, label: 'Exportação', icon: 'folder' },
    { id: 'about' as const, label: 'Sobre', icon: 'info' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="mh-popover w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MaterialIcon name="settings" className="text-gray-400" />
            <h2 className="text-base font-semibold text-white">Preferências</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
            aria-label="Fechar"
          >
            <MaterialIcon name="close" className="text-lg" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-40 border-r border-white/10 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <MaterialIcon name={tab.icon} className="text-base" />
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
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
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
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
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
                    <MaterialIcon name="open_in_new" className="text-base mr-1" />
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
                            alert('Nenhum log disponível para exportar.');
                          }
                        } catch (err) {
                          console.error('Failed to export logs:', err);
                        }
                      }}
                    >
                      <MaterialIcon name="download" className="text-base mr-1" />
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
                      <MaterialIcon name="folder_open" className="text-base mr-1" />
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
                      localStorage.removeItem('zona21-onboarding-0.2.0');
                      window.location.reload();
                    }}
                  >
                    <MaterialIcon name="school" className="text-base mr-1" />
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
                    <MaterialIcon name="delete_forever" className="text-base mr-1" />
                    Limpar todos os dados e reiniciar
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Remove banco de dados, cache e logs. O app será reiniciado.
                  </p>
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
                        <MaterialIcon name="close" className="text-base" />
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
                    Pressione <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-700 rounded">?</kbd> para ver todos os atalhos de teclado.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Créditos</h4>
                  <p className="text-sm text-gray-500">
                    © 2026 Zona21. Todos os direitos reservados.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
