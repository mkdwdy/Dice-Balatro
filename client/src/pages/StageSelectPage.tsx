import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Swords, Target, Skull, Crown, HeartIcon } from 'lucide-react';
import type { GameSession } from '@shared/schema';

const STAGE_OPTIONS = [
  { 
    id: 'easy', 
    name: 'Easy', 
    enemyHp: 800, 
    reward: 3,
    icon: Target,
    color: 'text-green-500',
    description: 'Low HP enemy',
  },
  { 
    id: 'medium', 
    name: 'Medium', 
    enemyHp: 1000, 
    reward: 5,
    icon: Swords,
    color: 'text-yellow-500',
    description: 'Medium HP enemy',
  },
  { 
    id: 'hard', 
    name: 'Hard', 
    enemyHp: 1200, 
    reward: 8,
    icon: Skull,
    color: 'text-red-500',
    description: 'High HP enemy',
  },
  { 
    id: 'boss', 
    name: 'BOSS', 
    enemyHp: 2000, 
    reward: 15,
    icon: Crown,
    color: 'text-purple-500',
    description: 'Advance round',
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
      <div className="h-screen bg-background flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading stages...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="h-screen bg-background flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <p className="text-destructive text-lg">Game not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground p-4 flex flex-col items-center justify-center overflow-hidden">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-primary mb-2">SELECT BATTLE</h1>
          <p className="text-lg text-muted-foreground">Stage {game.currentStage}-{game.currentRound}</p>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <HeartIcon className="w-4 h-4 text-destructive" />
              <span className="text-lg font-bold">{game.health} HP</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold">${game.gold}</span>
            </div>
          </div>
        </div>

        {/* Stage Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAGE_OPTIONS.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => selectStage(stage.id)}
                data-testid={`button-stage-${stage.id}`}
                className="bg-card border-2 border-card-border hover:border-primary rounded-xl p-4 transition-all duration-200 transform hover:scale-105 text-left"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-6 h-6 ${stage.color}`} />
                  <h2 className="text-lg font-black">{stage.name}</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{stage.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <span className="text-xs text-muted-foreground">HP:</span>
                    <span className="text-sm font-black text-accent">{stage.enemyHp}</span>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
                    <span className="text-xs text-muted-foreground">Reward:</span>
                    <span className="text-sm font-black text-primary">+${stage.reward}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground mt-4">
          <p>Higher difficulty = more gold</p>
        </div>
      </div>
    </div>
  );
}
