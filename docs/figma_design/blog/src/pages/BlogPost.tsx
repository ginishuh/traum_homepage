import React from 'react';
import { Header } from '../components/blog/Header';
import { CategoryBadge, getCategoryColor } from '../components/blog/CategoryBadge';
import { BlogCard } from '../components/blog/Card';
import { Footer } from '../components/blog/Footer';
import { FloatingButton } from '../components/blog/FloatingButton';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface BlogPostProps {
  onNavigate: (page: 'home' | 'list' | 'post', postId?: string) => void;
}

export function BlogPost({ onNavigate }: BlogPostProps) {
  const post = {
    category: 'market' as const,
    title: '2024 Q4 건설 자재 시장 동향 분석',
    summary: '철근, 레미콘 가격 변동과 수급 전망을 데이터로 살펴봅니다.',
    date: '2024.10.15',
    tags: ['시장분석', 'Q4', '가격동향'],
    readTime: '8분',
    image: 'https://images.unsplash.com/photo-1761587941453-bd1790225d52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXQlMjBhbmFseXNpcyUyMGNoYXJ0fGVufDF8fHx8MTc2MTcxMTY1MXww&ixlib=rb-4.1.0&q=80&w=1080',
    kpis: [
      { label: '철근 가격 변동', value: '+5.2%' },
      { label: '레미콘 가격 변동', value: '+2.8%' },
      { label: '시멘트 재고율', value: '85%' },
      { label: '전체 시장 성장', value: '+3.5%' }
    ]
  };
  
  const categoryColor = getCategoryColor(post.category);
  
  const relatedPosts = [
    {
      id: '5',
      variant: 'market' as const,
      title: '재생 자재 활용 사례 및 경제성 분석',
      summary: '친환경 트렌드에 맞춘 재생 자재 도입의 실제 효과를 분석합니다.',
      date: '2024.10.01',
      category: 'market' as const,
      tags: ['친환경', '재생자재'],
      kpis: [
        { label: '비용 절감', value: '12%' },
        { label: 'CO2 감축', value: '18%' }
      ]
    },
    {
      id: '9',
      variant: 'market' as const,
      title: '2025년 건설 시장 전망과 대응 전략',
      summary: '새해 건설 시장의 변화를 예측하고 우리의 전략을 소개합니다.',
      date: '2024.09.15',
      category: 'market' as const,
      tags: ['전망', '2025'],
      kpis: [
        { label: '시장 성장률', value: '+3.5%' },
        { label: '수주 목표', value: '₩120억' }
      ]
    },
    {
      id: '2',
      variant: 'ops' as const,
      title: '현장 안전 점검 체크리스트 업데이트',
      summary: '2025년 개정된 안전 규정을 반영한 최신 체크리스트를 공유합니다.',
      date: '2024.10.12',
      category: 'ops' as const,
      tags: ['안전', '체크리스트'],
      checklist: ['개인보호장구 착용 확인', '작업 구역 안전 펜스 설치'],
      downloadable: true
    }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header currentPage="post" onNavigate={onNavigate} />
      
      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />
      
      {/* Hero Image */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden bg-[#333333]">
        <ImageWithFallback
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover opacity-90"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)'
          }}
        />
      </div>
      
      {/* Article Container */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content */}
          <article className="lg:col-span-8">
            {/* Category Color Band */}
            <div 
              className="w-[60px] h-1 rounded-full mb-6"
              style={{ backgroundColor: categoryColor }}
            />
            
            {/* Title & Meta */}
            <h1 className="mb-4">
              {post.title}
            </h1>
            
            <p className="text-[#666666] mb-6 text-lg">
              {post.summary}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-[#E5E7EB]">
              <span className="text-[#666666]">{post.date}</span>
              <span className="text-[#666666]">•</span>
              <span className="text-[#666666]">{post.readTime} 읽기</span>
              <span className="text-[#666666]">•</span>
              <CategoryBadge category={post.category} />
              <div className="flex gap-2">
                {post.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[#666666]">#{tag}</span>
                ))}
              </div>
            </div>
            
            {/* KPI Section */}
            {post.kpis && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 p-6 bg-white rounded-[12px] border border-[#E5E7EB]">
                {post.kpis.map((kpi, index) => (
                  <div key={index} className="text-center">
                    <div className="text-[#666666] mb-1">{kpi.label}</div>
                    <div className="text-[#1A4F34]">{kpi.value}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <h2>시장 개요</h2>
              <p>
                2024년 4분기 건설 자재 시장은 전반적으로 상승세를 보이고 있습니다. 
                특히 철근과 레미콘의 가격 상승이 두드러지며, 이는 원자재 가격 상승과 
                물류비 증가에 따른 영향으로 분석됩니다.
              </p>
              
              <h3>주요 자재별 동향</h3>
              <p>
                철근 가격은 전 분기 대비 5.2% 상승했으며, 이는 국제 철광석 가격 상승과 
                국내 수요 증가가 주요 원인입니다. 레미콘은 2.8% 상승했는데, 
                시멘트 가격 안정화에도 불구하고 운송비 증가가 가격 상승을 견인했습니다.
              </p>
              
              <blockquote>
                <p>
                  "시장 전문가들은 연말까지 현 수준의 가격이 유지될 것으로 전망하고 있으며, 
                  내년 1분기부터는 안정화될 가능성이 높다고 분석했습니다."
                </p>
              </blockquote>
              
              <h3>시장 전망</h3>
              <p>
                향후 3개월간 건설 자재 시장은 다음과 같은 추세를 보일 것으로 예상됩니다:
              </p>
              
              <ul>
                <li>철근: 현 수준 유지 또는 소폭 하락 예상</li>
                <li>레미콘: 계절적 요인으로 수요 감소, 가격 안정화 전망</li>
                <li>시멘트: 재고율 높아 가격 하락 압력 존재</li>
                <li>목재: 수입 물량 증가로 가격 안정세 예상</li>
              </ul>
              
              <h3>대응 전략</h3>
              <p>
                트라움자원은 이러한 시장 환경에 대응하기 위해 다음과 같은 전략을 수립했습니다:
              </p>
              
              <ol>
                <li>주요 자재의 분기별 장기 계약 체결로 가격 변동성 최소화</li>
                <li>대체 자재 및 재생 자재 활용 확대</li>
                <li>물류 효율화를 통한 운송비 절감</li>
                <li>디지털 구매 시스템 도입으로 발주 프로세스 간소화</li>
              </ol>
              
              <div className="bg-[#E8FBE5] border-l-4 border-[#1A4F34] p-6 my-8 rounded-r-lg">
                <h4 className="mt-0 mb-2 text-[#1A4F34]">실무 팁</h4>
                <p className="mb-0">
                  자재 구매 시 단순히 가격만 비교하지 말고, 납기, 품질, 
                  A/S 등을 종합적으로 고려하세요. 장기적으로는 신뢰할 수 있는 
                  공급처와의 관계 구축이 더 큰 가치를 만들어냅니다.
                </p>
              </div>
              
              <h2>결론</h2>
              <p>
                2024년 4분기 건설 자재 시장은 전반적으로 상승 압력을 받고 있지만, 
                체계적인 구매 전략과 대안 모색을 통해 충분히 대응 가능한 수준입니다. 
                트라움자원은 시장 동향을 지속적으로 모니터링하며 최적의 구매 전략을 
                수립해 나가겠습니다.
              </p>
            </div>
            
            {/* Download CTA (optional for market category) */}
            <div className="mt-12 p-6 bg-white rounded-[12px] border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h4 className="mb-1">상세 분석 보고서 다운로드</h4>
                <p className="text-[#666666] mb-0">더 자세한 데이터와 차트를 PDF로 확인하세요</p>
              </div>
              <button 
                className="px-6 py-3 rounded-[50px] bg-[#2D6CDF] text-white hover:bg-[#1D4ED8] transition-colors duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                다운로드
              </button>
            </div>
            
            {/* Prev/Next Navigation */}
            <div className="mt-12 pt-8 border-t border-[#E5E7EB] flex justify-between gap-4">
              <button 
                className="flex items-center gap-2 text-[#666666] hover:text-[#1A4F34] transition-colors"
                onClick={() => onNavigate('post', 'prev')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                이전 글
              </button>
              <button 
                className="flex items-center gap-2 text-[#666666] hover:text-[#1A4F34] transition-colors"
                onClick={() => onNavigate('post', 'next')}
              >
                다음 글
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </article>
          
          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              {/* Table of Contents */}
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 mb-6">
                <h4 className="mb-4 text-[#1A4F34]">목차</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-[#666666] hover:text-[#1A4F34] transition-colors">
                      시장 개요
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#666666] hover:text-[#1A4F34] transition-colors">
                      주요 자재별 동향
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#666666] hover:text-[#1A4F34] transition-colors">
                      시장 전망
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#666666] hover:text-[#1A4F34] transition-colors">
                      대응 전략
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#666666] hover:text-[#1A4F34] transition-colors">
                      결론
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Share */}
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6">
                <h4 className="mb-4 text-[#1A4F34]">공유하기</h4>
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 rounded-lg bg-[#F8F9FA] hover:bg-[#E5E7EB] transition-colors">
                    <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button className="flex-1 px-4 py-2 rounded-lg bg-[#F8F9FA] hover:bg-[#E5E7EB] transition-colors">
                    <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>
                  <button className="flex-1 px-4 py-2 rounded-lg bg-[#F8F9FA] hover:bg-[#E5E7EB] transition-colors">
                    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
        
        {/* Related Posts */}
        <section className="mt-16 md:mt-20 pt-12 md:pt-16 border-t border-[#E5E7EB]">
          <h2 className="mb-8 text-center text-[#1A4F34]">관련 글</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <BlogCard
                key={relatedPost.id}
                {...relatedPost}
                onClick={() => onNavigate('post', relatedPost.id)}
              />
            ))}
          </div>
        </section>
      </div>
      
      <Footer />
      <FloatingButton />
    </div>
  );
}
