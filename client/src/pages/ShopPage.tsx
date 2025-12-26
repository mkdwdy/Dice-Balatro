import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Crown, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import type { GameSession } from '@shared/schema';

const SHOP_ITEMS = {
  jokers: [
    { id: 'joker_1', name: 'Lucky Joker', description: '+10% damage on all hands', effect: 'damage_boost', cost: 5 },
    { id: 'joker_2', name: 'Suit Master', description: 'Flushes get +2 multiplier', effect: 'flush_boost', cost: 8 },
    { id: 'joker_3', name: 'Pair Power', description: 'Pairs count as Triples', effect: 'pair_upgrade', cost: 6 },
  ],
  consumables: [
    { id: 'consumable_1', name: 'Reroll Token', description: '+1 reroll this battle', effect: 'extra_reroll', cost: 3 },
    { id: 'consumable_2', name: 'Health Potion', description: 'Restore 1 HP', effect: 'heal', cost: 4 },
    { id: 'consumable_3', name: 'Gold Coin', description: 'Gain $5', effect: 'gold', cost: 2 },
  ],
};

export default function ShopPage() {
  const [match, params] = useRoute('/shop/:id');
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

  const buyItem = async (itemType: string, item: any) => {
    if (!game || game.gold < item.cost) return;

    try {
      const response = await fetch(`/api/games/${game.id}/shop/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, item, cost: item.cost }),
      });
      const updatedGame = await response.json();
      setGame(updatedGame);
    } catch (error) {
      console.error('Failed to buy item:', error);
    }
  };

  const exitShop = async () => {
    if (!game) return;

    try {
      await fetch(`/api/games/${game.id}/shop/exit`, {
        method: 'POST',
      });
      setLocation(`/stage-select/${game.id}`);
    } catch (error) {
      console.error('Failed to exit shop:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shop...</p>
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
    <div className="h-screen bg-background text-foreground p-4 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-black text-primary">SHOP</h1>
              <p className="text-xs text-muted-foreground">Stage {game.currentStage}-{game.currentRound}</p>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-xl font-black text-primary">${game.gold}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Items - Scrollable if needed */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-auto">
        {/* Jokers */}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
            Jokers (Permanent)
          </h2>
          <div className="space-y-2 flex-1">
            {SHOP_ITEMS.jokers.map((joker) => (
              <div
                key={joker.id}
                className="bg-card border border-card-border rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{joker.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{joker.description}</p>
                </div>
                <button
                  onClick={() => buyItem('joker', joker)}
                  disabled={game.gold < joker.cost}
                  data-testid={`button-buy-${joker.id}`}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold px-4 py-1 rounded-lg transition-colors ml-2 text-sm flex-shrink-0"
                >
                  ${joker.cost}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Consumables */}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2 flex-shrink-0">
            <ShoppingBag className="w-4 h-4 text-accent" />
            Consumables (One-Time)
          </h2>
          <div className="space-y-2 flex-1">
            {SHOP_ITEMS.consumables.map((consumable) => (
              <div
                key={consumable.id}
                className="bg-card border border-card-border rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{consumable.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{consumable.description}</p>
                </div>
                <button
                  onClick={() => buyItem('consumable', consumable)}
                  disabled={game.gold < consumable.cost}
                  data-testid={`button-buy-${consumable.id}`}
                  className="bg-secondary hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground text-secondary-foreground font-bold px-4 py-1 rounded-lg transition-colors ml-2 text-sm flex-shrink-0"
                >
                  ${consumable.cost}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exit Button */}
      <div className="flex-shrink-0 mt-4">
        <button
          onClick={exitShop}
          data-testid="button-exit-shop"
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-black text-lg py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
