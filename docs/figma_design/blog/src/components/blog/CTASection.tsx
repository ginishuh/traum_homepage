import React from 'react';
import { BlogButton } from './Button';

interface CTASectionProps {
  title: string;
  subtitle: string;
  primaryCTA?: { label: string; onClick: () => void };
  secondaryCTA?: { label: string; onClick: () => void };
}

export function CTASection({ title, subtitle, primaryCTA, secondaryCTA }: CTASectionProps) {
  return (
    <section 
      className="py-20 md:py-[80px]"
      style={{
        background: 'linear-gradient(135deg, #1A4F34 0%, #4A9D6F 100%)'
      }}
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-6 text-center">
        <h2 className="text-white mb-4">
          {title}
        </h2>
        <p className="text-white/90 mb-8 md:mb-12 max-w-2xl mx-auto">
          {subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {primaryCTA && (
            <BlogButton 
              variant="secondary" 
              size="large"
              onClick={primaryCTA.onClick}
            >
              {primaryCTA.label}
            </BlogButton>
          )}
          {secondaryCTA && (
            <BlogButton 
              variant="outline-white" 
              size="large"
              onClick={secondaryCTA.onClick}
            >
              {secondaryCTA.label}
            </BlogButton>
          )}
        </div>
      </div>
    </section>
  );
}
