import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Swords, HeartIcon, Crown, RefreshCw, Play } from 'lucide-react';
import type { GameSession } from '@shared/schema';

// 스테이지별 스탯 계산
function getStageStats(stage: number) {
  const baseHp = 100;
  const baseReward = 3;
  const stageMultiplier = 1 + (stage - 1) * 0.5;
  
  return {
    enemyHp: Math.round(baseHp * stageMultiplier),
    goldReward: Math.round(baseReward * stageMultiplier),
    enemyDamage: Math.round(10 + (stage - 1) * 2),
  };
}

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

  const startBattle = async () => {
    if (!game) return;

    try {
      await fetch(`/api/games/${game.id}/next-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageChoice: 'easy' }),
      });
      setLocation(`/game/${game.id}`);
    } catch (error) {
      console.error('Failed to start battle:', error);
    }
  };

  const resetGame = async () => {
    const response = await fetch('/api/games/new', { method: 'POST' });
    const newGame = await response.json();
    setLocation(`/stage-select/${newGame.id}`);
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

  const nextStage = game.currentStage + 1;
  const upcomingStages = [0, 1, 2, 3, 4].map(offset => nextStage + offset);

  return (
    <div className="h-screen bg-background text-foreground p-4 flex flex-col items-center justify-center overflow-hidden relative">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-primary mb-2">STAGE MAP</h1>
          <p className="text-lg text-muted-foreground">Your journey ahead</p>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <HeartIcon className="w-4 h-4 text-destructive" />
              <span className="text-lg font-bold">{game.health}/{game.maxHealth || 100} HP</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold">${game.gold}</span>
            </div>
          </div>
        </div>

        {/* Stage Preview - Horizontal progression */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-4">
          {upcomingStages.map((stageNum, index) => {
            const stats = getStageStats(stageNum);
            const isNext = index === 0;
            
            return (
              <div key={stageNum} className="flex items-center">
                <div
                  className={`flex-shrink-0 rounded-xl p-4 transition-all ${
                    isNext 
                      ? 'bg-primary/20 border-2 border-primary scale-110 shadow-lg' 
                      : 'bg-card border border-card-border opacity-60'
                  }`}
                  style={{ minWidth: isNext ? '140px' : '100px' }}
                >
                  <div className="text-center">
                    <div className={`text-xs font-bold mb-1 ${isNext ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isNext ? 'NEXT' : `Stage ${stageNum}`}
                    </div>
                    <Swords className={`w-6 h-6 mx-auto mb-2 ${isNext ? 'text-accent' : 'text-muted-foreground'}`} />
                    <div className={`text-lg font-black ${isNext ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {stageNum}
                    </div>
                    {isNext && (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">HP:</span>
                          <span className="font-bold text-accent">{stats.enemyHp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ATK:</span>
                          <span className="font-bold text-orange-500">{stats.enemyDamage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gold:</span>
                          <span className="font-bold text-primary">+{stats.goldReward}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {index < upcomingStages.length - 1 && (
                  <div className="w-4 h-0.5 bg-muted-foreground/30 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={startBattle}
            data-testid="button-start-battle"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 px-12 rounded-xl text-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-3 mx-auto"
          >
            <Play className="w-6 h-6" />
            START STAGE {nextStage}
          </button>
        </div>
      </div>

      {/* Reset Button - Bottom Left */}
      <button
        onClick={resetGame}
        data-testid="button-reset"
        className="absolute bottom-4 left-4 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg text-sm font-bold"
      >
        <RefreshCw className="w-4 h-4" />
        RESET
      </button>
    </div>
  );
}
