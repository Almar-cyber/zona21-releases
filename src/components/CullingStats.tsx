import MaterialIcon from './MaterialIcon';

type CullingStatsProps = {
  totalCount: number;
  flaggedCount: number;
};

export default function CullingStats({
  totalCount,
  flaggedCount
}: CullingStatsProps) {
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full text-xs">
      <div className="flex items-center gap-2 text-gray-400">
        <div className="flex items-center gap-1" title={`${flaggedCount} marcados`}>
          <MaterialIcon name="flag" className="text-green-500 text-sm" />
          <span className="tabular-nums">{flaggedCount}</span>
        </div>
        <span className="text-gray-600">/</span>
        <div className="flex items-center gap-1 text-gray-500" title={`${totalCount} total`}>
          <span className="tabular-nums">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}
