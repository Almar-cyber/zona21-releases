import { createPortal } from 'react-dom';
import Icon from './Icon';

interface InstagramUpgradeModalProps {
  isOpen: boolean;
  currentUsage: number;
  monthlyLimit: number;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function InstagramUpgradeModal({
  isOpen,
  currentUsage,
  monthlyLimit,
  onClose,
  onUpgrade,
}: InstagramUpgradeModalProps) {
  if (!isOpen) return null;

  const features = [
    {
      name: 'Posts Agendados',
      free: `${monthlyLimit}/mês`,
      pro: 'Ilimitados',
      icon: 'schedule',
    },
    {
      name: 'Calendário Visual',
      free: 'Básico',
      pro: 'Avançado com drag & drop',
      icon: 'calendar_month',
    },
    {
      name: 'Analytics',
      free: '—',
      pro: 'Detalhado (likes, reach)',
      icon: 'insights',
    },
    {
      name: 'Sugestões IA',
      free: '—',
      pro: 'Hashtags + melhores horários',
      icon: 'auto_awesome',
    },
    {
      name: 'Múltiplas Contas',
      free: '1 conta',
      pro: 'Até 5 contas',
      icon: 'person',
    },
    {
      name: 'Suporte',
      free: 'Comunidade',
      pro: 'Prioritário (24h)',
      icon: 'support_agent',
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mh-popover max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 mh-btn mh-btn-gray w-8 h-8 flex items-center justify-center z-10"
        >
          <Icon name="close" size={18} />
        </button>

        {/* Header with gradient */}
        <div className="relative p-8 text-center overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-20 animate-pulse" />

          {/* Content */}
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Icon name="star" size={40} className="text-white" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Upgrade para <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">Zona21 Pro</span>
            </h2>

            <p className="text-gray-400 mb-4">
              Você atingiu o limite de <strong className="text-white">{currentUsage}/{monthlyLimit}</strong> posts/mês do plano Free
            </p>

            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Icon name="local_fire_department" size={20} />
              <span className="text-sm font-medium">67% dos usuários Pro relatam 3x mais engajamento</span>
            </div>
          </div>
        </div>

        {/* Features comparison */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-[1fr,120px,180px] gap-4 mb-6">
            {/* Header */}
            <div className="text-sm font-medium text-gray-400">Recursos</div>
            <div className="text-sm font-medium text-gray-400 text-center">Free</div>
            <div className="text-sm font-medium text-pink-400 text-center">Pro ✨</div>

            {/* Features list */}
            {features.map((feature, index) => (
              <div key={index} className="contents">
                <div className="flex items-center gap-2 py-3 border-t border-white/5">
                  <Icon name={feature.icon} size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-300">{feature.name}</span>
                </div>
                <div className="flex items-center justify-center py-3 border-t border-white/5 text-sm text-gray-500">
                  {feature.free}
                </div>
                <div className="flex items-center justify-center py-3 border-t border-white/5 text-sm text-white font-medium">
                  {feature.pro}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Monthly */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-gray-400 mb-1">Mensal</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-white">$5</span>
                <span className="text-sm text-gray-400">/mês</span>
              </div>
              <div className="text-xs text-gray-500">Cobrança mensal</div>
            </div>

            {/* Yearly (recommended) */}
            <div className="relative p-4 rounded-lg bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 border-2 border-pink-500/50">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-pink-500 text-xs font-medium text-white">
                Economize $10
              </div>
              <div className="text-xs text-gray-400 mb-1">Anual</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-white">$50</span>
                <span className="text-sm text-gray-400">/ano</span>
              </div>
              <div className="text-xs text-pink-300">~$4.16/mês • Recomendado</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onUpgrade}
            className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            🚀 Fazer Upgrade Agora
          </button>

          {/* Money back guarantee */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
            <Icon name="verified" size={16} className="text-green-400" />
            <span>Garantia de 30 dias • Cancele quando quiser</span>
          </div>
        </div>

        {/* Social proof */}
        <div className="px-8 pb-6">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-gray-900"
                  />
                ))}
              </div>
              <div className="text-sm text-gray-400">
                <strong className="text-white">2.847 usuários</strong> já são Pro
              </div>
            </div>
            <div className="text-xs text-gray-500 italic">
              "Desde que virei Pro, meu engajamento no Instagram triplicou. O melhor investimento!" — @fotografia_digital
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Continuar com Free
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
