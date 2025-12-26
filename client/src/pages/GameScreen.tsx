import { useState, useMemo } from 'react';
import { HeartIcon, RotateCcwIcon, CheckCircleIcon, Crown } from 'lucide-react';
import DiceBoard from '@/components/Dice3D';

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

// 고정된 수트 정의
const FIXED_SUITS = ['None', '♠', '♦', '♥', '♣'];

export default function GameScreen() {
  const [dices, setDices] = useState<Dice[]>(
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 6) + 1,
      suit: FIXED_SUITS[i],
      locked: false,
    }))
  );

  const [rerollsLeft, setRerollsLeft] = useState(3);
  const [gold, setGold] = useState(8);
  const [health, setHealth] = useState(3);
  const [gameScore, setGameScore] = useState(0);
  const [enemyHp, setEnemyHp] = useState(800);
  const [damageDealt, setDamageDealt] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  // 족보에 사용되는 주사위 개수 반환 함수
  const getActiveDiceCount = (handName: string, lockedDices: Dice[]): number => {
    const counts = countValues(lockedDices.map(d => d.value));
    const sortedCounts = Object.values(counts).sort((a, b) => b - a);

    switch (handName) {
      case 'Yahtzee':
      case 'Straight Flush':
      case 'Straight 5':
      case 'Full House':
      case 'Flush':
        return lockedDices.length;
      case 'Four of a Kind':
        return 4;
      case 'Two Pair':
        return 4;
      case 'Triple':
        return 3;
      case 'Straight 4':
        return 4;
      case 'Pair':
        return 2;
      case 'Straight 3':
        return 3;
      case 'High Dice':
        return 1;
      default:
        return lockedDices.length;
    }
  };

  // 족보에 사용되는 주사위들만 점수 계산
  const getActiveDicesSum = (handName: string, lockedDices: Dice[]): number => {
    if (lockedDices.length === 0) return 0;

    const values = lockedDices.map(d => d.value).sort((a, b) => b - a);
    const counts = countValues(lockedDices.map(d => d.value));

    switch (handName) {
      case 'Yahtzee':
      case 'Straight Flush':
      case 'Straight 5':
      case 'Full House':
      case 'Flush':
        return values.reduce((a, b) => a + b, 0);
      case 'Four of a Kind': {
        const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sortedCounts[0]?.[1] >= 4) {
          const num = parseInt(sortedCounts[0][0]);
          return num * 4;
        }
        return 0;
      }
      case 'Two Pair': {
        const pairs = Object.entries(counts).filter(([_, c]) => c >= 2).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
        if (pairs.length >= 2) {
          return (parseInt(pairs[0][0]) * 2) + (parseInt(pairs[1][0]) * 2);
        }
        return 0;
      }
      case 'Triple': {
        const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sortedCounts[0]?.[1] >= 3) {
          const num = parseInt(sortedCounts[0][0]);
          return num * 3;
        }
        return 0;
      }
      case 'Straight 4':
        return values.slice(0, 4).reduce((a, b) => a + b, 0);
      case 'Pair': {
        const sortedCounts = Object.entries(counts).filter(([_, c]) => c >= 2).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
        if (sortedCounts[0]) {
          const num = parseInt(sortedCounts[0][0]);
          return num * 2;
        }
        return 0;
      }
      case 'Straight 3':
        return values.slice(0, 3).reduce((a, b) => a + b, 0);
      case 'High Dice':
        return values[0] || 0;
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  };

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
      setRolling(true);
      setTimeout(() => {
        setDices(
          dices.map(d =>
            d.locked
              ? d
              : {
                  ...d,
                  value: Math.floor(Math.random() * 6) + 1,
                  // suit는 고정값이므로 변경하지 않음
                }
          )
        );
        setRolling(false);
        setRerollsLeft(rerollsLeft - 1);
      }, 1000);
    }
  };

  // 현재 표시용 정보
  const lockedDices = useMemo(() => dices.filter(d => d.locked), [dices]);
  const activeDicesSum = useMemo(() => {
    if (!selectedHand || lockedDices.length === 0) return 0;
    return getActiveDicesSum(selectedHand.name, lockedDices);
  }, [selectedHand, lockedDices]);

  const calculateScore = () => {
    if (!selectedHand) return 0;
    const multiplier = selectedHand.multiplier || 0;
    return activeDicesSum * (multiplier + 1);
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
            suit: FIXED_SUITS[i],
            locked: false,
          }))
        );
        setRerollsLeft(3);
        setDamageDealt(null);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans">
      {/* Header - Enemy Info */}
      <div className="mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6 h-[500px]">
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

        {/* Center - 3D Dice Board */}
        <div className="lg:col-span-2 relative">
          <DiceBoard dices={dices} onLockToggle={toggleLock} rolling={rolling} />
          
          {/* Damage Display Overlay */}
          {damageDealt && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 pointer-events-none animate-in fade-in duration-300">
              <div className="text-center">
                <div className="text-8xl font-black text-accent mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">{damageDealt}</div>
                <p className="text-primary text-2xl font-bold uppercase tracking-widest">DAMAGE!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel - Controls & Locked Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Locked Dices (2D view for clarity) */}
         <div className="col-span-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Locked Dices</h3>
            <div className="flex gap-3">
              {dices.map(dice => (
                <div
                  key={dice.id}
                  onClick={() => toggleLock(dice.id)}
                  className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dice.locked
                      ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(255,165,0,0.5)] scale-105'
                      : 'bg-card text-muted-foreground border-card-border opacity-50 hover:opacity-100'
                  }`}
                >
                  <span className="text-xl font-bold">{dice.value}</span>
                  <span className="text-xs">{dice.suit}</span>
                </div>
              ))}
            </div>
         </div>

         {/* Actions Panel */}
         <div className="space-y-4">
          {/* Auto-Selected Hand */}
          <div className="bg-card border-2 border-primary rounded-lg p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Current Hand</p>
            {selectedHand ? (
              <>
                <div className="text-2xl font-black text-primary mb-1">{selectedHand.name}</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Dice Sum:</span>
                    <span className="font-black text-foreground">{activeDicesSum}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Multiplier:</span>
                    <span className="font-black text-primary">x{selectedHand.multiplier + 1}</span>
                  </div>
                  <div className="pt-2 border-t border-card-border">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground">Damage:</span>
                      <span className="text-lg font-black text-accent">{calculateScore()}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">Lock dice to see hand</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
             {/* Roll Button */}
            <button
              onClick={rollDices}
              disabled={rerollsLeft === 0 || rolling}
              data-testid="button-reroll"
              className="bg-secondary hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground text-secondary-foreground font-black py-3 rounded-lg transition-colors duration-200"
            >
              REROLL
            </button>

            {/* Submit Button */}
            <button
              onClick={submitHand}
              disabled={!selectedHand || damageDealt !== null || rolling}
              data-testid="button-submit"
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              SUBMIT
            </button>
          </div>
         </div>
      </div>

      {/* Footer */}
      <div className="text-center text-muted-foreground text-xs mt-8">
        <p>Click 3D dice or 2D icons to lock • REROLL to shake board</p>
      </div>
    </div>
  );
}
