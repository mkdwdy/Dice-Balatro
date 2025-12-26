import { useState } from 'react';
import { Dices, Crown, HeartIcon, RotateCcwIcon, CheckCircleIcon } from 'lucide-react';

interface Dice {
  id: number;
  value: number;
  suit: string;
  locked: boolean;
}

interface HandType {
  name: string;
  multiplier: number;
  condition: string;
}

const HAND_TYPES: HandType[] = [
  { name: 'High Dice', multiplier: 0, condition: '1 highest dice' },
  { name: 'Straight 3', multiplier: 1, condition: '3 numbers in a row' },
  { name: 'Straight 4', multiplier: 2, condition: '4 numbers in a row' },
  { name: 'Straight 5', multiplier: 4, condition: '5 numbers in a row' },
  { name: 'Pair', multiplier: 1, condition: 'Same 2 numbers' },
  { name: 'Two Pair', multiplier: 2, condition: 'Same 2 numbers x2' },
  { name: 'Triple', multiplier: 3, condition: 'Same 3 numbers' },
  { name: 'Full House', multiplier: 4, condition: 'Triple + Pair' },
  { name: 'Four of a Kind', multiplier: 5, condition: 'Same 4 numbers' },
  { name: 'Yahtzee', multiplier: 30, condition: 'Same 5 numbers' },
];

export default function GameScreen() {
  const [dices, setDices] = useState<Dice[]>(
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 6) + 1,
      suit: ['♠', '♥', '♦', '♣'][Math.floor(Math.random() * 4)],
      locked: false,
    }))
  );

  const [rerollsLeft, setRerollsLeft] = useState(3);
  const [gold, setGold] = useState(8);
  const [health, setHealth] = useState(3);
  const [selectedHand, setSelectedHand] = useState<HandType | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [enemyHp, setEnemyHp] = useState(800);
  const [damageDealt, setDamageDealt] = useState<number | null>(null);

  const toggleLock = (id: number) => {
    setDices(dices.map(d => d.id === id ? { ...d, locked: !d.locked } : d));
  };

  const rollDices = () => {
    if (rerollsLeft > 0) {
      setDices(
        dices.map(d =>
          d.locked
            ? d
            : {
                ...d,
                value: Math.floor(Math.random() * 6) + 1,
                suit: ['♠', '♥', '♦', '♣'][Math.floor(Math.random() * 4)],
              }
        )
      );
      setRerollsLeft(rerollsLeft - 1);
    }
  };

  const calculateScore = () => {
    const sum = dices.reduce((acc, d) => acc + d.value, 0);
    const multiplier = selectedHand?.multiplier || 0;
    return sum * (multiplier + 1);
  };

  const submitHand = () => {
    if (selectedHand) {
      const damage = calculateScore();
      setGameScore(gameScore + damage);
      setDamageDealt(damage);
      setEnemyHp(Math.max(0, enemyHp - damage));
      
      setTimeout(() => {
        setDices(
          Array.from({ length: 5 }, (_, i) => ({
            id: i,
            value: Math.floor(Math.random() * 6) + 1,
            suit: ['♠', '♥', '♦', '♣'][Math.floor(Math.random() * 4)],
            locked: false,
          }))
        );
        setRerollsLeft(3);
        setSelectedHand(null);
        setDamageDealt(null);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      {/* Header - Enemy Info */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">STAGE 1-1</h1>
            <p className="text-muted-foreground text-sm">숫자 6 무효</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-accent mb-2">{enemyHp}</div>
            <p className="text-muted-foreground text-xs">ENEMY HP</p>
          </div>
        </div>
        
        {/* Enemy HP Bar */}
        <div className="h-3 bg-card border border-card-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${Math.max(0, (enemyHp / 800) * 100)}%` }}
          />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-3 gap-8 mb-12">
        {/* Left Panel - Stats */}
        <div className="space-y-4">
          {/* Rerolls */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcwIcon className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Rerolls</span>
            </div>
            <div className="text-4xl font-black text-foreground">{rerollsLeft}</div>
          </div>

          {/* Gold */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Gold</span>
            </div>
            <div className="text-4xl font-black text-primary">${gold}</div>
          </div>

          {/* Health */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HeartIcon className="w-5 h-5 text-destructive" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Health</span>
            </div>
            <div className="text-4xl font-black text-destructive">{health}</div>
          </div>
        </div>

        {/* Center - Dice Area */}
        <div className="flex flex-col items-center justify-center">
          {/* Dices Grid */}
          <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm">
            {dices.slice(0, 3).map(dice => (
              <button
                key={dice.id}
                onClick={() => toggleLock(dice.id)}
                data-testid={`dice-${dice.id}`}
                className={`aspect-square rounded-lg font-black text-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 ${
                  dice.locked
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card text-foreground border-card-border hover:border-primary'
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div>{dice.value}</div>
                  <div className="text-xs mt-1">{dice.suit}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Lower Dices */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {dices.slice(3, 5).map(dice => (
              <button
                key={dice.id}
                onClick={() => toggleLock(dice.id)}
                data-testid={`dice-${dice.id}`}
                className={`aspect-square rounded-lg font-black text-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 ${
                  dice.locked
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card text-foreground border-card-border hover:border-primary'
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div>{dice.value}</div>
                  <div className="text-xs mt-1">{dice.suit}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Damage Display */}
          {damageDealt && (
            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-6xl font-black text-accent mb-2">{damageDealt}</div>
              <p className="text-primary text-sm font-bold uppercase">DAMAGE!</p>
            </div>
          )}
        </div>

        {/* Right Panel - Current Score & Actions */}
        <div className="space-y-4">
          {/* Score */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Your Score</p>
            <div className="text-4xl font-black text-primary mb-3">{gameScore}</div>
            {selectedHand && (
              <div className="text-xs text-muted-foreground">
                {selectedHand.name} x{selectedHand.multiplier + 1}
              </div>
            )}
          </div>

          {/* Roll Button */}
          <button
            onClick={rollDices}
            disabled={rerollsLeft === 0}
            data-testid="button-reroll"
            className="w-full bg-secondary hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground text-secondary-foreground font-black py-3 rounded-lg transition-colors duration-200"
          >
            REROLL
          </button>

          {/* Submit Button */}
          <button
            onClick={submitHand}
            disabled={!selectedHand || damageDealt !== null}
            data-testid="button-submit"
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            SUBMIT
          </button>
        </div>
      </div>

      {/* Hand Selection */}
      <div className="mb-8">
        <h2 className="text-sm font-black text-muted-foreground uppercase mb-4">Select Hand</h2>
        <div className="grid grid-cols-5 gap-2">
          {HAND_TYPES.map(hand => (
            <button
              key={hand.name}
              onClick={() => setSelectedHand(hand)}
              data-testid={`hand-${hand.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`p-2 rounded-lg border-2 transition-all duration-200 text-center ${
                selectedHand?.name === hand.name
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-card border-card-border text-foreground hover:border-primary'
              }`}
            >
              <div className="text-xs font-bold">{hand.name}</div>
              <div className="text-xs text-muted-foreground">x{hand.multiplier + 1}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-muted-foreground text-xs">
        <p>Click dices to lock • Select a hand and click SUBMIT</p>
      </div>
    </div>
  );
}
