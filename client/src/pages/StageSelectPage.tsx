import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Swords, Target, Skull, Crown, HeartIcon } from 'lucide-react';
import type { GameSession } from '@shared/schema';

const STAGE_OPTIONS = [
  { 
    id: 'easy', 
    name: 'Easy Battle', 
    enemyHp: 800, 
    reward: 3,
    icon: Target,
    color: 'text-green-500',
    description: 'Standard enemy • Low HP',
  },
  { 
    id: 'medium', 
    name: 'Medium Battle', 
    enemyHp: 1000, 
    reward: 5,
    icon: Swords,
    color: 'text-yellow-500',
    description: 'Tougher enemy • Medium HP',
  },
  { 
    id: 'hard', 
    name: 'Hard Battle', 
    enemyHp: 1200, 
    reward: 8,
    icon: Skull,
    color: 'text-red-500',
    description: 'Elite enemy • High HP',
  },
  { 
    id: 'boss', 
    name: 'BOSS', 
    enemyHp: 2000, 
    reward: 15,
    icon: Crown,
    color: 'text-purple-500',
    description: 'Boss fight • Extreme HP • Advances round',
  },
];

export default function StageSelectPage() {
  const [match, params] = useRoute('/stage-select/:id');
  const [_, setLocation] = useLocation();
  const [game, setGame] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (match && params?.id) {
      fetchGame(params.id);
    }
  }, [match, params?.id]);

  const fetchGame = async (id: string) => {
    try {
      const response = await fetch(`/api/games/${id}`);
      const data = await response.json();
      setGame(data);
    } catch (error) {
      console.error('Failed to fetch game:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectStage = async (stageChoice: string) => {
    if (!game) return;

    try {
      await fetch(`/api/games/${game.id}/next-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageChoice }),
      });
      setLocation(`/game/${game.id}`);
    } catch (error) {
      console.error('Failed to select stage:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading stages...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg">Game not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-primary mb-4">SELECT YOUR BATTLE</h1>
          <p className="text-xl text-muted-foreground">Stage {game.currentStage}-{game.currentRound}</p>
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="flex items-center gap-2">
              <HeartIcon className="w-5 h-5 text-destructive" />
              <span className="text-2xl font-bold">{game.health} HP</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">${game.gold}</span>
            </div>
          </div>
        </div>

        {/* Stage Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STAGE_OPTIONS.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => selectStage(stage.id)}
                data-testid={`button-stage-${stage.id}`}
                className="bg-card border-2 border-card-border hover:border-primary rounded-xl p-8 transition-all duration-200 transform hover:scale-105 text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-10 h-10 ${stage.color}`} />
                    <div>
                      <h2 className="text-2xl font-black">{stage.name}</h2>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                    <span className="text-sm font-bold text-muted-foreground">Enemy HP:</span>
                    <span className="text-xl font-black text-accent">{stage.enemyHp}</span>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                    <span className="text-sm font-bold text-muted-foreground">Reward:</span>
                    <span className="text-xl font-black text-primary">+${stage.reward}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>Higher difficulty = more gold • Boss fights advance to next round</p>
        </div>
      </div>
    </div>
  );
}
