import { useState, useEffect } from 'react';
import { formatISO } from 'date-fns';

export interface Filters {
  start?: string;    // ISO YYYY-MM-DD (opcional)
  end?: string;      // ISO YYYY-MM-DD (opcional)
  carteira?: string;
  activeOnly?: boolean; // Filtrar apenas agentes ativos
}

// Chaves para localStorage
const STORAGE_KEYS = {
  START_DATE: 'dashboard_start_date',
  END_DATE: 'dashboard_end_date',
  CARTEIRA: 'dashboard_carteira'
} as const;

// Função para calcular data padrão (sem filtro por padrão)
const getDefaultDates = () => {
  return {
    start: '',  // Sem filtro de data por padrão
    end: ''     // Sem filtro de data por padrão
  };
};

// Função para carregar filtros do localStorage
const loadFiltersFromStorage = (): Filters => {
  try {
    const storedStart = localStorage.getItem(STORAGE_KEYS.START_DATE);
    const storedEnd = localStorage.getItem(STORAGE_KEYS.END_DATE);
    const storedCarteira = localStorage.getItem(STORAGE_KEYS.CARTEIRA);
    
    const loadedFilters = {
      start: storedStart || '',
      end: storedEnd || '',
      carteira: storedCarteira || ''
    };
    
    // Debug removido para melhorar performance
    return loadedFilters;
  } catch (error) {
    console.warn('Erro ao carregar filtros do localStorage:', error);
    const defaults = getDefaultDates();
    return {
      start: defaults.start,
      end: defaults.end,
      carteira: ''
    };
  }
};

// Função para salvar filtros no localStorage
const saveFiltersToStorage = (filters: Filters) => {
  try {
    // Debug removido para melhorar performance
    localStorage.setItem(STORAGE_KEYS.START_DATE, filters.start || '');
    localStorage.setItem(STORAGE_KEYS.END_DATE, filters.end || '');
    if (filters.carteira) {
      localStorage.setItem(STORAGE_KEYS.CARTEIRA, filters.carteira);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CARTEIRA);
    }
  } catch (error) {
    console.warn('Erro ao salvar filtros no localStorage:', error);
  }
};

export const useFilters = () => {
  const [filters, setFiltersState] = useState<Filters>(() => loadFiltersFromStorage());

  // Função para atualizar filtros
  const setFilters = (newFilters: Partial<Filters>) => {
    // Debug removido para melhorar performance
    
    setFiltersState(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      // Debug removido para melhorar performance
      saveFiltersToStorage(updatedFilters);
      return updatedFilters;
    });
  };

  // Função para resetar para os padrões
  const resetFilters = () => {
    const defaults = getDefaultDates();
    const resetFilters: Filters = {
      start: defaults.start,
      end: defaults.end,
      carteira: ''
    };
    setFiltersState(resetFilters);
    saveFiltersToStorage(resetFilters);
  };

  // Função para limpar localStorage (útil para debug)
  const clearStoredFilters = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.START_DATE);
      localStorage.removeItem(STORAGE_KEYS.END_DATE);
      localStorage.removeItem(STORAGE_KEYS.CARTEIRA);
    } catch (error) {
      console.warn('Erro ao limpar filtros do localStorage:', error);
    }
  };

  return {
    filters,
    setFilters,
    resetFilters,
    clearStoredFilters,
    // Helpers para atualizar campos individuais
    setStartDate: (start: string) => {
      // Debug removido para melhorar performance
      setFilters({ start });
    },
    setEndDate: (end: string) => {
      // Debug removido para melhorar performance
      setFilters({ end });
    },
    setCarteira: (carteira: string) => {
      // Debug removido para melhorar performance
      setFilters({ carteira });
    }
  };
};
