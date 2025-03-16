"use client";

import { useState, useEffect } from "react";
import { BrokerConnection, BrokerType, BrokerCredentials } from "@/types/broker";

export const BROKER_STORAGE_KEY = "tradingJournalBrokers";

export function useBrokers() {
  const [brokers, setBrokers] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load broker connections from localStorage
  useEffect(() => {
    setLoading(true);
    const storedBrokers = localStorage.getItem(BROKER_STORAGE_KEY);
    if (storedBrokers) {
      setBrokers(JSON.parse(storedBrokers));
    }
    setLoading(false);
  }, []);
  
  // Save broker connections to localStorage whenever they change
  useEffect(() => {
    if (!loading && brokers.length >= 0) {
      localStorage.setItem(BROKER_STORAGE_KEY, JSON.stringify(brokers));
    }
  }, [brokers, loading]);
  
  // Add a new broker connection
  const addBroker = (broker: BrokerConnection) => {
    setBrokers([...brokers, { 
      ...broker,
      id: crypto.randomUUID()
    }]);
    return broker;
  };
  
  // Update an existing broker connection
  const updateBroker = (id: string, updates: Partial<BrokerConnection>) => {
    setBrokers(brokers.map(broker => 
      broker.id === id ? { ...broker, ...updates } : broker
    ));
  };
  
  // Remove a broker connection
  const removeBroker = (id: string) => {
    setBrokers(brokers.filter(broker => broker.id !== id));
  };
  
  // Connect to a broker API 
  const connectBroker = async (
    brokerId: string, 
    credentials: BrokerCredentials
  ): Promise<{ success: boolean; message: string }> => {
    // Find the broker to connect
    const broker = brokers.find(b => b.id === brokerId);
    if (!broker) {
      return { success: false, message: "Broker not found" };
    }
    
    try {
      // In a real implementation, this would call an API to authenticate with the broker
      // For now, we'll simulate authentication success
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the broker connection
      updateBroker(brokerId, { 
        isConnected: true,
        lastSynced: new Date().toISOString(),
        authData: {
          accessToken: "simulated-token",
          refreshToken: "simulated-refresh-token",
          expiresAt: Date.now() + 3600000, // 1 hour expiration
        }
      });
      
      return { success: true, message: "Connected successfully" };
    } catch (error) {
      console.error("Error connecting to broker:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  };
  
  // Disconnect from a broker API
  const disconnectBroker = (id: string) => {
    updateBroker(id, { 
      isConnected: false,
      authData: undefined
    });
    
    return { success: true, message: "Disconnected successfully" };
  };
  
  // Import trades from connected broker (simulated)
  const importTradesFromBroker = async (
    brokerId: string,
    accountId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{ success: boolean; message: string; tradesImported?: number }> => {
    // Find the broker
    const broker = brokers.find(b => b.id === brokerId);
    if (!broker) {
      return { success: false, message: "Broker not found" };
    }
    
    if (!broker.isConnected) {
      return { success: false, message: "Broker is not connected" };
    }
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would fetch trades from the broker API
      // For now, we'll return a success message with a random number of imported trades
      const tradesImported = Math.floor(Math.random() * 20) + 1;
      
      // Update the last synced timestamp
      updateBroker(brokerId, { 
        lastSynced: new Date().toISOString()
      });
      
      return { 
        success: true, 
        message: `Successfully imported ${tradesImported} trades`,
        tradesImported
      };
    } catch (error) {
      console.error("Error importing trades:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  };
  
  return {
    brokers,
    loading,
    addBroker,
    updateBroker,
    removeBroker,
    connectBroker,
    disconnectBroker,
    importTradesFromBroker
  };
} 