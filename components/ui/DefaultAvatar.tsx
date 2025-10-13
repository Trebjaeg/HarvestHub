import { User } from 'lucide-react';
import Image from 'next/image';

interface DefaultAvatarProps {
  name: string;
  profileImage?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DefaultAvatar({ name, profileImage, size = 'md', className = '' }: DefaultAvatarProps) {
  const getDefaultAvatar = (userName: string) => {
    // Generate initials from name
    const initials = userName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    // Generate a color based on the name (like Facebook)
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    
    const colorIndex = userName.length % colors.length;
    const bgColor = colors[colorIndex];
    
    return { initials, bgColor };
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-20 h-20 text-xl',
    lg: 'w-24 h-24 text-2xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const { initials, bgColor } = getDefaultAvatar(name);

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 ${className}`}>
      {profileImage ? (
        <Image
          src={profileImage}
          alt={name}
          width={size === 'lg' ? 96 : size === 'md' ? 80 : 32}
          height={size === 'lg' ? 96 : size === 'md' ? 80 : 32}
          className="w-full h-full object-cover"
        />
      ) : name ? (
        <div className={`w-full h-full flex items-center justify-center text-white font-bold ${bgColor}`}>
          {initials}
        </div>
      ) : (
        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
          <User className={`${iconSizes[size]} text-gray-500`} />
        </div>
      )}
    </div>
  );
}