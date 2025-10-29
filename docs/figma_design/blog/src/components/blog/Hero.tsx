import React from 'react';
import { BlogButton } from './Button';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface HeroProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  onPrimaryCTA?: () => void;
  onSecondaryCTA?: () => void;
}

export function Hero({ title, subtitle, backgroundImage, onPrimaryCTA, onSecondaryCTA }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={backgroundImage}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(26, 79, 52, 0.80) 0%, rgba(74, 157, 111, 0.60) 100%)'
          }}
        />
      </div>
      
      {/* Content - Vertically Centered */}
      <div className="relative z-10 min-h-[400px] md:min-h-[500px] flex items-center">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-16 md:py-20 text-center w-full">
          <h1 className="text-white mb-3 md:mb-4">
            {title}
          </h1>
          <p className="text-white/95 mb-6 md:mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
          
          {/* Button Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <BlogButton 
              variant="secondary" 
              size="large"
              onClick={onPrimaryCTA}
            >
              최신 글 보기
            </BlogButton>
            <BlogButton 
              variant="outline-white" 
              size="large"
              onClick={onSecondaryCTA}
            >
              전체 아카이브
            </BlogButton>
          </div>
        </div>
      </div>
    </section>
  );
}
