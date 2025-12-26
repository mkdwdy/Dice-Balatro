import { useState } from 'react';
import { useLocation } from 'wouter';
import { Dices, Trophy, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const startNewGame = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const game = await response.json();
      setLocation(`/game/${game.id}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-xl w-full text-center space-y-6">
        {/* Title */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dices className="w-12 h-12 text-primary" />
            <h1 className="text-4xl sm:text-5xl font-black text-primary tracking-tight">
              YAHTZEE<br/>BALATRO
            </h1>
            <Trophy className="w-12 h-12 text-accent" />
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Roll dice, build combos, defeat enemies.<br/>
            Yahtzee meets deck-building roguelike.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-3xl mb-1">🎲</div>
            <h3 className="font-bold text-sm">Physics Dice</h3>
            <p className="text-xs text-muted-foreground">3D real physics</p>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-3xl mb-1">🃏</div>
            <h3 className="font-bold text-sm">Build Deck</h3>
            <p className="text-xs text-muted-foreground">Collect upgrades</p>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="text-3xl mb-1">⚔️</div>
            <h3 className="font-bold text-sm">Combat</h3>
            <p className="text-xs text-muted-foreground">Strategic battles</p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startNewGame}
          disabled={loading}
          data-testid="button-start-game"
          className="bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-black text-xl py-4 px-10 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-3 mx-auto shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              START NEW GAME
            </>
          )}
        </button>

        {/* Footer */}
        <div className="text-xs text-muted-foreground">
          <p>Lock dice for better combos • Higher stakes = bigger rewards</p>
        </div>
      </div>
    </div>
  );
}
