import React from 'react';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, selected = false, disabled = false, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-[16px] transition-all duration-300
        ${selected 
          ? 'bg-[#1A4F34] text-white shadow-[0_2px_10px_rgba(26,79,52,0.3)]' 
          : 'bg-white text-[#333333] border border-[#E5E7EB] hover:border-[#1A4F34] hover:text-[#1A4F34]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {label}
    </button>
  );
}
