import Icon from './Icon';

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
    <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--color-overlay-light)] rounded-full text-xs">
      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-1" title={`${flaggedCount} marcados`}>
          <Icon name="flag" size={14} className="text-[var(--color-status-approved)]" />
          <span className="tabular-nums">{flaggedCount}</span>
        </div>
        <span className="text-[var(--color-text-muted)]">/</span>
        <div className="flex items-center gap-1 text-[var(--color-text-muted)]" title={`${totalCount} total`}>
          <span className="tabular-nums">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}
