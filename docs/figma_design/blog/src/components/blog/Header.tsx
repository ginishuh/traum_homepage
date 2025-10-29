import React, { useState, useEffect } from 'react';

interface HeaderProps {
  currentPage?: 'home' | 'list' | 'post';
  onNavigate?: (page: 'home' | 'list' | 'post') => void;
}

export function Header({ currentPage = 'home', onNavigate }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close mobile menu when clicking outside or navigating
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);
  
  const handleNavClick = (page: 'home' | 'list' | 'post') => {
    onNavigate?.(page);
    setIsMobileMenuOpen(false);
  };
  
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.10)]' 
          : 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.10)]'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Lockup */}
          <button 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 md:gap-3 group"
          >
            {/* Logo SVG */}
            <svg className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#1A4F34"/>
              <path d="M12 12h16v4h-6v12h-4V16h-6v-4z" fill="white"/>
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-[#1A4F34] leading-none">
                트라움자원 필드노트
              </span>
              <span className="text-[#666666] leading-none mt-0.5 hidden sm:block">
                현장, 시장, 운영의 기록
              </span>
            </div>
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 md:gap-8">
            <NavLink 
              label="홈" 
              active={currentPage === 'home'}
              onClick={() => handleNavClick('home')}
            />
            <NavLink 
              label="글 목록" 
              active={currentPage === 'list'}
              onClick={() => handleNavClick('list')}
            />
            <NavLink 
              label="소개" 
              active={false}
              onClick={() => {}}
            />
          </nav>
          
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-[#333333] hover:text-[#1A4F34] transition-colors"
            aria-label="메뉴"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu - Right Drawer */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <nav className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300">
            <div className="px-5 py-6 space-y-2">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[#1A4F34]">메뉴</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-[#666666] hover:text-[#1A4F34]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <MobileNavLink 
                label="홈" 
                active={currentPage === 'home'}
                onClick={() => handleNavClick('home')}
              />
              <MobileNavLink 
                label="글 목록" 
                active={currentPage === 'list'}
                onClick={() => handleNavClick('list')}
              />
              <MobileNavLink 
                label="소개" 
                active={false}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </nav>
        </>
      )}
    </header>
  );
}

interface NavLinkProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavLink({ label, active, onClick }: NavLinkProps) {
  return (
    <button
      onClick={onClick}
      className="relative text-[#333333] hover:text-[#1A4F34] transition-colors duration-300 group"
    >
      {label}
      <span 
        className={`absolute left-0 -bottom-1 h-0.5 bg-[#1A4F34] transition-all duration-300 ${
          active ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
        style={{ transform: 'translateY(5px)' }}
      />
    </button>
  );
}

function MobileNavLink({ label, active, onClick }: NavLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left py-3 px-4 rounded-lg transition-colors duration-300 ${
        active 
          ? 'bg-[#E8FBE5] text-[#1A4F34]' 
          : 'text-[#333333] hover:bg-[#F8F9FA]'
      }`}
    >
      {label}
    </button>
  );
}
