import React from 'react';
import { CategoryBadge, CategoryType, getCategoryColor } from './CategoryBadge';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface BaseCardProps {
  title: string;
  summary: string;
  date: string;
  category: CategoryType;
  tags?: string[];
  image?: string;
  onClick?: () => void;
}

interface StoryCardProps extends BaseCardProps {
  variant: 'story';
  quote?: string;
}

interface MarketCardProps extends BaseCardProps {
  variant: 'market';
  kpis?: Array<{ label: string; value: string }>;
}

interface OpsCardProps extends BaseCardProps {
  variant: 'ops';
  checklist?: string[];
  downloadable?: boolean;
}

interface BehindCardProps extends BaseCardProps {
  variant: 'behind';
  timeline?: string;
}

type CardProps = StoryCardProps | MarketCardProps | OpsCardProps | BehindCardProps;

export function BlogCard(props: CardProps) {
  const { title, summary, date, category, tags = [], image, onClick, variant } = props;
  
  const categoryColor = getCategoryColor(category);
  
  return (
    <div 
      className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.10)] hover:shadow-[0_5px_20px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Category Color Band */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: categoryColor }}
      />
      
      {/* Image */}
      {image && (
        <div className="relative h-48 overflow-hidden">
          <ImageWithFallback
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        {/* Variant-specific decorations */}
        {variant === 'story' && (props as StoryCardProps).quote && (
          <div className="flex items-start gap-2 mb-4 text-[#666666] italic">
            <span className="text-xl">"</span>
            <p className="line-clamp-2">{(props as StoryCardProps).quote}</p>
          </div>
        )}
        
        {variant === 'market' && (props as MarketCardProps).kpis && (
          <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#F8F9FA] rounded-lg">
            {(props as MarketCardProps).kpis!.map((kpi, index) => (
              <div key={index}>
                <div className="text-[#666666]">{kpi.label}</div>
                <div className="text-[#333333]">{kpi.value}</div>
              </div>
            ))}
          </div>
        )}
        
        {variant === 'ops' && (props as OpsCardProps).checklist && (
          <div className="mb-4 space-y-2">
            {(props as OpsCardProps).checklist!.slice(0, 2).map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <div 
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: categoryColor }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[#666666]">{item}</span>
              </div>
            ))}
          </div>
        )}
        
        {variant === 'behind' && (props as BehindCardProps).timeline && (
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <div 
              className="flex-1 h-0.5"
              style={{ backgroundColor: `${categoryColor}40` }}
            />
            <span className="text-[#666666]">{(props as BehindCardProps).timeline}</span>
          </div>
        )}
        
        {/* Title and Summary */}
        <h3 className="mb-2 text-[#333333] group-hover:text-[#1A4F34] transition-colors">
          {title}
        </h3>
        <p className="text-[#666666] mb-4 line-clamp-2">
          {summary}
        </p>
        
        {/* Meta */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[#666666]">{date}</span>
          <div className="flex items-center gap-2">
            <CategoryBadge category={category} />
            {tags.length > 0 && (
              <span className="text-[#666666]">
                #{tags[0]}
              </span>
            )}
          </div>
        </div>
        
        {/* Download Badge for Ops */}
        {variant === 'ops' && (props as OpsCardProps).downloadable && (
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <span className="inline-flex items-center gap-1 text-[#F59E0B]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              다운로드 가능
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
