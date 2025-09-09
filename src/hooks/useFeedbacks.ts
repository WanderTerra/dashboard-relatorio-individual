// Criar arquivo: src/hooks/useFeedbacks.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getFeedbacksBatch, getFeedbacksPaginated } from '../lib/api';

interface UseFeedbacksOptions {
  avaliacaoIds: string[];
  pageSize?: number;
  enablePagination?: boolean;
  debounceMs?: number;
}

export const useFeedbacks = ({
  avaliacaoIds,
  pageSize = 20,
  enablePagination = true,
  debounceMs = 300
}: UseFeedbacksOptions) => {
  const [feedbacks, setFeedbacks] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Calcular dados da paginação
  const paginationData = useMemo(() => {
    const total = avaliacaoIds.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const currentIds = avaliacaoIds.slice(start, end);
    
    return {
      total,
      totalPages,
      currentIds,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      startIndex: start,
      endIndex: Math.min(end, total)
    };
  }, [avaliacaoIds, currentPage, pageSize]);

  // Função para carregar feedbacks
  const loadFeedbacks = useCallback(async (page: number = currentPage) => {
    if (avaliacaoIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (enablePagination) {
        const result = await getFeedbacksPaginated(avaliacaoIds, page, pageSize);
        setFeedbacks(result.feedbacks);
      } else {
        const result = await getFeedbacksBatch(avaliacaoIds);
        setFeedbacks(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feedbacks');
      console.error('❌ Erro ao carregar feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, [avaliacaoIds, currentPage, pageSize, enablePagination]);

  // Carregar feedbacks quando os IDs mudarem
  useEffect(() => {
    if (avaliacaoIds.length > 0) {
      loadFeedbacks(1);
    }
  }, [avaliacaoIds.length]); // Só recarrega se o número de IDs mudar

  // Funções de navegação
  const nextPage = useCallback(() => {
    if (paginationData.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationData.hasNext]);

  const prevPage = useCallback(() => {
    if (paginationData.hasPrev) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationData.hasPrev]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= paginationData.totalPages) {
      setCurrentPage(page);
    }
  }, [paginationData.totalPages]);

  return {
    feedbacks,
    loading,
    error,
    currentPage,
    paginationData,
    loadFeedbacks,
    nextPage,
    prevPage,
    goToPage,
    refresh: () => loadFeedbacks(currentPage)
  };
};