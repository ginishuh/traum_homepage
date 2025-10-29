import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-12 md:mt-16">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-[50px] bg-white border border-[#E5E7EB] text-[#333333] hover:text-[#2D6CDF] hover:border-[#2D6CDF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[#333333] disabled:hover:border-[#E5E7EB]"
      >
        이전
      </button>
      
      <span className="text-[#666666]">
        <span className="text-[#333333]">{currentPage}</span> / {totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-[50px] bg-white border border-[#E5E7EB] text-[#333333] hover:text-[#2D6CDF] hover:border-[#2D6CDF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[#333333] disabled:hover:border-[#E5E7EB]"
      >
        다음
      </button>
    </div>
  );
}
