import { useState, useEffect } from 'react';
import Icon from './Icon';
import type { OAuthToken } from '../shared/types';

interface InstagramAuthButtonProps {
  onAuthSuccess?: (token: OAuthToken) => void;
  onAuthError?: (error: string) => void;
}

export default function InstagramAuthButton({ onAuthSuccess, onAuthError }: InstagramAuthButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [token, setToken] = useState<OAuthToken | null>(null);

  // Check if already authenticated
  useEffect(() => {
    checkAuth();

    // Listen for OAuth success events
    const cleanup = window.electronAPI.onOAuthSuccess((data: any) => {
      if (data.provider === 'instagram' && data.token) {
        setToken(data.token);
        setIsConnecting(false);
        onAuthSuccess?.(data.token);
      }
    });

    return cleanup;
  }, []);

  const checkAuth = async () => {
    try {
      const existingToken = await window.electronAPI.instagramGetToken('instagram');
      if (existingToken) {
        setToken(existingToken);
      }
    } catch (error) {
      console.error('Failed to check Instagram auth:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await window.electronAPI.instagramStartOAuth();
      if (!result.success) {
        throw new Error(result.error || 'Failed to start OAuth');
      }
      // OAuth will complete via deep link callback
    } catch (error) {
      console.error('Failed to start Instagram OAuth:', error);
      setIsConnecting(false);
      onAuthError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleDisconnect = async () => {
    try {
      const result = await window.electronAPI.instagramRevokeToken('instagram');
      if (result.success) {
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to disconnect Instagram:', error);
    }
  };

  if (token) {
    return (
      <div className="flex items-center gap-3">
        {token.profilePictureUrl && (
          <img
            src={token.profilePictureUrl}
            alt={token.username || 'Profile'}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">@{token.username}</span>
          <span className="text-xs text-gray-400">Conectado</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="mh-btn mh-btn-gray h-8 px-3 text-xs"
          title="Desconectar"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="mh-btn h-10 px-4 flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-medium disabled:opacity-50"
      title="Conectar Instagram"
    >
      {isConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          <Icon name="photo_library" size={18} />
          Conectar Instagram
        </>
      )}
    </button>
  );
}
