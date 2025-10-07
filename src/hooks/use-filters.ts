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
    
    console.log('🔍 [STORAGE DEBUG] Filtros carregados do localStorage:', loadedFilters);
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
    console.log('🔍 [STORAGE DEBUG] Salvando filtros no localStorage:', filters);
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
    console.log('🔍 [USE-FILTERS DEBUG] Atualizando filtros:', newFilters);
    console.log('🔍 [USE-FILTERS DEBUG] Estado atual dos filtros:', filters);
    
    setFiltersState(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      console.log('🔍 [USE-FILTERS DEBUG] Filtros atualizados:', updatedFilters);
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
      console.log('🔍 [USE-FILTERS DEBUG] setStartDate chamado com:', start);
      setFilters({ start });
    },
    setEndDate: (end: string) => {
      console.log('🔍 [USE-FILTERS DEBUG] setEndDate chamado com:', end);
      setFilters({ end });
    },
    setCarteira: (carteira: string) => {
      console.log('🔍 [USE-FILTERS DEBUG] setCarteira chamado com:', carteira);
      setFilters({ carteira });
    }
  };
};
