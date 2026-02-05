import { useEffect, useState } from 'react';
import { IndexProgress } from '../shared/types';

interface IndexingOverlayProps {
  progress: IndexProgress;
  isVisible: boolean;
}

export default function IndexingOverlay({ progress, isVisible }: IndexingOverlayProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [eta, setEta] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);

  useEffect(() => {
    if (!isVisible || progress.status === 'completed' || progress.status === 'idle') {
      setElapsedTime(0);
      setStartTime(0);
      setEta(null);
      setSpeed(null);
      return;
    }

    if (startTime === 0 && progress.indexed > 0) {
      setStartTime(Date.now());
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);

      // Calcular ETA e velocidade após indexar pelo menos 20 arquivos
      if (progress.indexed > 20 && startTime > 0) {
        const elapsed = (Date.now() - startTime) / 1000; // segundos
        const rate = progress.indexed / elapsed; // arquivos/segundo
        const remaining = progress.total - progress.indexed;
        const etaSeconds = Math.ceil(remaining / rate);

        setSpeed(Math.round(rate * 10) / 10); // 1 casa decimal
        setEta(etaSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, progress.status, progress.indexed, progress.total, startTime]);

  if (!isVisible || progress.status === 'idle' || progress.status === 'completed') {
    return null;
  }

  const percent = progress.total > 0 ? Math.round((progress.indexed / progress.total) * 100) : 0;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'scanning':
        return 'Escaneando arquivos...';
      case 'indexing':
        return `Indexando ${progress.indexed.toLocaleString()} de ${progress.total.toLocaleString()}`;
      case 'paused':
        return 'Pausado';
      case 'cancelled':
        return 'Cancelado';
      case 'error':
        return 'Erro na indexação';
      default:
        return 'Processando...';
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[400px]"
      role="status"
      aria-live="polite"
      aria-label={`Progresso de indexação: ${percent}%`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {progress.status === 'scanning' || progress.status === 'indexing' ? (
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          ) : progress.status === 'paused' ? (
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-red-500" />
          )}
          <span className="text-sm font-medium text-white">
            {progress.status === 'scanning' ? 'Escaneando' : 'Indexando'}
          </span>
        </div>
        <span className="text-xs text-zinc-400">
          {formatTime(elapsedTime)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-2 bg-zinc-700 rounded-full overflow-hidden mb-3"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso de indexação"
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
        {progress.status === 'indexing' && (
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400/50 to-cyan-300/50 animate-pulse"
            style={{ width: `${Math.min(percent + 5, 100)}%` }}
          />
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-300">{getStatusText()}</span>
        <span className="text-zinc-400 font-mono">{percent}%</span>
      </div>

      {/* Extra info */}
      {(speed || eta) && progress.status === 'indexing' && (
        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-zinc-700">
          {speed && (
            <span className="text-zinc-500">
              ⚡ {speed} arquivos/s
            </span>
          )}
          {eta && eta > 0 && (
            <span className="text-zinc-500">
              ⏱ ~{formatTime(eta)} restante
            </span>
          )}
        </div>
      )}

      {/* Current file (truncated) */}
      {progress.currentFile && progress.status === 'indexing' && (
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <p className="text-xs text-zinc-500 truncate" title={progress.currentFile}>
            📄 {progress.currentFile.split('/').pop()}
          </p>
        </div>
      )}

      {/* Mensagem: "Você já pode navegar" */}
      {progress.indexed > 50 && progress.indexed < progress.total && progress.status === 'indexing' && (
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2 text-xs text-blue-400">
            <span className="mt-0.5">💡</span>
            <span>
              Você já pode começar a navegar pelas fotos enquanto a indexação continua em background
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
