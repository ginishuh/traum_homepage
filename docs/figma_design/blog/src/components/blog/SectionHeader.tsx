import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className = '' }: SectionHeaderProps) {
  return (
    <div className={`text-center mb-12 md:mb-16 ${className}`}>
      <h2 className="text-[#1A4F34] mb-3">
        {title}
      </h2>
      <div className="flex items-center justify-center mb-4">
        <div className="w-[60px] h-[3px] bg-[#4A9D6F] rounded-full" />
      </div>
      {subtitle && (
        <p className="text-[#666666] max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
