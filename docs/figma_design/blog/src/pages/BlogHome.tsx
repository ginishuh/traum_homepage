import React from 'react';
import { Header } from '../components/blog/Header';
import { Hero } from '../components/blog/Hero';
import { SectionHeader } from '../components/blog/SectionHeader';
import { BlogCard } from '../components/blog/Card';
import { CTASection } from '../components/blog/CTASection';
import { Footer } from '../components/blog/Footer';
import { FloatingButton } from '../components/blog/FloatingButton';

interface BlogHomeProps {
  onNavigate: (page: 'home' | 'list' | 'post', postId?: string) => void;
}

export function BlogHome({ onNavigate }: BlogHomeProps) {
  const featuredPosts = [
    {
      id: '1',
      variant: 'market' as const,
      title: '2024 Q4 건설 자재 시장 동향 분석',
      summary: '철근, 레미콘 가격 변동과 수급 전망을 데이터로 살펴봅니다.',
      date: '2024.10.15',
      category: 'market' as const,
      tags: ['시장분석', 'Q4'],
      image: 'https://images.unsplash.com/photo-1761587941453-bd1790225d52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXQlMjBhbmFseXNpcyUyMGNoYXJ0fGVufDF8fHx8MTc2MTcxMTY1MXww&ixlib=rb-4.1.0&q=80&w=1080',
      kpis: [
        { label: '철근 가격', value: '+5.2%' },
        { label: '레미콘', value: '+2.8%' }
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
      image: 'https://images.unsplash.com/photo-1743222270396-703376b47d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwd29ya3xlbnwxfHx8fDE3NjE3MTE2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      checklist: ['개인보호장구 착용 확인', '작업 구역 안전 펜스 설치'],
      downloadable: true
    },
    {
      id: '3',
      variant: 'behind' as const,
      title: '경기 신도시 프로젝트 회고',
      summary: '8개월간의 대규모 프로젝트를 돌아보며 배운 점들을 정리했습니다.',
      date: '2024.10.08',
      category: 'behind' as const,
      tags: ['회고', '프로젝트'],
      image: 'https://images.unsplash.com/photo-1684695747624-0dd1b6412bc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYxNzExNjUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      timeline: '8개월 완료'
    },
    {
      id: '4',
      variant: 'story' as const,
      title: '현장 팀장 김철수님의 이야기',
      summary: '30년 경력의 베테랑 현장 관리자가 전하는 현장의 지혜.',
      date: '2024.10.05',
      category: 'story' as const,
      tags: ['인터뷰', '현장'],
      image: 'https://images.unsplash.com/photo-1615914143778-1a1a6e50c5dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG9mZmljZSUyMG1lZXRpbmd8ZW58MXx8fHwxNzYxNTkzOTYyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      quote: '현장은 책에서 배울 수 없는 살아있는 교과서입니다.'
    },
    {
      id: '5',
      variant: 'market' as const,
      title: '재생 자재 활용 사례 및 경제성 분석',
      summary: '친환경 트렌드에 맞춘 재생 자재 도입의 실제 효과를 분석합니다.',
      date: '2024.10.01',
      category: 'market' as const,
      tags: ['친환경', '재생자재'],
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc2MTY3MTA4NXww&ixlib=rb-4.1.0&q=80&w=1080',
      kpis: [
        { label: '비용 절감', value: '12%' },
        { label: 'CO2 감축', value: '18%' }
      ]
    },
    {
      id: '6',
      variant: 'ops' as const,
      title: '겨울철 현장 관리 가이드',
      summary: '추운 날씨에 대비한 현장 관리 노하우와 체크포인트를 정리했습니다.',
      date: '2024.09.28',
      category: 'ops' as const,
      tags: ['계절관리', '동절기'],
      image: 'https://images.unsplash.com/photo-1748256622734-92241ae7b43f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbiUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjE2OTgyNTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      checklist: ['콘크리트 양생 온도 관리', '동파 방지 조치']
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header currentPage="home" onNavigate={onNavigate} />
      
      <Hero
        title="현장, 시장, 운영의 기록"
        subtitle="트라움자원이 현장에서 겪은 경험과 인사이트를 공유합니다. 실무에 도움이 되는 살아있는 지식을 만나보세요."
        backgroundImage="https://images.unsplash.com/photo-1684695747624-0dd1b6412bc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYxNzExNjUxfDA&ixlib=rb-4.1.0&q=80&w=1080"
        onPrimaryCTA={() => onNavigate('list')}
        onSecondaryCTA={() => onNavigate('list')}
      />
      
      {/* Featured Posts Section */}
      <section className="py-20 md:py-[80px]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6">
          <SectionHeader
            title="최신 필드노트"
            subtitle="현장과 시장에서 얻은 최신 인사이트를 확인하세요"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <BlogCard
                key={post.id}
                {...post}
                onClick={() => onNavigate('post', post.id)}
              />
            ))}
          </div>
        </div>
      </section>
      
      <CTASection
        title="더 많은 인사이트를 받아보세요"
        subtitle="트라움자원의 필드노트를 구독하고 현장의 살아있는 지식을 받아보세요"
        primaryCTA={{ label: '전체 글 보기', onClick: () => onNavigate('list') }}
        secondaryCTA={{ label: '뉴스레터 구독', onClick: () => {} }}
      />
      
      <Footer />
      <FloatingButton />
    </div>
  );
}
