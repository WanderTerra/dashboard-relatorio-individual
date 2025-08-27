import { useState, useEffect } from 'react';
import { formatISO } from 'date-fns';

export interface Filters {
  start: string;    // ISO YYYY-MM-DD
  end: string;      // ISO YYYY-MM-DD
  carteira?: string;
  activeOnly?: boolean; // Filtrar apenas agentes ativos
}

// Chaves para localStorage
const STORAGE_KEYS = {
  START_DATE: 'dashboard_start_date',
  END_DATE: 'dashboard_end_date',
  CARTEIRA: 'dashboard_carteira'
} as const;

// Função para calcular data padrão (6 meses atrás)
const getDefaultDates = () => {
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  return {
    start: formatISO(sixMonthsAgo, { representation: 'date' }),
    end: formatISO(today, { representation: 'date' })
  };
};

// Função para carregar filtros do localStorage
const loadFiltersFromStorage = (): Filters => {
  try {
    const storedStart = localStorage.getItem(STORAGE_KEYS.START_DATE);
    const storedEnd = localStorage.getItem(STORAGE_KEYS.END_DATE);
    const storedCarteira = localStorage.getItem(STORAGE_KEYS.CARTEIRA);
    
    // Se não há dados salvos, usa os padrões
    if (!storedStart || !storedEnd) {
      const defaults = getDefaultDates();
      return {
        start: defaults.start,
        end: defaults.end,
        carteira: storedCarteira || ''
      };
    }
    const loadedFilters = {
      start: storedStart,
      end: storedEnd,
      carteira: storedCarteira || ''
    };
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
    localStorage.setItem(STORAGE_KEYS.START_DATE, filters.start);
    localStorage.setItem(STORAGE_KEYS.END_DATE, filters.end);
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
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
    saveFiltersToStorage(updatedFilters);
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
    setStartDate: (start: string) => setFilters({ start }),
    setEndDate: (end: string) => setFilters({ end }),
    setCarteira: (carteira: string) => setFilters({ carteira })
  };
};
