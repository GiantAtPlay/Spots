import { useState } from 'react'

interface CardImageProps {
  src?: string;
  alt: string;
  className?: string;
  size?: 'small' | 'normal' | 'large' | 'fluid';
}

export default function CardImage({ src, alt, className = '', size = 'normal' }: CardImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const sizeClasses = {
    small: 'w-[146px] h-[204px]',
    normal: 'w-[244px] h-[340px]',
    large: 'w-[340px] h-[475px]',
    fluid: 'w-full aspect-[488/680]',
  }

  if (!src || error) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center ${className}`}>
        <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-2">{alt}</span>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover rounded-xl transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  )
}
