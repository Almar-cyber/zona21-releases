import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import InstagramAuthButton from './InstagramAuthButton';
import InstagramCalendar from './InstagramCalendar';
import InstagramPreview from './InstagramPreview';
import InstagramHashtagSuggestions from './InstagramHashtagSuggestions';
import InstagramUpgradeModal from './InstagramUpgradeModal';
import type { ScheduledPost, OAuthToken, InstagramUsageInfo, InstagramAspectRatio, Asset } from '../shared/types';

interface InstagramSchedulerModalProps {
  isOpen: boolean;
  selectedAssetIds?: string[];
  onClose: () => void;
}

export default function InstagramSchedulerModal({
  isOpen,
  selectedAssetIds = [],
  onClose,
}: InstagramSchedulerModalProps) {
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
    if (!isOpen) return;

    loadData();

    // Listen for updates
    const cleanup = window.electronAPI.onInstagramPostsUpdated(() => {
      loadScheduledPosts();
    });

    return cleanup;
  }, [isOpen]);

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

  const handleSelectDate = (date: Date) => {
    setScheduledDate(date);
    setActiveTab('schedule');
  };

  const handleMovePost = async (postId: string, newDate: Date) => {
    try {
      await window.electronAPI.instagramEditPost(postId, {
        scheduledAt: newDate.getTime(),
      });
      await loadScheduledPosts();
    } catch (error) {
      console.error('Failed to move post:', error);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedAssetIds.length || !caption.trim() || !scheduledDate) {
      return;
    }

    setIsScheduling(true);

    try {
      // Parse scheduled time
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Schedule post
      const result = await window.electronAPI.instagramSchedulePost({
        assetId: selectedAssetIds[0],
        scheduledAt: scheduledDateTime.getTime(),
        caption: caption.trim(),
        hashtags: hashtags.trim() || undefined,
        aspectRatio,
      });

      if (result.success) {
        // Clear form
        setCaption('');
        setHashtags('');
        setScheduledDate(null);

        // Switch to queue tab
        setActiveTab('queue');

        // Reload data
        await loadData();
      } else if (result.limitReached) {
        // Show upgrade modal
        setShowUpgradeModal(true);
      } else {
        alert(result.error || 'Falha ao agendar post');
      }
    } catch (error) {
      console.error('Failed to schedule post:', error);
      alert('Erro ao agendar post');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelPost = async (postId: string) => {
    try {
      const result = await window.electronAPI.instagramCancelPost(postId);
      if (result.success) {
        await loadScheduledPosts();
      }
    } catch (error) {
      console.error('Failed to cancel post:', error);
    }
  };

  const handleAddHashtag = (hashtag: string) => {
    if (hashtags.includes(hashtag)) return;
    setHashtags((prev) => (prev ? `${prev} ${hashtag}` : hashtag));
  };

  const handleAddHashtags = (newHashtags: string[]) => {
    const existing = hashtags.split(/\s+/).filter((t) => t.startsWith('#'));
    const toAdd = newHashtags.filter((t) => !existing.includes(t));
    setHashtags((prev) => (prev ? `${prev} ${toAdd.join(' ')}` : toAdd.join(' ')));
  };

  const handleUpgrade = () => {
    // TODO: Open payment flow
    window.electronAPI.openExternal('https://zona21.app/pricing');
    setShowUpgradeModal(false);
  };

  if (!isOpen) return null;

  const pendingPosts = scheduledPosts.filter((p) => p.status === 'pending');
  const publishedPosts = scheduledPosts.filter((p) => p.status === 'published');

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="mh-popover w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Icon name="photo_library" size={24} className="text-pink-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Instagram Scheduler</h2>
                <p className="text-xs text-gray-400">Agende posts direto do Zona21</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && usageInfo && !usageInfo.isPro && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Icon name="info" size={16} className="text-yellow-400" />
                  <span className="text-xs text-yellow-400">
                    {usageInfo.remaining}/{usageInfo.monthlyLimit} posts restantes
                  </span>
                </div>
              )}

              <button onClick={onClose} className="mh-btn mh-btn-gray w-8 h-8 flex items-center justify-center">
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>

          {/* Auth Status */}
          {!isAuthenticated && (
            <div className="p-4 border-b border-white/10 bg-yellow-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <Icon name="warning" size={18} />
                  <span>Conecte sua conta Instagram para começar</span>
                </div>
                <InstagramAuthButton onAuthSuccess={handleAuthSuccess} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 p-4 border-b border-white/10">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="calendar_month" size={16} />
                Calendário
              </div>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="schedule" size={16} />
                Agendar
              </div>
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'queue'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="list" size={16} />
                Fila ({pendingPosts.length})
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <Icon name="lock" size={48} className="text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Conecte sua conta Instagram primeiro</p>
                <InstagramAuthButton onAuthSuccess={handleAuthSuccess} />
              </div>
            ) : activeTab === 'calendar' ? (
              <InstagramCalendar
                scheduledPosts={scheduledPosts}
                onSelectDate={handleSelectDate}
                onMovePost={handleMovePost}
              />
            ) : activeTab === 'schedule' ? (
              !selectedAssetIds.length ? (
                <div className="text-center py-12">
                  <Icon name="photo" size={48} className="text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Selecione uma foto para agendar</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {/* Left: Preview */}
                  <div>
                    {selectedAsset && (
                      <InstagramPreview
                        asset={selectedAsset}
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                      />
                    )}
                  </div>

                  {/* Right: Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Caption</label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Escreva sua legenda..."
                        className="mh-control w-full h-32 resize-none"
                        maxLength={2200}
                      />
                      <div className="text-xs text-gray-500 mt-1">{caption.length}/2200</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Hashtags</label>
                      <textarea
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        placeholder="#fotografia #natureza..."
                        className="mh-control w-full h-20 resize-none"
                      />
                    </div>

                    <InstagramHashtagSuggestions
                      asset={selectedAsset || undefined}
                      currentHashtags={hashtags}
                      onAddHashtag={handleAddHashtag}
                      onAddHashtags={handleAddHashtags}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                        <input
                          type="date"
                          value={scheduledDate ? scheduledDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => setScheduledDate(e.target.value ? new Date(e.target.value) : null)}
                          min={new Date().toISOString().split('T')[0]}
                          className="mh-control w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Hora</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="mh-control w-full"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSchedulePost}
                      disabled={isScheduling || !caption.trim() || !scheduledDate}
                      className="mh-btn mh-btn-indigo w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isScheduling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <Icon name="schedule" size={18} />
                          Agendar Post
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {/* Pending */}
                {pendingPosts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">
                      Agendados ({pendingPosts.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingPosts.map((post) => (
                        <div
                          key={post.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white line-clamp-2">{post.caption}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(post.scheduledAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCancelPost(post.id)}
                            className="mh-btn mh-btn-danger h-8 px-3 text-xs flex-shrink-0"
                          >
                            Cancelar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Published */}
                {publishedPosts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">
                      Publicados ({publishedPosts.length})
                    </h3>
                    <div className="space-y-2">
                      {publishedPosts.map((post) => (
                        <div
                          key={post.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white line-clamp-2">{post.caption}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Publicado em {new Date(post.scheduledAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Icon name="check_circle" size={20} className="text-green-400 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingPosts.length === 0 && publishedPosts.length === 0 && (
                  <div className="text-center py-12">
                    <Icon name="inbox" size={48} className="text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhum post agendado</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {usageInfo && (
        <InstagramUpgradeModal
          isOpen={showUpgradeModal}
          currentUsage={usageInfo.monthlyCount}
          monthlyLimit={usageInfo.monthlyLimit}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />
      )}
    </>,
    document.body
  );
}
