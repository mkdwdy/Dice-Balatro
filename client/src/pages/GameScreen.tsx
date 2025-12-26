import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { HeartIcon, RotateCcwIcon, CheckCircleIcon, Crown, Zap } from 'lucide-react';
import DiceBoard from '@/components/Dice3D';
import type { GameSession, Dice } from '@shared/schema';

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

function getActiveDicesSum(handName: string, lockedDices: Dice[]): number {
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
}

export default function GameScreen() {
  const [match, params] = useRoute('/game/:id');
  const [_, setLocation] = useLocation();
  const [game, setGame] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [dices, setDices] = useState<Dice[]>([]);
  const [damageDealt, setDamageDealt] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  
  const [isCharging, setIsCharging] = useState(false);
  const [chargePower, setChargePower] = useState(0);
  const [rollPower, setRollPower] = useState(1);
  const chargeStartRef = useRef<number>(0);
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_CHARGE_TIME = 1500;

  useEffect(() => {
    if (match && params?.id) {
      fetchGame(params.id);
    }
  }, [match, params?.id]);

  useEffect(() => {
    if (game) {
      if (!rolling) {
        setDices(game.dices as Dice[]);
      }
      
      if (game.gameState === 'shop') {
        setLocation(`/shop/${game.id}`);
      } else if (game.gameState === 'stage_select') {
        setLocation(`/stage-select/${game.id}`);
      }
    }
  }, [game, rolling]);

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

  const toggleLock = (id: number, detectedValue: number) => {
    setDices(dices.map(d => {
      if (d.id === id) {
        return { ...d, locked: !d.locked, value: detectedValue };
      }
      return d;
    }));
  };

  const startCharging = useCallback(() => {
    if (!game || game.rerollsLeft <= 0 || rolling) return;
    
    setIsCharging(true);
    setChargePower(0);
    chargeStartRef.current = Date.now();
    
    chargeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - chargeStartRef.current;
      const power = Math.min(elapsed / MAX_CHARGE_TIME, 1);
      setChargePower(power);
    }, 16);
  }, [game, rolling]);

  const releaseCharge = useCallback(async () => {
    if (!isCharging || !game) return;
    
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
      chargeIntervalRef.current = null;
    }
    
    const finalPower = chargePower;
    setIsCharging(false);
    setChargePower(0);
    setRollPower(finalPower);
    
    setRolling(true);
    
    const unlockedDices = dices.map(d => d.locked ? d : { ...d, locked: false });
    setDices(unlockedDices);
    
    try {
      const response = await fetch(`/api/games/${game.id}/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lockedDices: dices.filter(d => d.locked).map(d => ({ id: d.id, value: d.value }))
        }),
      });
      const updatedGame = await response.json();
      
      setTimeout(() => {
        setGame({ ...updatedGame, dices: unlockedDices });
        setRolling(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to roll dices:', error);
      setRolling(false);
    }
  }, [isCharging, game, chargePower, dices]);

  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current);
      }
    };
  }, []);

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

  const submitHand = async () => {
    if (!selectedHand || !game) return;

    const damage = calculateScore();
    setDamageDealt(damage);

    try {
      const response = await fetch(`/api/games/${game.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ damage }),
      });
      const updatedGame = await response.json();

      setTimeout(() => {
        setGame(updatedGame);
        setDamageDealt(null);
      }, 1500);
    } catch (error) {
      console.error('Failed to submit hand:', error);
      setDamageDealt(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game...</p>
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
    <div className="h-screen bg-background text-foreground p-4 font-sans flex flex-col overflow-hidden">
      {/* Header - Enemy Info */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-primary" data-testid="text-stage">
              STAGE {game.currentStage}-{game.currentRound}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-accent" data-testid="text-enemy-hp">{game.enemyHp}</div>
            <p className="text-muted-foreground text-xs">ENEMY HP</p>
          </div>
        </div>
        
        <div className="h-2 bg-card border border-card-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${Math.max(0, (game.enemyHp / game.maxEnemyHp) * 100)}%` }}
          />
        </div>
      </div>

      {/* Main Content - Flexible height */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Left Panel - Stats */}
        <div className="hidden lg:flex flex-col gap-3">
          <div className="bg-card border border-card-border rounded-lg p-3 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcwIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Rerolls</span>
            </div>
            <div className="text-3xl font-black text-foreground" data-testid="text-rerolls">{game.rerollsLeft}</div>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-3 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Gold</span>
            </div>
            <div className="text-3xl font-black text-primary" data-testid="text-gold">${game.gold}</div>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-3 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <HeartIcon className="w-4 h-4 text-destructive" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Health</span>
            </div>
            <div className="text-3xl font-black text-destructive" data-testid="text-health">{game.health}</div>
          </div>
        </div>

        {/* Center - 3D Dice Board */}
        <div className="lg:col-span-3 relative min-h-0">
          <DiceBoard dices={dices} onLockToggle={toggleLock} rolling={rolling} power={rollPower} />
          
          {damageDealt && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 pointer-events-none animate-in fade-in duration-300">
              <div className="text-center">
                <div className="text-7xl font-black text-accent mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]" data-testid="text-damage">{damageDealt}</div>
                <p className="text-primary text-xl font-bold uppercase tracking-widest">DAMAGE!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel - Controls */}
      <div className="flex-shrink-0 mt-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mobile Stats (hidden on desktop) */}
          <div className="lg:hidden flex gap-2 justify-center">
            <div className="bg-card border border-card-border rounded px-3 py-1 flex items-center gap-2">
              <RotateCcwIcon className="w-4 h-4 text-primary" />
              <span className="font-bold">{game.rerollsLeft}</span>
            </div>
            <div className="bg-card border border-card-border rounded px-3 py-1 flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-bold">${game.gold}</span>
            </div>
            <div className="bg-card border border-card-border rounded px-3 py-1 flex items-center gap-2">
              <HeartIcon className="w-4 h-4 text-destructive" />
              <span className="font-bold">{game.health}</span>
            </div>
          </div>

          {/* Locked Dices */}
          <div className="md:col-span-2">
            <div className="flex gap-2 justify-center md:justify-start">
              {dices.map(dice => (
                <div
                  key={dice.id}
                  onClick={() => toggleLock(dice.id, dice.value)}
                  data-testid={`dice-2d-${dice.id}`}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dice.locked
                      ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(255,165,0,0.5)] scale-105'
                      : 'bg-card text-muted-foreground border-card-border opacity-50 hover:opacity-100'
                  }`}
                >
                  <span className="text-lg font-bold">{dice.value}</span>
                  <span className="text-[10px]">{dice.suit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hand Info & Actions */}
          <div className="flex gap-2 items-center justify-center md:justify-end">
            {selectedHand && (
              <div className="bg-card border border-primary rounded-lg px-3 py-2 text-center">
                <div className="text-sm font-black text-primary" data-testid="text-hand-name">{selectedHand.name}</div>
                <div className="text-lg font-black text-accent" data-testid="text-calculated-damage">{calculateScore()} DMG</div>
              </div>
            )}

            <div className="relative">
              <button
                onMouseDown={startCharging}
                onMouseUp={releaseCharge}
                onMouseLeave={() => isCharging && releaseCharge()}
                onTouchStart={startCharging}
                onTouchEnd={releaseCharge}
                disabled={game.rerollsLeft === 0 || rolling}
                data-testid="button-reroll"
                className={`relative overflow-hidden font-black py-2 px-4 rounded-lg transition-all select-none ${
                  game.rerollsLeft === 0 || rolling
                    ? 'bg-muted text-muted-foreground'
                    : isCharging
                    ? 'bg-accent text-accent-foreground scale-105'
                    : 'bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                }`}
              >
                {isCharging && (
                  <div 
                    className="absolute inset-0 bg-primary/50 transition-all"
                    style={{ width: `${chargePower * 100}%` }}
                  />
                )}
                <span className="relative flex items-center gap-1">
                  {isCharging ? <Zap className="w-4 h-4 animate-pulse" /> : <RotateCcwIcon className="w-4 h-4" />}
                  {isCharging ? `${Math.round(chargePower * 100)}%` : 'HOLD'}
                </span>
              </button>
              {!isCharging && !rolling && game.rerollsLeft > 0 && (
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap">
                  Hold longer = stronger
                </span>
              )}
            </div>

            <button
              onClick={submitHand}
              disabled={!selectedHand || damageDealt !== null || rolling}
              data-testid="button-submit"
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black py-2 px-4 rounded-lg transition-colors flex items-center gap-1"
            >
              <CheckCircleIcon className="w-4 h-4" />
              SUBMIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
