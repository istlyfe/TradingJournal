"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trade } from '@/types/trade';
import { useSession } from 'next-auth/react';

export function useTrades() {
  const { data: session, status } = useSession();
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trades from API
  const fetchTrades = useCallback(async (accountId?: string) => {
    if (!session?.user?.email) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (accountId) {
        params.append('accountId', accountId);
      }

      const response = await fetch(`/api/trades?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Convert array to record format for backward compatibility
        const tradesRecord: Record<string, Trade> = {};
        data.trades.forEach((trade: Trade) => {
          tradesRecord[trade.id] = trade;
        });
        setTrades(tradesRecord);
      } else {
        throw new Error(data.message || 'Failed to fetch trades');
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email]);

  // Create new trade
  const createTrade = useCallback(async (tradeData: Partial<Trade>) => {
    if (!session?.user?.email) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create trade');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add new trade to local state
        setTrades(prev => ({
          ...prev,
          [data.trade.id]: data.trade,
        }));
        return data.trade;
      } else {
        throw new Error(data.message || 'Failed to create trade');
      }
    } catch (err) {
      console.error('Error creating trade:', err);
      throw err;
    }
  }, [session?.user?.email]);

  // Update trade
  const updateTrade = useCallback(async (tradeId: string, updates: Partial<Trade>) => {
    if (!session?.user?.email) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update trade');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update trade in local state
        setTrades(prev => ({
          ...prev,
          [tradeId]: { ...prev[tradeId], ...updates },
        }));
        return data.trade;
      } else {
        throw new Error(data.message || 'Failed to update trade');
      }
    } catch (err) {
      console.error('Error updating trade:', err);
      throw err;
    }
  }, [session?.user?.email]);

  // Delete trade
  const deleteTrade = useCallback(async (tradeId: string) => {
    if (!session?.user?.email) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete trade');
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove trade from local state
        setTrades(prev => {
          const { [tradeId]: deleted, ...remaining } = prev;
          return remaining;
        });
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete trade');
      }
    } catch (err) {
      console.error('Error deleting trade:', err);
      throw err;
    }
  }, [session?.user?.email]);

  // Load trades when session changes
  useEffect(() => {
    if (session?.user?.email) {
      fetchTrades();
    } else {
      setTrades({});
    }
  }, [session?.user?.email, fetchTrades]);

  // Fallback to localStorage if API fails (for backward compatibility)
  useEffect(() => {
    if (Object.keys(trades).length === 0 && !isLoading && session?.user?.email) {
      try {
        const storedTrades = localStorage.getItem('tradingJournalTrades');
        if (storedTrades) {
          const parsedTrades = JSON.parse(storedTrades);
          setTrades(parsedTrades);
        }
      } catch (error) {
        console.error('Error loading trades from localStorage:', error);
      }
    }
  }, [trades, isLoading, session?.user?.email]);

  return {
    trades,
    isLoading,
    error,
    fetchTrades,
    createTrade,
    updateTrade,
    deleteTrade,
    setTrades, // Keep for backward compatibility
  };
} 