import React from 'react'

interface LogoProps {
  className?: string
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg'
}

export const Logo = ({ 
  className = '', 
  variant = 'full', 
  size = 'md' 
}: LogoProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  // Icon-only logo
  const IconLogo = () => (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document shape */}
      <path 
        d="M6 4C6 2.89543 6.89543 2 8 2H20L26 8V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" 
        fill="currentColor" 
        opacity="0.2"
      />
      <path 
        d="M6 4C6 2.89543 6.89543 2 8 2H20L26 8V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      {/* AI Brain/Circuit pattern inside */}
      <circle cx="16" cy="14" r="2" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="20" cy="18" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="16" cy="22" r="1.5" fill="currentColor" opacity="0.7" />
      {/* Connecting lines */}
      <path 
        d="M14 14L12 16M18 14L20 16M16 16V20M14 20L16 20M18 20L16 20" 
        stroke="currentColor" 
        strokeWidth="1" 
        opacity="0.5"
      />
    </svg>
  )

  // Text-only logo
  const TextLogo = () => (
    <span className={`font-bold ${textSizes[size]} ${className}`}>
      <span className="text-blue-600">Smart</span>
      <span className="text-gray-700">-Business-</span>
      <span className="text-blue-600">Docs</span>
      <span className="text-gray-500">-AI</span>
    </span>
  )

  // Full logo (icon + text)
  const FullLogo = () => (
    <div className={`flex items-center space-x-2 ${className}`}>
      <IconLogo />
      <TextLogo />
    </div>
  )

  switch (variant) {
    case 'icon':
      return <IconLogo />
    case 'text':
      return <TextLogo />
    default:
      return <FullLogo />
  }
}

export default Logo