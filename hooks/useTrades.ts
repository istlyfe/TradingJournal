"use client";

import { useState, useEffect } from 'react';
import { Trade } from '@/types/trade';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load trades from localStorage
  const loadTrades = () => {
    setIsLoading(true);
    try {
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (storedTrades) {
        const tradesObj = JSON.parse(storedTrades);
        // Convert from object to array
        const tradesArray = Object.values(tradesObj);
        setTrades(tradesArray as Trade[]);
      } else {
        setTrades([]);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to explicitly refetch trades (for example after deletion)
  const refetchTrades = () => {
    loadTrades();
  };

  // Load trades on mount
  useEffect(() => {
    loadTrades();
  }, []);

  // Listen for storage changes (to sync across tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradingJournalTrades') {
        loadTrades();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { trades, isLoading, refetchTrades };
} 