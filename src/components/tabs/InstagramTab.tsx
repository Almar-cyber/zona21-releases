/**
 * InstagramTab - Tab fullscreen para agendamento de posts no Instagram
 *
 * Features:
 * - Autenticação OAuth
 * - Calendário de posts agendados
 * - Agendamento de novos posts
 * - Fila de posts
 * - Preview de posts
 * - Sugestões de hashtags
 */

import { useState, useEffect } from 'react';
import Icon from '../Icon';
import InstagramAuthButton from '../InstagramAuthButton';
import InstagramCalendar from '../InstagramCalendar';
import InstagramPreview from '../InstagramPreview';
import InstagramHashtagSuggestions from '../InstagramHashtagSuggestions';
import InstagramUpgradeModal from '../InstagramUpgradeModal';
import type { ScheduledPost, OAuthToken, InstagramUsageInfo, InstagramAspectRatio, Asset } from '../../shared/types';

// ============================================================================
// Types
// ============================================================================

export interface InstagramTabData {
  selectedAssetIds?: string[];
}

interface InstagramTabProps {
  data?: InstagramTabData;
  tabId: string;
}

// ============================================================================
// Component
// ============================================================================

export default function InstagramTab({ data, tabId }: InstagramTabProps) {
  const selectedAssetIds = data?.selectedAssetIds || [];

  const [activeTab, setActiveTab] = useState<'calendar' | 'schedule' | 'queue'>('calendar');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<OAuthToken | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [usageInfo, setUsageInfo] = useState<InstagramUsageInfo | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Schedule form state
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [aspectRatio, setAspectRatio] = useState<InstagramAspectRatio>('4:5');
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    loadData();

    // Listen for updates
    const cleanup = window.electronAPI.onInstagramPostsUpdated(() => {
      loadScheduledPosts();
    });

    return cleanup;
  }, []);

  useEffect(() => {
    // Load selected asset details
    if (selectedAssetIds.length > 0) {
      window.electronAPI.getAssetsByIds(selectedAssetIds).then((assets: Asset[]) => {
        if (assets.length > 0) {
          setSelectedAsset(assets[0]);
        }
      });
    }
  }, [selectedAssetIds]);

  const loadData = async () => {
    try {
      // Check auth
      const existingToken = await window.electronAPI.instagramGetToken('instagram');
      setToken(existingToken);
      setIsAuthenticated(!!existingToken);

      // Load scheduled posts
      await loadScheduledPosts();

      // Load usage info
      const usage = await window.electronAPI.instagramGetUsageInfo();
      if (usage.success) {
        setUsageInfo({
          isPro: usage.isPro,
          monthlyCount: usage.monthlyCount,
          monthlyLimit: usage.monthlyLimit,
          remaining: usage.remaining,
        });
      }
    } catch (error) {
      console.error('Failed to load Instagram data:', error);
    }
  };

  const loadScheduledPosts = async () => {
    try {
      const result = await window.electronAPI.instagramGetScheduledPosts();
      if (result.success) {
        setScheduledPosts(result.posts || []);
      }
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    }
  };

  const handleAuthSuccess = (newToken: OAuthToken) => {
    setToken(newToken);
    setIsAuthenticated(true);
    loadData();
  };

  const handleSchedule = async () => {
    if (!selectedAsset || !scheduledDate) return;

    // Check usage limit
    if (usageInfo && !usageInfo.isPro && usageInfo.remaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setIsScheduling(true);

    try {
      const datetime = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(':');
      datetime.setHours(parseInt(hours), parseInt(minutes));

      const result = await window.electronAPI.instagramSchedulePost({
        assetId: selectedAsset.id,
        caption: caption + (hashtags ? `\n\n${hashtags}` : ''),
        scheduledFor: datetime.toISOString(),
        aspectRatio,
      });

      if (result.success) {
        // Reset form
        setCaption('');
        setHashtags('');
        setScheduledDate(null);
        setScheduledTime('12:00');
        setAspectRatio('4:5');

        // Reload data
        await loadData();

        // Switch to calendar view
        setActiveTab('calendar');
      }
    } catch (error) {
      console.error('Failed to schedule post:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const result = await window.electronAPI.instagramDeleteScheduledPost(postId);
      if (result.success) {
        await loadScheduledPosts();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleEditPost = async (postId: string, updates: Partial<ScheduledPost>) => {
    try {
      const result = await window.electronAPI.instagramUpdateScheduledPost(postId, updates);
      if (result.success) {
        await loadScheduledPosts();
      }
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  if (!isAuthenticated) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-orange-900/20 p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Icon name="photo_camera" className="text-4xl text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white">
            Instagram Scheduler
          </h2>

          <p className="text-gray-300">
            Conecte sua conta do Instagram para agendar posts diretamente do Zona21.
          </p>

          <div className="pt-4">
            <InstagramAuthButton
              onAuthSuccess={handleAuthSuccess}
              provider="instagram"
            />
          </div>

          {usageInfo && !usageInfo.isPro && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-300">
                <div className="font-medium mb-1">Plano Gratuito</div>
                <div>
                  {usageInfo.remaining} de {usageInfo.monthlyLimit} posts disponíveis este mês
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium text-sm transition-all"
              >
                Upgrade para Pro
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#0d0d1a]">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Icon name="photo_camera" className="text-xl text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Instagram Scheduler</h2>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-purple-500 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name="calendar_month" className="inline mr-2" />
              Calendário
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'bg-purple-500 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name="schedule" className="inline mr-2" />
              Agendar
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'queue'
                  ? 'bg-purple-500 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name="list" className="inline mr-2" />
              Fila ({scheduledPosts.length})
            </button>
          </div>
        </div>

        {/* Usage info */}
        {usageInfo && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-white/70">
              {usageInfo.remaining} / {usageInfo.monthlyLimit} posts disponíveis
              {!usageInfo.isPro && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="ml-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'calendar' && (
          <InstagramCalendar
            posts={scheduledPosts}
            onSelectDate={(date) => {
              setScheduledDate(date);
              setActiveTab('schedule');
            }}
            onDeletePost={handleDeletePost}
            onEditPost={handleEditPost}
          />
        )}

        {activeTab === 'schedule' && (
          <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Preview */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-4">Preview</h3>
                  <InstagramPreview
                    asset={selectedAsset}
                    caption={caption}
                    hashtags={hashtags}
                    aspectRatio={aspectRatio}
                  />
                </div>

                {/* Right: Form */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-4">Detalhes do Post</h3>

                    {/* Caption */}
                    <div className="mb-4">
                      <label className="block text-sm text-white/70 mb-2">Legenda</label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Escreva sua legenda..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none h-32"
                        maxLength={2200}
                      />
                      <div className="text-xs text-white/50 mt-1 text-right">
                        {caption.length} / 2200
                      </div>
                    </div>

                    {/* Hashtags */}
                    <div className="mb-4">
                      <label className="block text-sm text-white/70 mb-2">Hashtags</label>
                      <textarea
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        placeholder="#fotografia #zona21"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none h-20"
                      />
                      <InstagramHashtagSuggestions
                        onSelectHashtag={(tag) => setHashtags(hashtags + (hashtags ? ' ' : '') + tag)}
                      />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Data</label>
                        <input
                          type="date"
                          value={scheduledDate?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setScheduledDate(new Date(e.target.value))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Horário</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="mb-6">
                      <label className="block text-sm text-white/70 mb-2">Proporção</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['1:1', '4:5', '9:16'] as InstagramAspectRatio[]).map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              aspectRatio === ratio
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Schedule button */}
                    <button
                      onClick={handleSchedule}
                      disabled={!selectedAsset || !scheduledDate || isScheduling}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-700 rounded-lg text-white font-medium transition-all disabled:cursor-not-allowed"
                    >
                      {isScheduling ? 'Agendando...' : 'Agendar Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-medium text-white mb-4">
                Posts Agendados ({scheduledPosts.length})
              </h3>

              {scheduledPosts.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <Icon name="event_busy" className="text-5xl mb-4" />
                  <p>Nenhum post agendado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledPosts
                    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                    .map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {post.thumbnailPath && (
                            <img
                              src={`file://${post.thumbnailPath}`}
                              alt="Post preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">
                            {post.caption.split('\n')[0] || 'Sem legenda'}
                          </div>
                          <div className="text-xs text-white/50 mt-1">
                            {new Date(post.scheduledFor).toLocaleString('pt-BR')}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          {post.status === 'pending' && (
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                              Pendente
                            </span>
                          )}
                          {post.status === 'posted' && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                              Postado
                            </span>
                          )}
                          {post.status === 'failed' && (
                            <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                              Falhou
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/70 hover:text-white transition-colors"
                          >
                            <Icon name="delete" className="text-lg" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <InstagramUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentUsage={usageInfo}
        />
      )}
    </div>
  );
}
