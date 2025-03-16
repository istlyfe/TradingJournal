/**
 * Trade Service
 * 
 * A central place for all trade-related calculations and operations
 */

import { getFuturesContractMultiplier, isFuturesContract } from "./utils";

export interface Trade {
  id?: string;
  symbol: string;
  direction: "LONG" | "SHORT";
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
  direction: "LONG" | "SHORT",
  entryPrice: number,
  exitPrice: number,
  quantity: number
): number {
  // Exit early if missing data
  if (!entryPrice || !exitPrice || !quantity) return 0;

  // Get multiplier for futures contracts
  const multiplier = getFuturesContractMultiplier(symbol);
  
  // Calculate raw PnL
  let pnl = 0;
  if (direction === "LONG") {
    pnl = (exitPrice - entryPrice) * quantity * multiplier;
  } else {
    pnl = (entryPrice - exitPrice) * quantity * multiplier;
  }
  
  // Debug logging
  console.log(`PnL calculation for ${symbol} (${direction}):`);
  console.log(`Entry: ${entryPrice}, Exit: ${exitPrice}, Quantity: ${quantity}, Multiplier: ${multiplier}`);
  console.log(`Formula: ${direction === "LONG" ? 
    `(${exitPrice} - ${entryPrice}) * ${quantity} * ${multiplier}` : 
    `(${entryPrice} - ${exitPrice}) * ${quantity} * ${multiplier}`}`);
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