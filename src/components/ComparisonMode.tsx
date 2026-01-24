import { useEffect, useState } from 'react';
import { Asset } from '../shared/types';
import MaterialIcon from './MaterialIcon.tsx';

interface ComparisonModeProps {
  isOpen: boolean;
  left: Asset;
  right: Asset;
  onClose: () => void;
  onPickLeft: () => void;
  onPickRight: () => void;
  onRejectLeft: () => void;
  onRejectRight: () => void;
}

export default function ComparisonMode({
  isOpen,
  left,
  right,
  onClose,
  onPickLeft,
  onPickRight,
  onRejectLeft,
  onRejectRight
}: ComparisonModeProps) {
  const [leftOk, setLeftOk] = useState(true);
  const [rightOk, setRightOk] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLeftOk(true);
    setRightOk(true);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'a') onPickLeft();
      if (e.key.toLowerCase() === 'd') onPickRight();
      if (e.key.toLowerCase() === 'z') onRejectLeft();
      if (e.key.toLowerCase() === 'c') onRejectRight();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, onPickLeft, onPickRight, onRejectLeft, onRejectRight]);

  if (!isOpen) return null;

  const btnBase = 'mh-btn px-3 py-2 text-sm';
  const btnChoose = `${btnBase} mh-btn-gray flex-1`;
  const btnReject = `${btnBase} mh-btn-gray flex-1 text-red-300`;

  return (
    <div className="fixed inset-0 z-[60] text-white">
      <div className="absolute inset-0 bg-black/70" onPointerDown={onClose} />

      <div
        className="absolute inset-0 flex flex-col"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mh-topbar flex items-center justify-between px-3 sm:px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Comparar</div>
            <div className="text-[11px] text-gray-300 truncate">A: esquerda · D: direita · Z: rejeitar esquerda · C: rejeitar direita · ESC: fechar</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mh-btn mh-btn-gray h-9 w-9 flex items-center justify-center"
            aria-label="Fechar comparação"
            title="Fechar (Esc)"
          >
            <MaterialIcon name="close" className="text-[18px]" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-0">
        <div className="border-r border-gray-700 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-black/30">
            {leftOk ? (
              <img
                src={`zona21thumb://${left.id}`}
                alt={left.fileName}
                className="max-h-full max-w-full object-contain"
                onError={() => setLeftOk(false)}
              />
            ) : (
              <div className="text-gray-400">Sem prévia</div>
            )}
          </div>
          <div className="p-3 bg-black/30 border-t border-white/10">
            <div className="text-sm font-medium truncate">{left.fileName}</div>
            <div className="text-xs text-gray-400">{left.width} × {left.height}</div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={onPickLeft} className={btnChoose}>Escolher (A)</button>
              <button type="button" onClick={onRejectLeft} className={btnReject}>Rejeitar (Z)</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-black/30">
            {rightOk ? (
              <img
                src={`zona21thumb://${right.id}`}
                alt={right.fileName}
                className="max-h-full max-w-full object-contain"
                onError={() => setRightOk(false)}
              />
            ) : (
              <div className="text-gray-400">Sem prévia</div>
            )}
          </div>
          <div className="p-3 bg-black/30 border-t border-white/10">
            <div className="text-sm font-medium truncate">{right.fileName}</div>
            <div className="text-xs text-gray-400">{right.width} × {right.height}</div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={onPickRight} className={btnChoose}>Escolher (D)</button>
              <button type="button" onClick={onRejectRight} className={btnReject}>Rejeitar (C)</button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
