"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TradeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    symbol: "",
    direction: "LONG", // LONG or SHORT
    entryDate: "",
    entryPrice: "",
    exitDate: "",
    exitPrice: "",
    quantity: "",
    strategy: "",
    notes: "",
    emotionalState: "Neutral",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Calculate P&L
    const entryPrice = parseFloat(formData.entryPrice);
    const exitPrice = parseFloat(formData.exitPrice);
    const quantity = parseFloat(formData.quantity);
    
    let pnl = 0;
    if (formData.direction === "LONG") {
      pnl = (exitPrice - entryPrice) * quantity;
    } else {
      pnl = (entryPrice - exitPrice) * quantity;
    }

    // In a real app, you would save this to your database
    console.log("Trade submitted:", { ...formData, pnl });
    
    // For demo purposes, let's assume it was successful
    alert(`Trade saved successfully! P&L: $${pnl.toFixed(2)}`);
    
    // Reset form and redirect
    setFormData({
      symbol: "",
      direction: "LONG",
      entryDate: "",
      entryPrice: "",
      exitDate: "",
      exitPrice: "",
      quantity: "",
      strategy: "",
      notes: "",
      emotionalState: "Neutral",
    });
    
    setIsSubmitting(false);
    router.push("/trades");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="symbol" className="block text-sm font-medium">Symbol</label>
          <input
            id="symbol"
            name="symbol"
            type="text"
            required
            value={formData.symbol}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
            placeholder="AAPL"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="direction" className="block text-sm font-medium">Direction</label>
          <select
            id="direction"
            name="direction"
            required
            value={formData.direction}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
          >
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="entryDate" className="block text-sm font-medium">Entry Date</label>
          <input
            id="entryDate"
            name="entryDate"
            type="datetime-local"
            required
            value={formData.entryDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="entryPrice" className="block text-sm font-medium">Entry Price</label>
          <input
            id="entryPrice"
            name="entryPrice"
            type="number"
            step="0.01"
            required
            value={formData.entryPrice}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
            placeholder="100.00"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="exitDate" className="block text-sm font-medium">Exit Date</label>
          <input
            id="exitDate"
            name="exitDate"
            type="datetime-local"
            required
            value={formData.exitDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="exitPrice" className="block text-sm font-medium">Exit Price</label>
          <input
            id="exitPrice"
            name="exitPrice"
            type="number"
            step="0.01"
            required
            value={formData.exitPrice}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
            placeholder="105.00"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="quantity" className="block text-sm font-medium">Quantity/Contracts</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            required
            value={formData.quantity}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
            placeholder="100"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="strategy" className="block text-sm font-medium">Strategy</label>
          <input
            id="strategy"
            name="strategy"
            type="text"
            value={formData.strategy}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
            placeholder="Breakout, Swing, etc."
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="emotionalState" className="block text-sm font-medium">Emotional State</label>
          <select
            id="emotionalState"
            name="emotionalState"
            value={formData.emotionalState}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
          >
            <option value="Calm">Calm</option>
            <option value="Excited">Excited</option>
            <option value="Fearful">Fearful</option>
            <option value="Greedy">Greedy</option>
            <option value="Neutral">Neutral</option>
            <option value="Anxious">Anxious</option>
            <option value="Confident">Confident</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md border-input bg-transparent text-sm"
          placeholder="What was your thought process? What went well or poorly?"
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Trade"}
        </button>
      </div>
    </form>
  );
} 