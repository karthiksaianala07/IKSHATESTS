import React from 'react';
import logoImg from '../assets/logo.png';

export function Logo({ className = "h-12 w-auto" }) {
  return (
    <img 
      src={logoImg} 
      alt="IKSHATESTS Pariksha Shikshak" 
      className={className} 
      style={{ objectFit: 'contain' }}
    />
  );
}
