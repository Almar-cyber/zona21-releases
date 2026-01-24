import type { CSSProperties } from 'react';

type MaterialIconProps = {
  name: string;
  className?: string;
  size?: number;
  title?: string;
};

export default function MaterialIcon({ name, className, size, title }: MaterialIconProps) {
  const style: CSSProperties | undefined = size ? { fontSize: size, lineHeight: 1 } : undefined;
  return (
    <span
      className={`material-symbols-outlined ${className || ''}`.trim()}
      style={style}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      {name}
    </span>
  );
}
