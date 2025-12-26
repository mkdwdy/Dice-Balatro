import { useState, useMemo } from 'react';
import { HeartIcon, RotateCcwIcon, CheckCircleIcon, Crown } from 'lucide-react';

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
  { name: 'Yahtzee', multiplier: 30, condition: 'Same 5 numbers' },
  { name: 'Straight Flush', multiplier: 50, condition: '5 in a row + same suit' },
  { name: 'Four of a Kind', multiplier: 5, condition: 'Same 4 numbers' },
  { name: 'Full House', multiplier: 4, condition: 'Triple + Pair' },
  { name: 'Flush', multiplier: 10, condition: '5 same suits' },
  { name: 'Straight 5', multiplier: 4, condition: '5 numbers in a row' },
  { name: 'Triple', multiplier: 3, condition: 'Same 3 numbers' },
  { name: 'Two Pair', multiplier: 2, condition: 'Same 2 numbers x2' },
  { name: 'Straight 4', multiplier: 2, condition: '4 numbers in a row' },
  { name: 'Pair', multiplier: 1, condition: 'Same 2 numbers' },
  { name: 'Straight 3', multiplier: 1, condition: '3 numbers in a row' },
  { name: 'High Dice', multiplier: 0, condition: '1 highest dice' },
];

// 유틸리티 함수들
function countValues(values: number[]): Record<number, number> {
  return values.reduce((acc, v) => ({ ...acc, [v]: ((acc as Record<number, number>)[v] || 0) + 1 }), {} as Record<number, number>);
}

function checkStraight(values: number[], length: number): boolean {
  if (values.length < length) return false;
  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
  for (let i = 0; i <= uniqueValues.length - length; i++) {
    let isStraight = true;
    for (let j = 0; j < length - 1; j++) {
      if (uniqueValues[i + j + 1] - uniqueValues[i + j] !== 1) {
        isStraight = false;
        break;
      }
    }
    if (isStraight) return true;
  }
  return false;
}

// 핸드 검증 함수들
const handChecks: Record<string, (dices: Dice[]) => boolean> = {
  'Yahtzee': (dices: Dice[]) => {
    const values = dices.map(d => d.value);
    return values.length === 5 && Array.from(new Set(values)).length === 1;
  },
  'Straight Flush': (dices: Dice[]) => {
    const values = dices.map(d => d.value);
    const suits = dices.map(d => d.suit);
    return Array.from(new Set(suits)).length === 1 && checkStraight(values, 5);
  },
  'Four of a Kind': (dices: Dice[]) => {
    const counts = countValues(dices.map(d => d.value));
    return Object.values(counts).some(c => c >= 4);
  },
  'Full House': (dices: Dice[]) => {
    const counts = countValues(dices.map(d => d.value));
    const sorted = Object.values(counts).sort((a, b) => b - a);
    return sorted.length >= 2 && sorted[0] >= 3 && sorted[1] >= 2;
  },
  'Flush': (dices: Dice[]) => {
    const suits = dices.map(d => d.suit);
    return dices.length >= 5 && Array.from(new Set(suits)).length === 1;
  },
  'Straight 5': (dices: Dice[]) => {
    return checkStraight(dices.map(d => d.value), 5);
  },
  'Triple': (dices: Dice[]) => {
    const counts = countValues(dices.map(d => d.value));
    return Object.values(counts).some(c => c >= 3);
  },
  'Two Pair': (dices: Dice[]) => {
    const counts = countValues(dices.map(d => d.value));
    const pairs = Object.values(counts).filter(c => c >= 2);
    return pairs.length >= 2;
  },
  'Straight 4': (dices: Dice[]) => {
    return checkStraight(dices.map(d => d.value), 4);
  },
  'Pair': (dices: Dice[]) => {
    const counts = countValues(dices.map(d => d.value));
    return Object.values(counts).some(c => c >= 2);
  },
  'Straight 3': (dices: Dice[]) => {
    return checkStraight(dices.map(d => d.value), 3);
  },
  'High Dice': (dices: Dice[]) => {
    return dices.length > 0;
  },
};

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
  const [gameScore, setGameScore] = useState(0);
  const [enemyHp, setEnemyHp] = useState(800);
  const [damageDealt, setDamageDealt] = useState<number | null>(null);

  // 자동 핸드 선택 로직
  const selectedHand = useMemo(() => {
    const lockedDices = dices.filter(d => d.locked);
    if (lockedDices.length === 0) return null;

    for (const handType of HAND_TYPES) {
      if (handChecks[handType.name as keyof typeof handChecks]?.(lockedDices)) {
        return handType;
      }
    }
    return null;
  }, [dices]);

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
    const lockedDices = dices.filter(d => d.locked);
    const sum = lockedDices.reduce((acc, d) => acc + d.value, 0);
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
        setDamageDealt(null);
      }, 1500);
    }
  };

  const lockedCount = dices.filter(d => d.locked).length;

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
          {/* Locked Count */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Locked</p>
            <div className="text-4xl font-black text-primary mb-3">{lockedCount}/5</div>
          </div>

          {/* Auto-Selected Hand */}
          <div className="bg-card border-2 border-primary rounded-lg p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Current Hand</p>
            {selectedHand ? (
              <>
                <div className="text-2xl font-black text-primary mb-2">{selectedHand.name}</div>
                <div className="text-xs text-muted-foreground mb-3">
                  x{selectedHand.multiplier + 1} multiplier
                </div>
                <div className="text-sm font-bold text-accent">
                  Damage: {calculateScore()}
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">Lock dice to see hand</div>
            )}
          </div>

          {/* Roll Button */}
          <button
            onClick={rollDices}
            disabled={rerollsLeft === 0}
            data-testid="button-reroll"
            className="w-full bg-secondary hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground text-secondary-foreground font-black py-3 rounded-lg transition-colors duration-200"
          >
            REROLL ({rerollsLeft})
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

      {/* Footer */}
      <div className="text-center text-muted-foreground text-xs">
        <p>Lock dice to auto-select the best hand • Click SUBMIT to attack</p>
      </div>
    </div>
  );
}
