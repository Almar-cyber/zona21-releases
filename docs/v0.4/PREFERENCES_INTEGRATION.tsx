/**
 * EXEMPLO: Integração de Configurações de Onboarding nas Preferências
 *
 * Este arquivo mostra como adicionar controles de onboarding no PreferencesModal
 */

import { useState, useEffect } from 'react';
import { onboardingService, OnboardingIntensity } from '../services/onboarding-service';

// ============================================================================
// EXEMPLO: Adicionar nova aba "Onboarding" no PreferencesModal
// ============================================================================

function OnboardingPreferences() {
  const [settings, setSettings] = useState(onboardingService.getState().settings);
  const [stats, setStats] = useState(onboardingService.getState().stats);

  useEffect(() => {
    const unsubscribe = onboardingService.subscribe((state) => {
      setSettings(state.settings);
      setStats(state.stats);
    });
    return unsubscribe;
  }, []);

  const handleIntensityChange = (intensity: OnboardingIntensity) => {
    onboardingService.setIntensity(intensity);
  };

  const handleToggle = (key: keyof typeof settings) => {
    onboardingService.updateSettings({
      [key]: !settings[key]
    });
  };

  const userLevel = onboardingService.getUserLevel();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Assistência de Onboarding</h3>
        <p className="text-sm text-gray-400">
          Personalize como você deseja aprender a usar o Zona21
        </p>
      </div>

      {/* User Level */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">Nível Atual</div>
            <div className="text-xs text-gray-400 mt-1">
              {stats.photosMarked} fotos marcadas • {stats.sessionCount} sessões
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#4F46E5]/20 text-[#818CF8] text-xs font-semibold">
            {userLevel === 'novice' && '🌱 Iniciante'}
            {userLevel === 'intermediate' && '📸 Intermediário'}
            {userLevel === 'expert' && '🏆 Expert'}
          </div>
        </div>
      </div>

      {/* Intensity Preset */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">
          Intensidade de Onboarding
        </label>
        <div className="grid grid-cols-2 gap-2">
          <IntensityButton
            label="Completo"
            description="Todas as dicas e tutoriais"
            active={settings.intensity === 'full'}
            onClick={() => handleIntensityChange('full')}
          />
          <IntensityButton
            label="Moderado"
            description="Dicas essenciais"
            active={settings.intensity === 'moderate'}
            onClick={() => handleIntensityChange('moderate')}
            recommended
          />
          <IntensityButton
            label="Mínimo"
            description="Apenas conquistas"
            active={settings.intensity === 'minimal'}
            onClick={() => handleIntensityChange('minimal')}
          />
          <IntensityButton
            label="Desligado"
            description="Sem assistência"
            active={settings.intensity === 'off'}
            onClick={() => handleIntensityChange('off')}
          />
        </div>
      </div>

      {/* Granular Controls */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white">
          Elementos de Onboarding
        </label>

        <Toggle
          label="Checklist de primeiros passos"
          description="Guia visual com 7 passos essenciais"
          checked={settings.showChecklist}
          onChange={() => handleToggle('showChecklist')}
        />

        <Toggle
          label="Tooltips contextuais"
          description="Dicas que aparecem quando relevante"
          checked={settings.showTooltips}
          onChange={() => handleToggle('showTooltips')}
        />

        <Toggle
          label="Celebrações de milestone"
          description="Comemorar conquistas (100, 500 fotos)"
          checked={settings.showMilestones}
          onChange={() => handleToggle('showMilestones')}
        />

        <Toggle
          label="Pro tips"
          description="Dicas avançadas de otimização"
          checked={settings.showProTips}
          onChange={() => handleToggle('showProTips')}
        />
      </div>

      {/* Advanced Settings */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <Toggle
          label="Detecção automática de expertise"
          description="Reduzir onboarding automaticamente conforme você progride"
          checked={settings.autoDetectExpertise}
          onChange={() => handleToggle('autoDetectExpertise')}
        />

        <Toggle
          label="Respeitar fluxo de trabalho"
          description="Nunca interromper durante marcação rápida"
          checked={settings.respectFlowState}
          onChange={() => handleToggle('respectFlowState')}
        />
      </div>

      {/* Reset Button */}
      <div className="pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            if (confirm('Isso vai resetar todo o progresso de onboarding. Tem certeza?')) {
              onboardingService.reset();
            }
          }}
          className="text-sm text-red-400 hover:text-red-300 transition"
        >
          Resetar Tutorial Completo
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function IntensityButton({
  label,
  description,
  active,
  recommended,
  onClick
}: {
  label: string;
  description: string;
  active: boolean;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative p-3 rounded-lg border-2 transition text-left
        ${
          active
            ? 'border-[#4F46E5] bg-[#4F46E5]/10'
            : 'border-white/10 bg-white/5 hover:border-white/20'
        }
      `}
    >
      {recommended && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#4F46E5] rounded text-[9px] font-semibold text-white">
          Recomendado
        </div>
      )}
      <div className="font-semibold text-sm text-white">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{description}</div>
    </button>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex-1">
        <div className="text-sm text-white font-medium">{label}</div>
        {description && (
          <div className="text-xs text-gray-400 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2
          focus:ring-[#4F46E5] focus:ring-offset-2 focus:ring-offset-[#060010]
          ${checked ? 'bg-[#4F46E5]' : 'bg-gray-700'}
        `}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

// ============================================================================
// INTEGRAÇÃO NO PreferencesModal.tsx
// ============================================================================

/*
// No arquivo src/components/PreferencesModal.tsx

import OnboardingPreferences from './OnboardingPreferences'; // ou inline

function PreferencesModal() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="modal">
      <div className="tabs">
        <Tab active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
          Geral
        </Tab>
        <Tab active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>
          IA
        </Tab>
        <Tab active={activeTab === 'export'} onClick={() => setActiveTab('export')}>
          Exportação
        </Tab>
        <Tab active={activeTab === 'onboarding'} onClick={() => setActiveTab('onboarding')}>
          Onboarding
        </Tab>
        <Tab active={activeTab === 'about'} onClick={() => setActiveTab('about')}>
          Sobre
        </Tab>
      </div>

      <div className="tab-content">
        {activeTab === 'general' && <GeneralPreferences />}
        {activeTab === 'ai' && <AIPreferences />}
        {activeTab === 'export' && <ExportPreferences />}
        {activeTab === 'onboarding' && <OnboardingPreferences />}
        {activeTab === 'about' && <AboutPreferences />}
      </div>
    </div>
  );
}
*/

export default OnboardingPreferences;
