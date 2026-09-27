import React from 'react';
import { UserRound } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * User avatar with no stock/temporary person image fallback.
 * When a user has no profile photo, a neutral blank profile placeholder is shown.
 */
export const Avatar: React.FC<AvatarProps> = ({ src, name = 'User', className = '', iconClassName = '' }) => {
  if (src) {
    return <img src={src} alt={name} className={`object-cover ${className}`} />;
  }

  return (
    <div
      aria-label={`${name} profile photo not set`}
      className={`bg-stone-100 text-stone-400 flex items-center justify-center ${className}`}
    >
      <UserRound className={iconClassName || 'w-1/2 h-1/2'} strokeWidth={1.6} />
    </div>
  );
};
