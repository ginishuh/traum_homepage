import React, { useState } from 'react';
import { Header } from '../components/blog/Header';
import { SectionHeader } from '../components/blog/SectionHeader';
import { FilterChip } from '../components/blog/FilterChip';
import { BlogCard } from '../components/blog/Card';
import { Pagination } from '../components/blog/Pagination';
import { Footer } from '../components/blog/Footer';
import { FloatingButton } from '../components/blog/FloatingButton';
import { CategoryType } from '../components/blog/CategoryBadge';

interface BlogListProps {
  onNavigate: (page: 'home' | 'list' | 'post', postId?: string) => void;
}

export function BlogList({ onNavigate }: BlogListProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const allPosts = [
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
    },
    {
      id: '7',
      variant: 'behind' as const,
      title: '디지털 전환 여정: BIM 도입 1년 후기',
      summary: 'BIM 시스템 도입부터 정착까지의 과정과 성과를 공유합니다.',
      date: '2024.09.25',
      category: 'behind' as const,
      tags: ['디지털', 'BIM'],
      timeline: '1년 완료'
    },
    {
      id: '8',
      variant: 'story' as const,
      title: '안전관리자 박영희님이 전하는 현장 안전 이야기',
      summary: '현장 안전의 최전선에서 일하는 안전관리자의 진솔한 이야기.',
      date: '2024.09.20',
      category: 'story' as const,
      tags: ['인터뷰', '안전'],
      quote: '작은 관심이 큰 사고를 예방합니다.'
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
    }
  ];
  
  const filteredPosts = allPosts.filter(post => {
    const categoryMatch = selectedCategory === 'all' || post.category === selectedCategory;
    const searchMatch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });
  
  const totalPages = Math.ceil(filteredPosts.length / 6);
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * 6, currentPage * 6);
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header currentPage="list" onNavigate={onNavigate} />
      
      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />
      
      {/* Category Header */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-[#1A4F34] to-[#4A9D6F]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 text-center text-white">
          <h1 className="mb-3">필드노트 아카이브</h1>
          <p className="text-white/90 max-w-2xl mx-auto">
            현장에서 얻은 모든 인사이트를 한 곳에서 만나보세요
          </p>
        </div>
      </section>
      
      {/* Filter Section */}
      <section className="py-8 md:py-12 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6">
          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <FilterChip
              label="전체"
              selected={selectedCategory === 'all'}
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
            />
            <FilterChip
              label="시장 📊"
              selected={selectedCategory === 'market'}
              onClick={() => {
                setSelectedCategory('market');
                setCurrentPage(1);
              }}
            />
            <FilterChip
              label="운영 ⚙️"
              selected={selectedCategory === 'ops'}
              onClick={() => {
                setSelectedCategory('ops');
                setCurrentPage(1);
              }}
            />
            <FilterChip
              label="비하인드 🔍"
              selected={selectedCategory === 'behind'}
              onClick={() => {
                setSelectedCategory('behind');
                setCurrentPage(1);
              }}
            />
            <FilterChip
              label="스토리 💬"
              selected={selectedCategory === 'story'}
              onClick={() => {
                setSelectedCategory('story');
                setCurrentPage(1);
              }}
            />
          </div>
          
          {/* Search */}
          <div className="relative max-w-xs">
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 pr-10 rounded-[50px] border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1A4F34] focus:border-transparent"
            />
            <svg 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>
      
      {/* Posts Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6">
          {paginatedPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    {...post}
                    onClick={() => onNavigate('post', post.id)}
                  />
                ))}
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#666666]">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
      <FloatingButton />
    </div>
  );
}
