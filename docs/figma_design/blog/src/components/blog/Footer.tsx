import React from 'react';

export function Footer() {
  return (
    <footer className="bg-[#0F3322] text-white py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto px-5 md:px-6">
        {/* Logo */}
        <div className="mb-8 md:mb-12">
          <svg className="w-16 h-16 md:w-[84px] md:h-[84px] mb-4" viewBox="0 0 84 84" fill="none">
            <rect width="84" height="84" rx="16" fill="white" fillOpacity="0.1"/>
            <path d="M25 25h34v8h-13v26h-8V33h-13v-8z" fill="white"/>
          </svg>
          <div className="text-xl md:text-2xl">트라움자원 필드노트</div>
          <div className="text-white/70 mt-1">현장, 시장, 운영의 기록</div>
        </div>
        
        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="mb-4">블로그</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">최신 글</a></li>
              <li><a href="#" className="hover:text-white transition-colors">카테고리</a></li>
              <li><a href="#" className="hover:text-white transition-colors">태그</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="mb-4">회사</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">소개</a></li>
              <li><a href="#" className="hover:text-white transition-colors">사업 분야</a></li>
              <li><a href="#" className="hover:text-white transition-colors">채용</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="mb-4">연락처</h4>
            <ul className="space-y-2 text-white/70">
              <li>이메일: info@trr.co.kr</li>
              <li>전화: 02-1234-5678</li>
              <li>주소: 서울시 강남구</li>
            </ul>
          </div>
          
          <div>
            <h4 className="mb-4">소셜</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        
        {/* Legal */}
        <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-white/70">
          <div>© 2025 트라움자원. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
