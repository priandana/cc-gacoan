'use client';

import { useState, useCallback } from 'react';
import { CycleItem, SheetConfig, SourceFilter, SortField, SortDirection } from '@/lib/types';
import { fetchCycleData } from '@/lib/sheetsApi';
import { filterBySource, filterBySearch } from '@/lib/utils';

interface UseCycleDataReturn {
  items: CycleItem[];
  filteredItems: CycleItem[];
  isLoading: boolean;
  error: string | null;
  selectedDate: number;
  sourceFilter: SourceFilter;
  searchQuery: string;
  sortField: SortField;
  sortDir: SortDirection;
  lastUpdated: Date | null;
  loadData: (date: number, config: SheetConfig) => Promise<void>;
  setDate: (date: number, config: SheetConfig) => void;
  setSource: (source: SourceFilter) => void;
  setSearch: (q: string) => void;
  setSort: (field: SortField) => void;
}

export function useCycleData(initialDate: number): UseCycleDataReturn {
  const [items, setItems] = useState<CycleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (date: number, config: SheetConfig) => {
    if (!config.apiKey) {
      setError('API Key belum diisi. Buka Settings untuk konfigurasi.');
      return;
    }
    if (!config.freshSpreadsheetId && !config.drySpreadsheetId) {
      setError('Spreadsheet ID belum diisi. Buka Settings untuk konfigurasi.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCycleData(date, config);
      setItems(data);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDate = useCallback((date: number, config: SheetConfig) => {
    setSelectedDate(date);
    loadData(date, config);
  }, [loadData]);

  const setSource = useCallback((source: SourceFilter) => {
    setSourceFilter(source);
  }, []);

  const setSearch = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  const setSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return field;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  // Apply filters + sort
  let filteredItems = filterBySource(items, sourceFilter);
  filteredItems = filterBySearch(filteredItems, searchQuery);

  if (sortField) {
    filteredItems = [...filteredItems].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'sku':  valA = a.sku; valB = b.sku; break;
        case 'name': valA = a.desc; valB = b.desc; break;
        case 'exp':  valA = a.expDate; valB = b.expDate; break;
        case 'qty':  valA = a.qty; valB = b.qty; break;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      const cmp = String(valA).localeCompare(String(valB), 'id');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  return {
    items,
    filteredItems,
    isLoading,
    error,
    selectedDate,
    sourceFilter,
    searchQuery,
    sortField,
    sortDir,
    lastUpdated,
    loadData,
    setDate,
    setSource,
    setSearch,
    setSort,
  };
}
