"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Medal, Star, Target, TrendingUp, BarChart, Calendar,
  Award, Zap, Clock, Flame, TrendingDown, Calculator, ArrowUpRight,
  Plus, PlusCircle, ArrowUp, Lightbulb, Sparkles
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Types for the gamification system
interface TradingBadge {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name
  unlocked: boolean;
  progress: number;
  target: number;
  dateEarned?: string;
  category: 'achievement' | 'milestone' | 'consistency' | 'skill';
}

interface TradingChallenge {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward: number; // XP reward
  progress: number;
  target: number;
  completed: boolean;
  dateCompleted?: string;
  category: 'daily' | 'weekly' | 'milestone';
}

interface UserProgress {
  level: number;
  xp: number;
  xpForNextLevel: number;
  streakDays: number;
  totalTrades: number;
  tradingPoints: number;
  rank: string;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
  averageWin: number;
  averageLoss: number;
  consecutiveWins: number;
}

export default function ProgressPage() {
  // State
  const [badges, setBadges] = useState<TradingBadge[]>([]);
  const [challenges, setChallenges] = useState<TradingChallenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    xp: 0,
    xpForNextLevel: 100,
    streakDays: 0,
    totalTrades: 0,
    tradingPoints: 0,
    rank: 'Novice Trader',
    winRate: 0,
    profitFactor: 0,
    totalPnL: 0,
    bestTrade: 0,
    worstTrade: 0,
    averageWin: 0,
    averageLoss: 0,
    consecutiveWins: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("badges");
  
  // New state for custom badge/challenge creation
  const [newBadge, setNewBadge] = useState<Partial<TradingBadge>>({
    name: '',
    description: '',
    icon: 'Trophy',
    category: 'achievement',
    target: 1,
    progress: 0,
    unlocked: false
  });
  
  const [newChallenge, setNewChallenge] = useState<Partial<TradingChallenge>>({
    name: '',
    description: '',
    difficulty: 'medium',
    reward: 25,
    target: 5,
    progress: 0,
    completed: false,
    category: 'weekly'
  });
  
  // Load demo data and saved data
  useEffect(() => {
    // Load saved data first
    loadSavedItems();
    
    // Simulate loading data from backend/API
    const loadData = () => {
      // Demo badges data
      const demoUserProgress: UserProgress = {
        level: 7,
        xp: 65,
        xpForNextLevel: 100,
        streakDays: 12,
        totalTrades: 87,
        tradingPoints: 6540,
        rank: 'Skilled Trader',
        winRate: 58.4,
        profitFactor: 1.78,
        totalPnL: 4325.75,
        bestTrade: 842.50,
        worstTrade: -375.25,
        averageWin: 125.45,
        averageLoss: -72.30,
        consecutiveWins: 5
      };
      
      // Since we're loading data from localStorage first, only set these as defaults if we don't have any
      if (badges.length === 0) {
        setBadges(demoBadges);
      }
      
      if (challenges.length === 0) {
        setChallenges(demoChallenges);
      }
      
      // Load user progress stats from localStorage or trades data
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (!storedTrades) {
        // If no trades data, use demo data
        setUserProgress(demoUserProgress);
      }
      
      setIsLoading(false);
    };
    
    // Simulate loading saved data from localStorage
    const loadSavedData = () => {
      try {
        // Check for saved trading data
        if (typeof window !== "undefined") {
          const storedTrades = localStorage.getItem('tradingJournalTrades');
          if (storedTrades) {
            try {
              const trades = JSON.parse(storedTrades);
              if (trades && typeof trades === 'object') {
                // Calculate real stats based on trades
                let tradeCount = 0;
                let winCount = 0;
                let totalPnL = 0;
                let bestTrade = 0;
                let worstTrade = 0;
                let totalWins = 0;
                let totalLosses = 0;
                let currentStreak = 0;
                let maxStreak = 0;
                let lossCount = 0;
                
                // Process each trade
                Object.values(trades).forEach((trade: any) => {
                  if (!trade || typeof trade !== 'object') return;
                  
                  tradeCount++;
                  const pnl = trade.pnl || 0;
                  totalPnL += pnl;
                  
                  if (pnl > 0) {
                    winCount++;
                    totalWins += pnl;
                    bestTrade = Math.max(bestTrade, pnl);
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                  } else if (pnl < 0) {
                    lossCount++;
                    totalLosses += Math.abs(pnl);
                    worstTrade = Math.min(worstTrade, pnl);
                    currentStreak = 0;
                  }
                });
                
                // Calculate derived metrics
                const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
                const avgWin = winCount > 0 ? totalWins / winCount : 0;
                const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
                const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 3 : 0;
                
                // Level calculation based on trades and performance
                const level = Math.min(Math.floor(tradeCount / 15) + 1, 20);
                
                // Rank calculation
                let rank = 'Novice Trader';
                if (level >= 15 && winRate >= 60 && profitFactor >= 2.5) rank = 'Master Trader';
                else if (level >= 10 && winRate >= 55 && profitFactor >= 2) rank = 'Expert Trader';
                else if (level >= 7 && winRate >= 50 && profitFactor >= 1.5) rank = 'Skilled Trader';
                else if (level >= 5 && winRate >= 45) rank = 'Developing Trader';
                else if (level >= 3) rank = 'Apprentice Trader';
                
                // Points calculation - based on PnL and trading metrics
                const tradingPoints = Math.round(
                  (Math.max(0, totalPnL) * 0.5) + // PnL contribution
                  (winRate * 10) + // Win rate contribution
                  (profitFactor * 100) + // Profit factor contribution
                  (tradeCount * 5) // Activity contribution
                );
                
                // Set actual progress based on real trading data
                setUserProgress({
                  level,
                  xp: Math.round((level % 1) * 100), // Progress to next level
                  xpForNextLevel: 100,
                  streakDays: Math.max(maxStreak, 0),
                  totalTrades: tradeCount,
                  tradingPoints,
                  rank,
                  winRate,
                  profitFactor,
                  totalPnL,
                  bestTrade,
                  worstTrade,
                  averageWin: avgWin,
                  averageLoss: avgLoss,
                  consecutiveWins: currentStreak
                });
                
                // Update challenge progress based on real data
                updateChallengesProgress(trades);
                // Update badges progress based on real data
                updateBadgesProgress({
                  tradeCount,
                  winRate,
                  profitFactor,
                  totalPnL,
                  bestTrade,
                  worstTrade,
                  avgWin,
                  avgLoss,
                  maxStreak,
                  currentStreak
                });
                
                setIsLoading(false);
                return; // Skip demo data if we loaded real data
              }
            } catch (error) {
              console.error("Error calculating trade statistics:", error);
            }
          }
        }
        
        // If we don't have any saved data or encountered an error, load demo data
        loadData();
      } catch (error) {
        console.error("Error loading saved data:", error);
        loadData(); // Fall back to demo data
      }
    };
    
    // Attempt to load saved data first, fall back to demo data
    loadSavedData();
  }, []);  // Removed dependencies to avoid loops
  
  // Update challenges progress based on real trade data
  const updateChallengesProgress = (trades: any) => {
    // Use trades data to update challenges - implementation would go here
    // This would analyze trades to update challenges like:
    // - Win rate challenges
    // - Profit milestones
    // - Position sizing consistency
    // - Etc.
    
    // For now, we'll just keep the demo challenges
    setChallenges(demoChallenges);
  };
  
  // Update badges progress based on real trade metrics
  const updateBadgesProgress = (metrics: any) => {
    // Use trade metrics to update badge progress - implementation would go here
    // This would check trade metrics against badge criteria like:
    // - First profitable trade
    // - Winning streaks
    // - Risk management consistency
    // - Etc.
    
    // For now, we'll just keep the demo badges
    setBadges(demoBadges);
  };
  
  // Demo data (this would be eventually replaced by real data)
  const demoBadges: TradingBadge[] = [
    {
      id: 'first-profit',
      name: 'First Blood',
      description: 'Complete your first profitable trade',
      icon: 'Trophy',
      unlocked: true,
      progress: 1,
      target: 1,
      dateEarned: '2023-11-15',
      category: 'achievement'
    },
    {
      id: 'winning-streak',
      name: 'On Fire',
      description: 'Achieve 5 consecutive profitable trades',
      icon: 'Flame',
      unlocked: true,
      progress: 5,
      target: 5,
      dateEarned: '2023-12-01',
      category: 'achievement'
    },
    {
      id: 'big-win',
      name: 'Whale Hunter',
      description: 'Score a profit of $1,000+ on a single trade',
      icon: 'TrendingUp',
      unlocked: false,
      progress: 750,
      target: 1000,
      category: 'milestone'
    },
    {
      id: 'journal-master',
      name: 'Journal Master',
      description: 'Log detailed notes for 20 consecutive trades',
      icon: 'BookOpen',
      unlocked: true,
      progress: 20,
      target: 20,
      dateEarned: '2023-12-10',
      category: 'consistency'
    },
    {
      id: 'risk-manager',
      name: 'Risk Guardian',
      description: 'Maintain proper position sizing for 30 trades',
      icon: 'Shield',
      unlocked: false,
      progress: 22,
      target: 30,
      category: 'skill'
    },
    {
      id: 'comeback-kid',
      name: 'Phoenix Trader',
      description: 'Recover from a 10% drawdown to make new equity high',
      icon: 'TrendingUp',
      unlocked: false,
      progress: 0,
      target: 1,
      category: 'achievement'
    },
    {
      id: 'consistency-king',
      name: 'Consistency King',
      description: 'Achieve 10 profitable trading days in a row',
      icon: 'Calendar',
      unlocked: false,
      progress: 7,
      target: 10,
      category: 'consistency'
    },
    {
      id: 'perfect-exit',
      name: 'Perfect Exit',
      description: 'Exit a trade within 5% of the highest price',
      icon: 'Target',
      unlocked: true,
      progress: 1,
      target: 1,
      dateEarned: '2023-12-15',
      category: 'skill'
    },
  ];
  
  const demoChallenges: TradingChallenge[] = [
    {
      id: 'daily-journal',
      name: 'Daily Journal',
      description: 'Record detailed notes for today\'s trades',
      difficulty: 'easy',
      reward: 10,
      progress: 2,
      target: 3,
      completed: false,
      category: 'daily'
    },
    {
      id: 'win-rate-boost',
      name: 'Win Rate Boost',
      description: 'Achieve a 60% win rate over the next 10 trades',
      difficulty: 'medium',
      reward: 50,
      progress: 6,
      target: 10,
      completed: false,
      category: 'weekly'
    },
    {
      id: 'profit-milestone',
      name: 'Profit Milestone',
      description: 'Reach $5,000 in total profits',
      difficulty: 'hard',
      reward: 100,
      progress: 3750,
      target: 5000,
      completed: false,
      category: 'milestone'
    },
    {
      id: 'consistent-sizing',
      name: 'Consistent Sizing',
      description: 'Use proper position sizing for 5 consecutive trades',
      difficulty: 'easy',
      reward: 25,
      progress: 3,
      target: 5,
      completed: false,
      category: 'daily'
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Complete 3 profitable trades before 10 AM',
      difficulty: 'medium',
      reward: 30,
      progress: 2,
      target: 3,
      completed: false,
      category: 'daily'
    },
    {
      id: 'trading-plan',
      name: 'Plan Adherence',
      description: 'Follow your predefined trading plan for 7 days straight',
      difficulty: 'hard',
      reward: 75,
      progress: 5,
      target: 7,
      completed: false,
      category: 'weekly'
    },
    {
      id: 'review-master',
      name: 'Review Master',
      description: 'Review and analyze your past 20 trades',
      difficulty: 'medium',
      reward: 40,
      progress: 20,
      target: 20,
      completed: true,
      dateCompleted: '2023-12-18',
      category: 'weekly'
    },
  ];
  
  // Get badge icon
  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trophy': return <Trophy className="h-5 w-5" />;
      case 'Medal': return <Medal className="h-5 w-5" />;
      case 'Star': return <Star className="h-5 w-5" />;
      case 'Target': return <Target className="h-5 w-5" />;
      case 'TrendingUp': return <TrendingUp className="h-5 w-5" />;
      case 'BarChart': return <BarChart className="h-5 w-5" />;
      case 'Calendar': return <Calendar className="h-5 w-5" />;
      case 'BookOpen': return <Award className="h-5 w-5" />;
      case 'Shield': return <Award className="h-5 w-5" />;
      case 'Flame': return <Flame className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };
  
  // Get challenge difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'hard': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'expert': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Functions to handle creating custom badges and challenges
  const handleCreateBadge = () => {
    if (!newBadge.name || !newBadge.description) return;
    
    const badge: TradingBadge = {
      id: `custom-${Date.now()}`,
      name: newBadge.name || 'Custom Badge',
      description: newBadge.description || 'Custom achievement',
      icon: newBadge.icon || 'Trophy',
      category: newBadge.category as 'achievement' | 'milestone' | 'consistency' | 'skill',
      target: newBadge.target || 1,
      progress: 0,
      unlocked: false
    };
    
    setBadges([...badges, badge]);
    
    // Reset form
    setNewBadge({
      name: '',
      description: '',
      icon: 'Trophy',
      category: 'achievement',
      target: 1,
      progress: 0,
      unlocked: false
    });
    
    // Save to localStorage (in a real app)
    saveBadgesToLocalStorage([...badges, badge]);
  };
  
  const handleCreateChallenge = () => {
    if (!newChallenge.name || !newChallenge.description) return;
    
    const challenge: TradingChallenge = {
      id: `custom-${Date.now()}`,
      name: newChallenge.name || 'Custom Challenge',
      description: newChallenge.description || 'Custom challenge description',
      difficulty: newChallenge.difficulty as 'easy' | 'medium' | 'hard' | 'expert',
      reward: newChallenge.reward || 25,
      target: newChallenge.target || 1,
      progress: 0,
      completed: false,
      category: newChallenge.category as 'daily' | 'weekly' | 'milestone'
    };
    
    setChallenges([...challenges, challenge]);
    
    // Reset form
    setNewChallenge({
      name: '',
      description: '',
      difficulty: 'medium',
      reward: 25,
      target: 5,
      progress: 0,
      completed: false,
      category: 'weekly'
    });
    
    // Save to localStorage (in a real app)
    saveChallengesToLocalStorage([...challenges, challenge]);
  };
  
  // Functions to save to localStorage
  const saveBadgesToLocalStorage = (badgesToSave: TradingBadge[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('tradingJournalBadges', JSON.stringify(badgesToSave));
    } catch (error) {
      console.error('Error saving badges:', error);
    }
  };
  
  const saveChallengesToLocalStorage = (challengesToSave: TradingChallenge[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('tradingJournalChallenges', JSON.stringify(challengesToSave));
    } catch (error) {
      console.error('Error saving challenges:', error);
    }
  };
  
  // Function to load badges and challenges from localStorage
  const loadSavedItems = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedBadges = localStorage.getItem('tradingJournalBadges');
      const savedChallenges = localStorage.getItem('tradingJournalChallenges');
      
      if (savedBadges) {
        const parsedBadges = JSON.parse(savedBadges);
        if (Array.isArray(parsedBadges)) {
          setBadges(parsedBadges);
        }
      }
      
      if (savedChallenges) {
        const parsedChallenges = JSON.parse(savedChallenges);
        if (Array.isArray(parsedChallenges)) {
          setChallenges(parsedChallenges);
        }
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading your trading progress...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-3">
            <Trophy className="h-6 w-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trader Progress</h1>
            <p className="text-muted-foreground text-sm">Level up your trading skills and track achievements</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[320px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="stats">Trading Stats</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Level & Progress Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-6 shadow-sm border border-amber-100 dark:border-amber-900/30">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Level Info */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">{userProgress.level}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1 shadow-md">
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Rank</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{userProgress.rank}</div>
              <div className="flex items-center gap-1 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">{userProgress.streakDays} day streak</span>
              </div>
            </div>
          </div>
          
          {/* XP Progress */}
          <div className="w-full lg:max-w-md">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">XP Progress</span>
              <span className="font-medium">{userProgress.xp} / {userProgress.xpForNextLevel} XP</span>
            </div>
            <Progress value={(userProgress.xp / userProgress.xpForNextLevel) * 100} className="h-3" />
            <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              {userProgress.xpForNextLevel - userProgress.xp} XP needed for Level {userProgress.level + 1}
            </div>
          </div>
          
          {/* Trading Metrics Summary */}
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {userProgress.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
            <Button variant="outline" size="sm" className="mt-2 border-amber-200 dark:border-amber-800">
              <Award className="h-4 w-4 mr-1 text-amber-500" /> View Achievements
            </Button>
          </div>
        </div>
      </div>
      
      {/* PnL & Win Rate Card Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total P&L */}
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none overflow-hidden">
          <CardContent className="p-0">
            <div className={`h-1.5 w-full ${userProgress.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total P&L
                </h3>
                <div className="rounded-full p-1.5">
                  {userProgress.totalPnL >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className={`mt-3 text-2xl font-bold ${userProgress.totalPnL >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {formatCurrency(userProgress.totalPnL)}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Based on {userProgress.totalTrades} total trades
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profit Factor */}
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none overflow-hidden">
          <CardContent className="p-0">
            <div className={`h-1.5 w-full ${userProgress.profitFactor >= 1.5 ? 'bg-blue-500' : userProgress.profitFactor >= 1 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Profit Factor
                </h3>
                <div className="rounded-full p-1.5">
                  <Calculator className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className={`mt-3 text-2xl font-bold ${
                userProgress.profitFactor >= 1.5 ? 'text-blue-600 dark:text-blue-500' : 
                userProgress.profitFactor >= 1 ? 'text-amber-600 dark:text-amber-500' : 
                'text-red-600 dark:text-red-500'
              }`}>
                {userProgress.profitFactor.toFixed(2)}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Gross Profit ÷ Gross Loss ratio
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Best Trade */}
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none overflow-hidden">
          <CardContent className="p-0">
            <div className="h-1.5 w-full bg-green-500"></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Best Trade
                </h3>
                <div className="rounded-full p-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-green-600 dark:text-green-500">
                {formatCurrency(userProgress.bestTrade)}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {userProgress.averageWin > 0 && `${(userProgress.bestTrade / userProgress.averageWin).toFixed(1)}x avg win`}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Consecutive Wins */}
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-none overflow-hidden">
          <CardContent className="p-0">
            <div className="h-1.5 w-full bg-indigo-500"></div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Current Win Streak
                </h3>
                <div className="rounded-full p-1.5">
                  <Flame className="h-4 w-4 text-indigo-500" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-indigo-600 dark:text-indigo-500">
                {userProgress.consecutiveWins}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {userProgress.streakDays > 0 && `Best: ${userProgress.streakDays} trades`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="badges">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <Card key={badge.id} className={`overflow-hidden transition-all ${badge.unlocked ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-800 opacity-80'}`}>
                <CardContent className="p-0">
                  <div className={`h-1.5 w-full ${badge.unlocked ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={badge.unlocked ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}>
                        {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
                      </Badge>
                      <div className={`p-2 rounded-full ${badge.unlocked ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {getBadgeIcon(badge.icon)}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{badge.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 h-10">
                      {badge.description}
                    </p>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{badge.progress} / {badge.target}</span>
                        <span>{((badge.progress / badge.target) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(badge.progress / badge.target) * 100} className="h-1.5" />
                      
                      {badge.unlocked && badge.dateEarned && (
                        <div className="flex items-center justify-center mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Unlocked on {new Date(badge.dateEarned).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Custom Badge Creator Button */}
          <div className="mt-6 flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Card className="w-full md:w-auto border-dashed border-amber-200 dark:border-amber-800/40 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 mb-3">
                      <Plus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-medium">Create Custom Badge</h3>
                    <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
                      Define your own trading milestones and track personal achievements
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Custom Badge</DialogTitle>
                  <DialogDescription>
                    Design a personal trading badge to track your custom goals
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="badge-name">Badge Name</Label>
                    <Input 
                      id="badge-name" 
                      placeholder="e.g., Perfect Week"
                      value={newBadge.name}
                      onChange={(e) => setNewBadge({...newBadge, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="badge-description">Description</Label>
                    <Textarea 
                      id="badge-description" 
                      placeholder="e.g., Complete a week with only profitable trades"
                      value={newBadge.description}
                      onChange={(e) => setNewBadge({...newBadge, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="badge-category">Category</Label>
                      <Select 
                        value={newBadge.category} 
                        onValueChange={(value) => setNewBadge({...newBadge, category: value as any})}
                      >
                        <SelectTrigger id="badge-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="achievement">Achievement</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="consistency">Consistency</SelectItem>
                          <SelectItem value="skill">Skill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="badge-icon">Icon</Label>
                      <Select 
                        value={newBadge.icon} 
                        onValueChange={(value) => setNewBadge({...newBadge, icon: value as any})}
                      >
                        <SelectTrigger id="badge-icon">
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Trophy">Trophy</SelectItem>
                          <SelectItem value="Medal">Medal</SelectItem>
                          <SelectItem value="Star">Star</SelectItem>
                          <SelectItem value="Target">Target</SelectItem>
                          <SelectItem value="TrendingUp">Trending Up</SelectItem>
                          <SelectItem value="Flame">Flame</SelectItem>
                          <SelectItem value="Calendar">Calendar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="badge-target">Target Value</Label>
                    <Input 
                      id="badge-target" 
                      type="number" 
                      placeholder="e.g., 5"
                      value={newBadge.target}
                      onChange={(e) => setNewBadge({...newBadge, target: parseInt(e.target.value) || 1})}
                    />
                    <p className="text-xs text-muted-foreground">
                      How many times you need to do this to complete the badge
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateBadge}>Create Badge</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        
        <TabsContent value="challenges">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Active Challenges
                </CardTitle>
                <CardDescription>Complete these challenges to earn XP and level up</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {challenges.filter(c => !c.completed).map((challenge) => (
                    <div key={challenge.id} className="border rounded-lg p-4 bg-white dark:bg-gray-950">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                          </div>
                          <div>
                            <h4 className="font-medium">{challenge.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{challenge.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
                          +{challenge.reward} XP
                        </Badge>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>
                            {typeof challenge.progress === 'number' 
                              ? `${challenge.progress} / ${challenge.target}`
                              : challenge.progress}
                          </span>
                        </div>
                        <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                      </div>
                      
                      {/* Update progress buttons */}
                      <div className="flex justify-end mt-3 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const updatedChallenges = challenges.map(c => {
                              if (c.id === challenge.id) {
                                const newProgress = Math.min(c.progress + 1, c.target);
                                return {
                                  ...c,
                                  progress: newProgress,
                                  completed: newProgress >= c.target
                                };
                              }
                              return c;
                            });
                            setChallenges(updatedChallenges);
                            saveChallengesToLocalStorage(updatedChallenges);
                          }}
                        >
                          + Progress
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Challenge Creator Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mt-4 border-dashed">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Custom Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create Custom Challenge</DialogTitle>
                      <DialogDescription>
                        Design a personal trading challenge to improve your skills
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="challenge-name">Challenge Name</Label>
                        <Input 
                          id="challenge-name" 
                          placeholder="e.g., Consistent Position Sizing"
                          value={newChallenge.name}
                          onChange={(e) => setNewChallenge({...newChallenge, name: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="challenge-description">Description</Label>
                        <Textarea 
                          id="challenge-description" 
                          placeholder="e.g., Use proper position sizing for every trade for a week"
                          value={newChallenge.description}
                          onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="challenge-difficulty">Difficulty</Label>
                          <Select 
                            value={newChallenge.difficulty} 
                            onValueChange={(value) => setNewChallenge({...newChallenge, difficulty: value as any})}
                          >
                            <SelectTrigger id="challenge-difficulty">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="challenge-category">Category</Label>
                          <Select 
                            value={newChallenge.category} 
                            onValueChange={(value) => setNewChallenge({...newChallenge, category: value as any})}
                          >
                            <SelectTrigger id="challenge-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="milestone">Milestone</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="challenge-target">Target</Label>
                          <Input 
                            id="challenge-target" 
                            type="number" 
                            placeholder="e.g., 5"
                            value={newChallenge.target}
                            onChange={(e) => setNewChallenge({...newChallenge, target: parseInt(e.target.value) || 1})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="challenge-reward">XP Reward</Label>
                          <Input 
                            id="challenge-reward" 
                            type="number" 
                            placeholder="e.g., 25"
                            value={newChallenge.reward}
                            onChange={(e) => setNewChallenge({...newChallenge, reward: parseInt(e.target.value) || 10})}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleCreateChallenge}>Create Challenge</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            
            {/* Completed Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Completed Challenges
                </CardTitle>
                <CardDescription>Your recently completed challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {challenges.filter(c => c.completed).map((challenge) => (
                    <div key={challenge.id} className="border rounded-lg p-4 bg-white dark:bg-gray-950">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                          </div>
                          <div>
                            <h4 className="font-medium">{challenge.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{challenge.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Completed
                        </Badge>
                      </div>
                      
                      {challenge.dateCompleted && (
                        <div className="flex items-center justify-end mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Completed on {new Date(challenge.dateCompleted).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trading Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-indigo-500" />
                  Trading Statistics
                </CardTitle>
                <CardDescription>Your trading metrics and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Basic Stats */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Activity</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <TrendingUp className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                          </div>
                          <span className="text-sm">Total Trades</span>
                        </div>
                        <span className="font-medium">{userProgress.totalTrades}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                            <Calendar className="h-4 w-4 text-green-700 dark:text-green-400" />
                          </div>
                          <span className="text-sm">Current Streak</span>
                        </div>
                        <span className="font-medium">{userProgress.streakDays} days</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                            <Medal className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                          </div>
                          <span className="text-sm">Badges Earned</span>
                        </div>
                        <span className="font-medium">{badges.filter(b => b.unlocked).length}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <Target className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                          </div>
                          <span className="text-sm">Challenges Completed</span>
                        </div>
                        <span className="font-medium">{challenges.filter(c => c.completed).length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Stats */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Performance</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                            <ArrowUpRight className="h-4 w-4 text-green-700 dark:text-green-400" />
                          </div>
                          <span className="text-sm">Win Rate</span>
                        </div>
                        <span className="font-medium">{userProgress.winRate.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Calculator className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                          </div>
                          <span className="text-sm">Profit Factor</span>
                        </div>
                        <span className="font-medium">{userProgress.profitFactor.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                            <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-400" />
                          </div>
                          <span className="text-sm">Avg Win</span>
                        </div>
                        <span className="font-medium">{formatCurrency(userProgress.averageWin)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
                            <TrendingDown className="h-4 w-4 text-red-700 dark:text-red-400" />
                          </div>
                          <span className="text-sm">Avg Loss</span>
                        </div>
                        <span className="font-medium">{formatCurrency(userProgress.averageLoss)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                {/* Level History */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Trader Journey</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Your progress and development as a trader over time
                  </p>
                  
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-indigo-100 dark:bg-indigo-900/30"></div>
                    <div className="space-y-4">
                      {[
                        { level: userProgress.level, milestone: "Current Level", date: new Date().toLocaleDateString() },
                        { level: Math.max(1, userProgress.level - 1), milestone: "Consistent Profitability", date: new Date(2023, 11, 15).toLocaleDateString() },
                        { level: Math.max(1, userProgress.level - 2), milestone: "Risk Management Mastery", date: new Date(2023, 10, 7).toLocaleDateString() },
                        { level: Math.max(1, userProgress.level - 3), milestone: "Strategy Refinement", date: new Date(2023, 9, 22).toLocaleDateString() },
                        { level: Math.max(1, userProgress.level - 4), milestone: "First Trading System", date: new Date(2023, 8, 10).toLocaleDateString() },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 ml-3 pl-6 relative">
                          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-gray-900"></div>
                          <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                            <Star className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-medium">{item.milestone}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Level {item.level} • {item.date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Trading Strengths Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Trading Strengths
                </CardTitle>
                <CardDescription>Analysis of your trading performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {/* Top Strengths */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                      Your Strengths
                    </h4>
                    
                    {[
                      { name: "Risk Management", score: 85, description: "Your average loss is well controlled" },
                      { name: "Consistency", score: 72, description: "You trade with regular frequency" },
                      { name: "Discipline", score: 68, description: "You follow your trading plan well" },
                    ].map((strength, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{strength.name}</span>
                          <Badge className="bg-green-100 text-green-800">{strength.score}%</Badge>
                        </div>
                        <Progress value={strength.score} className="h-1.5" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {strength.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  {/* Areas for Improvement */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center">
                      <Target className="h-4 w-4 text-amber-500 mr-1" />
                      Areas to Improve
                    </h4>
                    
                    {[
                      { name: "Letting Winners Run", score: 45, description: "Your winners could be larger" },
                      { name: "Position Sizing", score: 52, description: "Your position sizes vary too much" },
                    ].map((area, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{area.name}</span>
                          <Badge className="bg-amber-100 text-amber-800">{area.score}%</Badge>
                        </div>
                        <Progress value={area.score} className="h-1.5" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {area.description}
                        </p>
                      </div>
                    ))}
                    
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Get Improvement Tips
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Upcoming Features */}
      <div className="border border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg p-6 bg-indigo-50/50 dark:bg-indigo-950/20 mt-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mt-1 mb-4">
          Keep an eye out for these exciting gamification features
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <h4 className="font-medium flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">New</Badge>
              Trading Quests
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complete series of interconnected challenges for bigger rewards
            </p>
          </div>
          
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <h4 className="font-medium flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">New</Badge>
              Strategy Analyzer
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              AI-powered insights to optimize your trading strategies
            </p>
          </div>
          
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <h4 className="font-medium flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">New</Badge>
              Trading Journal AI
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Smart assistant to help identify patterns in your trading
            </p>
          </div>
          
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <h4 className="font-medium flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">New</Badge>
              Skill Trees
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Unlock advanced trading skills and techniques as you level up
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
); 