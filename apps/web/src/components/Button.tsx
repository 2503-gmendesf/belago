import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'sec' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: '',
  sec: 'btn-sec',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const classes = ['btn', VARIANT_CLASS[variant], size === 'sm' ? 'btn-sm' : '', className]
    .filter(Boolean)
    .join(' ');
  return <button className={classes} {...props} />;
}
