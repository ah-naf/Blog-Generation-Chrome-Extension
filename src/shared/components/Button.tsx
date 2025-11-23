import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass =
    variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
