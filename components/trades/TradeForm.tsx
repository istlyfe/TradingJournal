"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculatePnL, getContractMultiplier } from "@/lib/tradeService";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function TradeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Add tags state management
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
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
    // New fields
    preMarketNotes: "",
    riskRewardRatio: "",
    stopLoss: "",
    takeProfit: "",
    mistakes: "",
    lessonLearned: "",
    tradeSetup: "",
    marketCondition: "Normal",
    maxAdverseExcursion: "", // Maximum against position
    maxFavorableExcursion: "", // Maximum in favor
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle tags
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!selectedTags.includes(tagInput.trim())) {
        setSelectedTags([...selectedTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Parse values
    const symbol = formData.symbol.trim();
    const direction = formData.direction as "LONG" | "SHORT";
    const entryPrice = parseFloat(formData.entryPrice);
    const exitPrice = parseFloat(formData.exitPrice);
    const quantity = parseFloat(formData.quantity);
    
    // Calculate P&L using our trade service
    const pnl = calculatePnL(symbol, direction, entryPrice, exitPrice, quantity);
    
    // Get multiplier for logging
    const multiplier = getContractMultiplier(symbol);
    // Force NQ multiplier to always be 20
    const effectiveMultiplier = symbol.toUpperCase().includes('NQ') ? 20 : multiplier;
    
    // Prepare the trade data with all fields including new ones
    const tradeData = {
      ...formData,
      pnl,
      tags: selectedTags,
      entryPrice: parseFloat(formData.entryPrice),
      exitPrice: parseFloat(formData.exitPrice),
      quantity: parseFloat(formData.quantity),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
      takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : undefined,
      maxAdverseExcursion: formData.maxAdverseExcursion ? parseFloat(formData.maxAdverseExcursion) : undefined,
      maxFavorableExcursion: formData.maxFavorableExcursion ? parseFloat(formData.maxFavorableExcursion) : undefined,
      id: Date.now().toString(), // Generate an ID
      contractMultiplier: effectiveMultiplier,
    };
    
    // In a real app, you would save this to your database
    console.log("Trade Data:", tradeData);
    
    // For demo purposes, use localStorage
    const storedTrades = localStorage.getItem('tradingJournalTrades') || '{}';
    const trades = JSON.parse(storedTrades);
    trades[tradeData.id] = tradeData;
    localStorage.setItem('tradingJournalTrades', JSON.stringify(trades));
    
    alert(`Trade saved successfully! P&L: $${pnl.toFixed(2)}`);
    
    setIsSubmitting(false);
    router.push("/trades");
  };

  const strategyOptions = [
    "Breakout", "Reversal", "Trend Following", "Counter-Trend", 
    "Momentum", "Scalping", "Swing", "Position", "Gap Fill",
    "Support/Resistance", "Double Top/Bottom", "VWAP", "News"
  ];

  const marketConditionOptions = [
    "Normal", "Bullish", "Bearish", "Volatile", "Choppy", 
    "Low Volume", "High Volume", "Pre-Market", "After Hours",
    "News Impact", "Earnings Season", "Economic Report"
  ];

  const commonMistakes = [
    "FOMO", "Premature Exit", "Moving Stop Loss", "Revenge Trading",
    "Averaging Down", "Ignoring Plan", "Overtrading", "Poor Position Sizing",
    "Chasing Entry", "Early Entry", "Late Entry", "Emotional Decision"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        {/* Basic Trade Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                name="symbol"
                required
                value={formData.symbol}
                onChange={handleChange}
                placeholder="AAPL"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select
                name="direction"
                value={formData.direction}
                onValueChange={(value) => handleSelectChange("direction", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entryDate">Entry Date</Label>
              <Input
                id="entryDate"
                name="entryDate"
                type="datetime-local"
                required
                value={formData.entryDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                name="entryPrice"
                type="number"
                step="0.01"
                required
                value={formData.entryPrice}
                onChange={handleChange}
                placeholder="100.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exitDate">Exit Date</Label>
              <Input
                id="exitDate"
                name="exitDate"
                type="datetime-local"
                required
                value={formData.exitDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input
                id="exitPrice"
                name="exitPrice"
                type="number"
                step="0.01"
                required
                value={formData.exitPrice}
                onChange={handleChange}
                placeholder="105.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity/Contracts</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                required
                value={formData.quantity}
                onChange={handleChange}
                placeholder="100"
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Select
                name="strategy"
                value={formData.strategy}
                onValueChange={(value) => handleSelectChange("strategy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategyOptions.map(strategy => (
                    <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="marketCondition">Market Condition</Label>
              <Select
                name="marketCondition"
                value={formData.marketCondition}
                onValueChange={(value) => handleSelectChange("marketCondition", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select market condition" />
                </SelectTrigger>
                <SelectContent>
                  {marketConditionOptions.map(condition => (
                    <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input
                id="stopLoss"
                name="stopLoss"
                type="number"
                step="0.01"
                value={formData.stopLoss}
                onChange={handleChange}
                placeholder="95.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="takeProfit">Take Profit</Label>
              <Input
                id="takeProfit"
                name="takeProfit"
                type="number"
                step="0.01"
                value={formData.takeProfit}
                onChange={handleChange}
                placeholder="110.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="riskRewardRatio">Risk/Reward Ratio</Label>
              <Input
                id="riskRewardRatio"
                name="riskRewardRatio"
                type="text"
                value={formData.riskRewardRatio}
                onChange={handleChange}
                placeholder="1:2"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tradeSetup">Trade Setup</Label>
              <Input
                id="tradeSetup"
                name="tradeSetup"
                type="text"
                value={formData.tradeSetup}
                onChange={handleChange}
                placeholder="Describe your setup"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add tags (press Enter)"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
            />
          </div>
        </TabsContent>
        
        {/* Journal Tab */}
        <TabsContent value="journal" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preMarketNotes">Pre-Market Notes</Label>
              <Textarea
                id="preMarketNotes"
                name="preMarketNotes"
                rows={3}
                value={formData.preMarketNotes}
                onChange={handleChange}
                placeholder="What was your market plan before trading?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emotionalState">Emotional State</Label>
              <Select
                name="emotionalState"
                value={formData.emotionalState}
                onValueChange={(value) => handleSelectChange("emotionalState", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emotional state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Calm">Calm</SelectItem>
                  <SelectItem value="Excited">Excited</SelectItem>
                  <SelectItem value="Fearful">Fearful</SelectItem>
                  <SelectItem value="Greedy">Greedy</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Anxious">Anxious</SelectItem>
                  <SelectItem value="Confident">Confident</SelectItem>
                  <SelectItem value="Frustrated">Frustrated</SelectItem>
                  <SelectItem value="Impatient">Impatient</SelectItem>
                  <SelectItem value="Overconfident">Overconfident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Trade Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="What was your thought process? What went well or poorly?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mistakes">Mistakes Made</Label>
              <Select
                name="mistakes"
                value={formData.mistakes}
                onValueChange={(value) => handleSelectChange("mistakes", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary mistake (if any)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {commonMistakes.map(mistake => (
                    <SelectItem key={mistake} value={mistake}>{mistake}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lessonLearned">Lesson Learned</Label>
              <Textarea
                id="lessonLearned"
                name="lessonLearned"
                rows={3}
                value={formData.lessonLearned}
                onChange={handleChange}
                placeholder="What did you learn from this trade?"
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAdverseExcursion">Maximum Adverse Excursion</Label>
              <Input
                id="maxAdverseExcursion"
                name="maxAdverseExcursion"
                type="number"
                step="0.01"
                value={formData.maxAdverseExcursion}
                onChange={handleChange}
                placeholder="Worst price against position"
              />
              <p className="text-xs text-muted-foreground">
                The maximum amount the trade went against you.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxFavorableExcursion">Maximum Favorable Excursion</Label>
              <Input
                id="maxFavorableExcursion"
                name="maxFavorableExcursion"
                type="number"
                step="0.01"
                value={formData.maxFavorableExcursion}
                onChange={handleChange}
                placeholder="Best price in your favor"
              />
              <p className="text-xs text-muted-foreground">
                The maximum amount the trade went in your favor.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Trade"}
        </Button>
      </div>
    </form>
  );
} 