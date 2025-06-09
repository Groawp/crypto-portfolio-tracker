// Replace your src/components/CryptoLogo.js with this version

import React, { useState } from 'react';

const CryptoLogo = ({ symbol, size = 32, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  // Fallback icons and colors for when images don't exist
  const fallbackData = {
    'BTC': { icon: '₿', color: '#f7931a' },
    'ETH': { icon: '⧫', color: '#627eea' },
    'BCH': { icon: '₿', color: '#0ac18e' },
    'LINK': { icon: '⧉', color: '#375bd2' },
    'USDT': { icon: '₮', color: '#26a17b' },
    'XRP': { icon: '✕', color: '#000000' },
    'BNB': { icon: '◉', color: '#f3ba2f' },
    'SOL': { icon: '◐', color: '#9945ff' },
    'USDC': { icon: '$', color: '#2775ca' },
    'DOGE': { icon: 'Ð', color: '#c2a633' },
    'ADA': { icon: '₳', color: '#0033ad' },
    'DOT': { icon: '●', color: '#e6007a' },
    'MATIC': { icon: '◈', color: '#8247e5' },
    'AVAX': { icon: '▲', color: '#e84142' },
    'LTC': { icon: 'Ł', color: '#bfbbbb' },
    'UNI': { icon: '🦄', color: '#ff007a' },
    'ATOM': { icon: '⚛', color: '#2e3148' },
    'XLM': { icon: '✦', color: '#7d00ff' },
    'ALGO': { icon: '△', color: '#000000' },
    'VET': { icon: '⚡', color: '#15bdff' },
    'FIL': { icon: '📁', color: '#0090ff' },
    'TRX': { icon: '◈', color: '#ff060a' },
    'ETC': { icon: '⧫', color: '#328332' },
    'XMR': { icon: 'ⓜ', color: '#ff6600' },
    'HBAR': { icon: 'ℏ', color: '#000000' },
    'ICP': { icon: '∞', color: '#29abe2' },
    'NEAR': { icon: 'Ⓝ', color: '#000000' },
    'FTM': { icon: '👻', color: '#1969ff' },
    'CRO': { icon: '⋄', color: '#002d74' },
    'SAND': { icon: '🏜', color: '#00d4ff' },
    'MANA': { icon: '🌐', color: '#ff2d55' },
    'AAVE': { icon: '👻', color: '#b6509e' },
    'COMP': { icon: '◎', color: '#00d395' },
    'MKR': { icon: 'Ⓜ', color: '#1aab9b' },
    'SHIB': { icon: '🐕', color: '#ffa409' }
  };

  const fallback = fallbackData[symbol] || { 
    icon: symbol?.charAt(0) || '?', 
    color: '#6b7280' 
  };

  // Local image path
  const logoPath = `/crypto-logos/${symbol.toLowerCase()}.png`;

  const handleImageError = () => {
    setImageError(true);
  };

  // If image failed to load or doesn't exist, show fallback
  if (imageError) {
    return (
      <div 
        className={`rounded-full flex items-center justify-center text-white font-bold ${className}`}
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: fallback.color,
          fontSize: size * 0.4,
          flexShrink: 0
        }}
      >
        {fallback.icon}
      </div>
    );
  }

  return (
    <img
      src={logoPath}
      alt={`${symbol} logo`}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={handleImageError}
      loading="lazy"
      style={{ 
        minWidth: size, 
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        objectFit: 'contain',
        flexShrink: 0
      }}
    />
  );
};

export default CryptoLogo;