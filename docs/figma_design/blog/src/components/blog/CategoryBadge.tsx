import React from 'react';

export type CategoryType = 'market' | 'ops' | 'behind' | 'story';

interface CategoryBadgeProps {
  category: CategoryType;
  className?: string;
}

const categoryConfig = {
  market: { label: '시장', color: '#2D6CDF' },
  ops: { label: '운영', color: '#F59E0B' },
  behind: { label: '비하인드', color: '#10B981' },
  story: { label: '스토리', color: '#6B7280' }
};

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  
  return (
    <span
      className={`inline-block px-3 py-1 rounded-[16px] ${className}`}
      style={{ 
        backgroundColor: `${config.color}15`,
        color: config.color
      }}
    >
      {config.label}
    </span>
  );
}

export function getCategoryColor(category: CategoryType): string {
  return categoryConfig[category].color;
}

export function getCategoryLabel(category: CategoryType): string {
  return categoryConfig[category].label;
}
