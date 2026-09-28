interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = '' }: IconProps) {
  return (
    <svg className={`ic ${className}`} aria-hidden="true">
      <use href={`/icons.svg#i-${name}`} />
    </svg>
  );
}
