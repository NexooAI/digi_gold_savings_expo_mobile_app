import { useState, useEffect } from 'react';
import { getContent } from '../core/config/ContentManager';
import { useLanguage } from '../contexts/LanguageContext';

interface ContentData {
  title: string;
  body: string;
}

interface UseContentReturn {
  content: ContentData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * React hook to load brand-specific content for a page
 * @param page - The page name (e.g., 'about-us', 'privacy-policy')
 * @returns Object containing content, loading state, error, and refresh function
 */
export const useContent = (page: string): UseContentReturn => {
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLanguage();

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContent(page, locale);
      setContent(data as ContentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
      console.error(`Error loading content for ${page}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [page, locale]);

  const refresh = () => {
    loadContent();
  };

  return {
    content,
    loading,
    error,
    refresh
  };
};

/**
 * Hook to preload multiple pages of content
 * @param pages - Array of page names to preload
 * @returns Object containing loading state and error
 */
export const usePreloadContent = (pages: string[]) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLanguage();

  useEffect(() => {
    const preloadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const promises = pages.map(page => getContent(page, locale));
        await Promise.all(promises);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to preload content');
        console.error('Error preloading content:', err);
      } finally {
        setLoading(false);
      }
    };

    preloadContent();
  }, [pages, locale]);

  return { loading, error };
}; 