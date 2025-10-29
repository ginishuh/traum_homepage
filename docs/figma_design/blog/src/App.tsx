import React, { useState } from 'react';
import { BlogHome } from './pages/BlogHome';
import { BlogList } from './pages/BlogList';
import { BlogPost } from './pages/BlogPost';

type PageType = 'home' | 'list' | 'post';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentPostId, setCurrentPostId] = useState<string | undefined>();

  const handleNavigate = (page: PageType, postId?: string) => {
    setCurrentPage(page);
    setCurrentPostId(postId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {currentPage === 'home' && <BlogHome onNavigate={handleNavigate} />}
      {currentPage === 'list' && <BlogList onNavigate={handleNavigate} />}
      {currentPage === 'post' && <BlogPost onNavigate={handleNavigate} />}
    </div>
  );
}
