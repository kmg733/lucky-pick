import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick
}: CardProps) {
  const baseStyles = 'bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-slate-700/30 transition-all duration-300';
  const hoverStyles = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
