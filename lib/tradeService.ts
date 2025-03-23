/**
 * Trade Service
 * 
 * A central place for all trade-related calculations and operations
 */

import { getFuturesContractMultiplier, isFuturesContract } from "./utils";

export interface Trade {
  id?: string;
  symbol: string;
  direction: 'long' | 'short';
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  fees?: number;
  notes?: string;
  tags?: string[];
  contractMultiplier?: number;
}

/**
 * Calculate the PnL for a trade
 */
export function calculatePnL(
  symbol: string,
  direction: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  quantity: number
): number {
  // Exit early if missing data
  if (!entryPrice || !exitPrice || !quantity) return 0;

  // Get multiplier for futures contracts
  const multiplier = getFuturesContractMultiplier(symbol);
  
  // Ensure NQ always uses 20 as multiplier regardless of what's returned
  const effectiveMultiplier = symbol.toUpperCase().includes('NQ') ? 20 : multiplier;
  
  // Calculate raw PnL
  let pnl = 0;
  if (direction === "long") {
    pnl = (exitPrice - entryPrice) * quantity * effectiveMultiplier;
  } else {
    pnl = (entryPrice - exitPrice) * quantity * effectiveMultiplier;
  }
  
  // Round to nearest cent
  pnl = Math.round(pnl * 100) / 100;
  
  // Debug logging
  console.log(`PnL calculation for ${symbol} (${direction}):`);
  console.log(`Entry: ${entryPrice}, Exit: ${exitPrice}, Quantity: ${quantity}, Multiplier: ${effectiveMultiplier}`);
  console.log(`Formula: ${direction === "long" ? 
    `(${exitPrice} - ${entryPrice}) * ${quantity} * ${effectiveMultiplier}` : 
    `(${entryPrice} - ${exitPrice}) * ${quantity} * ${effectiveMultiplier}`}`);
  console.log(`Result: ${pnl}`);
  
  return pnl;
}

/**
 * Calculate the PnL for a completed trade
 */
export function calculateTradePnL(trade: Trade): number {
  if (!trade.exitPrice) return 0;
  
  return calculatePnL(
    trade.symbol,
    trade.direction,
    trade.entryPrice,
    trade.exitPrice,
    trade.quantity
  );
}

/**
 * Get the contract multiplier for a symbol
 */
export function getContractMultiplier(symbol: string): number {
  return getFuturesContractMultiplier(symbol);
}

/**
 * Check if a symbol is a futures contract
 */
export function isFutures(symbol: string): boolean {
  return isFuturesContract(symbol);
} 