import MaterialIcon from './MaterialIcon';

interface CullingProgressProps {
  totalCount: number;
  decidedCount: number;
  flaggedCount: number;
}

export default function CullingProgress({
  totalCount,
  decidedCount,
  flaggedCount
}: CullingProgressProps) {
  if (totalCount === 0) return null;

  const progressPercent = totalCount > 0 ? (decidedCount / totalCount) * 100 : 0;
  const undecidedCount = totalCount - decidedCount;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-xl">
      <div className="flex items-center gap-2">
        <MaterialIcon name="check_circle" className="text-green-500 text-lg" />
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Decididos</span>
          <span className="text-sm font-semibold text-white tabular-nums">
            {decidedCount} / {totalCount}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-xs">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {undecidedCount > 0 && (
        <div className="flex items-center gap-2">
          <MaterialIcon name="pending" className="text-yellow-500 text-lg" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Restantes</span>
            <span className="text-sm font-semibold text-yellow-400 tabular-nums">
              {undecidedCount}
            </span>
          </div>
        </div>
      )}

      {flaggedCount > 0 && (
        <div className="flex items-center gap-2">
          <MaterialIcon name="flag" className="text-green-500 text-lg" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Marcados</span>
            <span className="text-sm font-semibold text-green-400 tabular-nums">
              {flaggedCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
