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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Dices className="w-16 h-16 text-primary" />
            <h1 className="text-6xl font-black text-primary tracking-tight">
              YAHTZEE<br/>BALATRO
            </h1>
            <Trophy className="w-16 h-16 text-accent" />
          </div>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Roll dice, build combos, defeat enemies.<br/>
            Yahtzee meets deck-building roguelike.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          <div className="bg-card border border-card-border rounded-lg p-6">
            <div className="text-4xl mb-2">🎲</div>
            <h3 className="font-bold mb-1">Physics Dice</h3>
            <p className="text-sm text-muted-foreground">3D dice with real physics</p>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-6">
            <div className="text-4xl mb-2">🃏</div>
            <h3 className="font-bold mb-1">Build Your Deck</h3>
            <p className="text-sm text-muted-foreground">Collect jokers & upgrades</p>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-6">
            <div className="text-4xl mb-2">⚔️</div>
            <h3 className="font-bold mb-1">Strategic Combat</h3>
            <p className="text-sm text-muted-foreground">Choose your battles wisely</p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startNewGame}
          disabled={loading}
          data-testid="button-start-game"
          className="bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-black text-2xl py-6 px-12 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-3 mx-auto shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="w-8 h-8" />
              START NEW GAME
            </>
          )}
        </button>

        {/* Footer */}
        <div className="text-xs text-muted-foreground mt-12">
          <p>Lock dice for better combos • Higher stakes = bigger rewards</p>
        </div>
      </div>
    </div>
  );
}
