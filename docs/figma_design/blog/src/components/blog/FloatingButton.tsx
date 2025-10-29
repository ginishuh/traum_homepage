import React, { useState, useEffect } from 'react';

export function FloatingButton() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 md:bottom-[30px] md:right-[30px]
        w-14 h-14 rounded-full
        bg-[#1A4F34] text-white
        shadow-[0_5px_20px_rgba(0,0,0,0.15)]
        hover:bg-[#0F3322] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]
        transition-all duration-300
        flex items-center justify-center
        z-40
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
      aria-label="맨 위로"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}
