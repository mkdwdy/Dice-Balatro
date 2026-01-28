import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { HeartIcon, RotateCcwIcon, CheckCircleIcon, Crown, Zap, RefreshCw, List, Sparkles, Wand2, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import DiceBoard from '@/components/Dice3D';
import DiceListModal from '@/components/DiceListModal';
import HandUpgradeModal from '@/components/HandUpgradeModal';
import DiceEnchantModal from '@/components/DiceEnchantModal';
import type { GameSession, Dice, DeckDice } from '@shared/schema';
import { isDeckDiceArray, isDiceArray } from '@shared/schema';
import type { SequentialActivationResult, DiceActivationResult } from '@shared/diceActivation';

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
  const [waitingForNewRound, setWaitingForNewRound] = useState(true);
  
  const [isCharging, setIsCharging] = useState(false);
  const [chargePower, setChargePower] = useState(0);
  const [rollPower, setRollPower] = useState(1);
  const chargeStartRef = useRef<number>(0);
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dicesRef = useRef<Dice[]>([]);
  const settledCountRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_CHARGE_TIME = 1500;

  // 순차 발동 애니메이션 상태
  const [isActivating, setIsActivating] = useState(false);
  const [activatingDiceId, setActivatingDiceId] = useState<number | null>(null);
  const [activationOrder, setActivationOrder] = useState<number>(0);
  const [activationResults, setActivationResults] = useState<DiceActivationResult[]>([]);
  const [currentActivationIndex, setCurrentActivationIndex] = useState<number>(0);
  const [cumulativeChips, setCumulativeChips] = useState<number>(0);
  const [cumulativeMultiplier, setCumulativeMultiplier] = useState<number>(0);
  const [currentDamage, setCurrentDamage] = useState<number>(0);

  // 모달 상태
  const [showDiceList, setShowDiceList] = useState(false);
  const [showHandUpgrade, setShowHandUpgrade] = useState(false);
  const [showDiceEnchant, setShowDiceEnchant] = useState(false);
  
  // 개발 모드 테스트 도구 상태
  // 테스트 패널 상태를 localStorage에 저장하여 페이지 새로고침 후에도 유지
  const [showTestPanel, setShowTestPanel] = useState(() => {
    const saved = localStorage.getItem('testPanelOpen');
    return saved === 'true';
  });

  // 테스트 패널 상태 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('testPanelOpen', showTestPanel.toString());
  }, [showTestPanel]);
  const isDevMode = import.meta.env.DEV;

  useEffect(() => {
    if (match && params?.id) {
      fetchGame(params.id);
    }
  }, [match, params?.id]);

  useEffect(() => {
    if (game) {
      if (game.gameState === 'shop') {
        setLocation(`/shop/${game.id}`);
      } else if (game.gameState === 'stage_select') {
        setLocation(`/stage-select/${game.id}`);
      }
    }
  }, [game?.gameState, game?.id]);

  // diceDeck이 있지만 dices가 비어있으면 주사위 생성
  useEffect(() => {
    if (game && game.gameState === 'combat' && dices.length === 0) {
      const deck = isDeckDiceArray(game.diceDeck) ? game.diceDeck : [];
      if (deck.length > 0) {
        const newDices = deck.map((deckDice: DeckDice) => {
          const face = deckDice.faces[deckDice.currentTopFace] || deckDice.faces[0];
          return {
            id: deckDice.id,
            value: face.value,
            suit: face.suit,
            locked: false,
          };
        });
        setDices(newDices);
        dicesRef.current = newDices;
      }
    }
  }, [game?.diceDeck, game?.gameState, dices.length]);

  const fetchGame = async (id: string) => {
    try {
      const response = await fetch(`/api/games/${id}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch game' }));
        throw new Error(error.error || 'Failed to fetch game');
      }
      const data = await response.json();
      setGame(data);
      
      // 게임을 불러올 때 주사위도 동기화
      if (data.gameState === 'combat') {
        const deck = isDeckDiceArray(data.diceDeck) ? data.diceDeck : [];
        const currentDices = isDiceArray(data.dices) ? data.dices : [];
        
        if (deck.length > 0 && currentDices.length === 0) {
          // 덱이 있지만 주사위가 없으면 덱에서 생성
          const newDices = deck.map((deckDice: DeckDice) => {
            const face = deckDice.faces[deckDice.currentTopFace] || deckDice.faces[0];
            return {
              id: deckDice.id,
              value: face.value,
              suit: face.suit,
              locked: false,
            };
          });
          setDices(newDices);
          dicesRef.current = newDices;
        } else if (currentDices.length > 0) {
          // 주사위가 있으면 그대로 사용
          setDices(currentDices);
          dicesRef.current = currentDices;
        }
      }
    } catch (error) {
      console.error('Failed to fetch game:', error);
      toast.error('게임을 불러오는데 실패했습니다', {
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      });
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

  const toggleLock = useCallback((id: number, detectedValue: number) => {
    setDices(prevDices => prevDices.map(d => {
      if (d.id === id) {
        return { ...d, locked: !d.locked, value: detectedValue };
      }
      return d;
    }));
  }, []);

  const handleValueSettled = useCallback((id: number, value: number) => {
    setDices(prevDices => {
      const updated = prevDices.map(d => {
        if (d.id === id && !d.locked) {
          return { ...d, value };
        }
        return d;
      });
      dicesRef.current = updated;
      
      // 정착된 주사위 카운트 증가
      settledCountRef.current += 1;
      
      // 모든 주사위가 정착되었는지 확인 (잠금 해제된 주사위만 카운트)
      const unlockedCount = updated.filter(d => !d.locked).length;
      if (settledCountRef.current >= unlockedCount && unlockedCount > 0) {
        // 이전 동기화 타이머 취소
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        
        // 약간의 지연 후 동기화 (모든 주사위가 완전히 정착되었는지 확인)
        syncTimeoutRef.current = setTimeout(() => {
          const currentDices = dicesRef.current;
          const gameId = window.location.pathname.split('/').pop();
          
          // 모든 주사위가 유효한 값을 가지고 있는지 확인 (잠긴 주사위 포함)
          if (currentDices.length > 0 && currentDices.every(d => d.value > 0 && d.value <= 6) && gameId) {
            fetch(`/api/games/${gameId}/sync-dice-deck`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dices: currentDices }),
            })
              .then(res => {
                if (!res.ok) {
                  return res.json().then(err => { throw new Error(err.error || 'Sync failed'); });
                }
                return res.json();
              })
              .then(syncedGame => {
                setGame(syncedGame);
                // 동기화된 주사위로 상태 업데이트
                if (isDiceArray(syncedGame.dices) && syncedGame.dices.length > 0) {
                  setDices(syncedGame.dices);
                  dicesRef.current = syncedGame.dices;
                }
              })
              .catch(err => {
                console.error('Failed to sync dice deck:', err);
              });
          }
          
          // 카운터 리셋
          settledCountRef.current = 0;
          syncTimeoutRef.current = null;
        }, 500); // 모든 주사위가 정착된 후 약간의 지연
      }
      
      return updated;
    });
  }, []);

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
    
    const finalPower = Math.max(chargePower, 0.5);
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

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to roll dice' }));
        throw new Error(error.error || 'Failed to roll dice');
      }

      const updatedGame = await response.json();
      
      // 주사위 상태 업데이트 (물리 시뮬레이션 전 초기값)
      setDices(unlockedDices);
      // dicesRef는 handleValueSettled에서 업데이트되므로 여기서 덮어쓰지 않음
      
      // 정착 카운터 리셋
      settledCountRef.current = 0;
      
      // 이전 동기화 타이머가 있으면 취소
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      
      setTimeout(() => {
        setRolling(false);
        // 동기화는 handleValueSettled에서 모든 주사위가 정착된 후 자동으로 실행됨
      }, 1500);
    } catch (error) {
      console.error('Failed to roll dices:', error);
      setRolling(false);
      toast.error('주사위 굴리기에 실패했습니다', {
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      });
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
    if (!selectedHand || !game || lockedDices.length === 0) return 0;
    const baseMultiplier = selectedHand.multiplier || 0;
    
    // 족보 업그레이드 보너스 적용
    const handUpgrades = (game.handUpgrades as Record<string, number>) || {};
    const upgradeBonus = handUpgrades[selectedHand.name] || 0;
    const totalMultiplier = baseMultiplier + upgradeBonus;
    
    // 발라트로 방식: 족보에 사용된 주사위만 발동되므로 족보에 사용된 주사위의 합을 사용
    const totalChips = activeDicesSum;
    
    // 조커 효과는 예측에 포함하지 않음 (서버에서 계산)
    return Math.round(totalChips * (totalMultiplier + 1));
  };

  const submitHand = async () => {
    if (!selectedHand || !game || lockedDices.length === 0) return;

    // 순차 발동 시스템: 잠긴 주사위 정보와 족보 이름을 서버로 전달
    // 서버에서 순차 발동 계산 후 데미지 반환
    try {
      const response = await fetch(`/api/games/${game.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockedDices: lockedDices, // 잠긴 주사위 배열 (순차 발동용)
          handName: selectedHand.name, // 족보 이름
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to submit hand' }));
        throw new Error(error.error || 'Failed to submit hand');
      }

      const result = await response.json();
      
      // activationResult는 게임 세션의 일부가 아니므로 분리
      const activationResult: SequentialActivationResult = result.activationResult;
      const { activationResult: _, ...gameSessionData } = result;
      const updatedGame = gameSessionData as GameSession;

      // 디버깅: 골드 업데이트 확인
      console.log(`[CLIENT DEBUG] Gold before: ${game.gold}, Gold after: ${updatedGame.gold}`);
      console.log(`[CLIENT DEBUG] Game state: ${updatedGame.gameState}`);
      console.log(`[CLIENT DEBUG] Enemy HP: ${updatedGame.enemyHp}`);
      if (updatedGame.gameState === 'shop') {
        console.log(`[CLIENT DEBUG] Shop entered! Gold should be updated.`);
        // 상점으로 이동할 때 골드를 즉시 업데이트 (애니메이션 전에)
        setGame(updatedGame);
      }
      console.log(`[CLIENT DEBUG] Hand: ${selectedHand.name}`);
      console.log(`[CLIENT DEBUG] Total locked dice: ${lockedDices.length}`);
      console.log(`[CLIENT DEBUG] Locked dice IDs: ${lockedDices.map(d => d.id).join(', ')}`);
      console.log(`[CLIENT DEBUG] Locked dice values: ${lockedDices.map(d => `${d.id}:${d.value}`).join(', ')}`);
      console.log(`[CLIENT DEBUG] Activation result activations count: ${activationResult?.activations?.length || 0}`);
      console.log(`[CLIENT DEBUG] Activation result dice IDs: ${activationResult?.activations?.map(a => a.dice.id).join(', ') || 'none'}`);
      console.log(`[CLIENT DEBUG] Activation result dice values: ${activationResult?.activations?.map(a => `${a.dice.id}:${a.dice.value}`).join(', ') || 'none'}`);
      
      // 서버 응답 전체 확인
      console.log(`[CLIENT DEBUG] Full server response:`, JSON.stringify(result, null, 2));

      if (!activationResult || !activationResult.activations) {
        // 순차 발동 결과가 없으면 기본 처리
        const damage = activationResult?.finalDamage || 0;
        setDamageDealt(damage);
        // 골드가 업데이트되었으면 즉시 반영 (상점으로 이동하는 경우)
        if (updatedGame.gameState === 'shop') {
          setGame(updatedGame);
        }
        setTimeout(() => {
          setGame(updatedGame);
          setDamageDealt(null);
          setDices([]);
          setWaitingForNewRound(true);
        }, 1500);
        return;
      }

      // 순차 발동 애니메이션 시작
      setIsActivating(true);
      setActivationResults(activationResult.activations);
      setCurrentActivationIndex(0);
      setActivationOrder(0);
      
      // 초기값 설정 (족보 Multiplier)
      const baseMultiplier = selectedHand.multiplier || 0;
      const handUpgrades = (game.handUpgrades as Record<string, number>) || {};
      const upgradeBonus = handUpgrades[selectedHand.name] || 0;
      const initialMultiplier = baseMultiplier + upgradeBonus;
      
      setCumulativeChips(0);
      setCumulativeMultiplier(initialMultiplier);
      setCurrentDamage(0);

      // 조커 수에 따른 애니메이션 속도 계산
      // 조커가 많을수록 빠르게 (최소 300ms, 최대 800ms)
      const jokers = Array.isArray(game.jokers) ? game.jokers : [];
      const jokerCount = jokers.length;
      const baseDuration = 800; // 기본 800ms
      const minDuration = 300; // 최소 300ms
      const maxJokers = 10; // 조커 10개 이상이면 최소 속도
      const durationPerDice = Math.max(
        minDuration,
        baseDuration - (jokerCount / maxJokers) * (baseDuration - minDuration)
      );

      // 순차 발동 애니메이션 실행
      const activations = activationResult.activations;
      let currentIndex = 0;
      let runningChips = 0;
      let runningMultiplier = initialMultiplier;
      
      const playActivation = () => {
        if (currentIndex >= activations.length) {
          // 모든 발동 완료 - 최종 배수 적용
          let finalMult = runningMultiplier;
          for (const activation of activations) {
            for (const effect of activation.jokerEffects) {
              if (effect.multMultiplier !== 1) {
                finalMult *= effect.multMultiplier;
              }
            }
          }
          
          // 최종 데미지 계산
          const finalDmg = Math.round(runningChips * (finalMult + 1));
          
          // 최종 값으로 UI 업데이트
          setCumulativeMultiplier(finalMult);
          setCurrentDamage(finalDmg);
          
          // 잠시 후 애니메이션 종료
          setTimeout(() => {
            setIsActivating(false);
            setActivatingDiceId(null);
            setActivationOrder(0);
            
            // 최종 데미지 표시
            setDamageDealt(finalDmg);
            
            setTimeout(() => {
              setGame(updatedGame);
              setDamageDealt(null);
              setDices([]);
              setWaitingForNewRound(true);
              setActivationResults([]);
              setCurrentActivationIndex(0);
              setCumulativeChips(0);
              setCumulativeMultiplier(0);
              setCurrentDamage(0);
            }, 1500);
          }, 500); // 최종 배수 적용을 보여주기 위한 짧은 지연
          return;
        }

        const activation = activations[currentIndex];
        setActivatingDiceId(activation.dice.id);
        setActivationOrder(currentIndex + 1);
        setCurrentActivationIndex(currentIndex);

        // 누적 Chips와 Multiplier 업데이트
        runningChips += activation.chips;
        runningMultiplier += activation.multiplier;
        
        // 현재까지의 데미지 계산 (배수는 나중에 적용하므로 여기서는 누적 Multiplier만 사용)
        const currentDmg = Math.round(runningChips * (runningMultiplier + 1));
        
        setCumulativeChips(runningChips);
        setCumulativeMultiplier(runningMultiplier);
        setCurrentDamage(currentDmg);

        // 다음 발동으로 진행
        currentIndex++;
        setTimeout(playActivation, durationPerDice);
      };

      // 첫 번째 발동 시작
      playActivation();
    } catch (error) {
      console.error('Failed to submit hand:', error);
      setDamageDealt(null);
      toast.error('핸드 제출에 실패했습니다', {
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      });
    }
  };

  const startNewRound = useCallback(async () => {
    if (!game) return;
    
    setWaitingForNewRound(false);
    setRolling(true);
    setRollPower(0.5);
    
    try {
      const response = await fetch(`/api/games/${game.id}/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockedDices: [] }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to start new round' }));
        throw new Error(error.error || 'Failed to start new round');
      }

      const updatedGame = await response.json();
      
      // 서버에서 반환된 주사위가 있으면 사용, 없으면 덱에서 생성
      let newDices: Dice[] = [];
      
      // 먼저 서버에서 반환된 주사위 확인
      if (isDiceArray(updatedGame.dices) && updatedGame.dices.length > 0) {
        newDices = updatedGame.dices;
      } else {
        // 덱에서 초기 주사위 생성
        const deck = isDeckDiceArray(updatedGame.diceDeck) ? updatedGame.diceDeck : [];
          if (deck.length > 0) {
          newDices = deck.map((deckDice: DeckDice) => {
            const faceIndex = deckDice.currentTopFace >= 0 && deckDice.currentTopFace < 6 
              ? deckDice.currentTopFace 
              : 0;
            const face = deckDice.faces[faceIndex] || deckDice.faces[0];
            return {
              id: deckDice.id,
              value: face.value,
              suit: face.suit,
              locked: false,
            };
          });
        } else {
          // 덱도 없으면 기본 주사위 생성
          newDices = Array.from({ length: 5 }, (_, i) => ({
            id: i,
            value: i + 1,
            suit: ['None', '♠', '♦', '♥', '♣'][i] as Dice['suit'],
            locked: false,
          }));
        }
      }
      setDices(newDices);
      dicesRef.current = newDices;
      // 주사위를 포함한 게임 상태 업데이트
      setGame({ ...updatedGame, dices: newDices });
      
      // 정착 카운터 리셋
      settledCountRef.current = 0;
      
      // 이전 동기화 타이머가 있으면 취소
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      
      setTimeout(() => {
        setRolling(false);
        // 동기화는 handleValueSettled에서 모든 주사위가 정착된 후 자동으로 실행됨
      }, 1500);
    } catch (error) {
      console.error('Failed to start new round:', error);
      setRolling(false);
      toast.error('새 라운드 시작에 실패했습니다', {
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      });
    }
  }, [game]);

  // 족보 업그레이드 핸들러
  const handleUpgradeHand = async (planetCardId: string, handName: string) => {
    if (!game) return;
    
    try {
      const response = await fetch(`/api/games/${game.id}/upgrade-hand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planetCardId, handName }),
      });
      const updatedGame = await response.json();
      setGame(updatedGame);
    } catch (error) {
      console.error('Failed to upgrade hand:', error);
      throw error;
    }
  };

  // 주사위 인챈트 핸들러
  const handleEnchantDice = async (
    consumableId: string,
    diceId: number | undefined,
    target: 'top' | 'all',
    enchantType: 'value' | 'suit' | 'both',
    newValue?: number,
    newSuit?: 'None' | '♠' | '♦' | '♥' | '♣'
  ) => {
    if (!game) return;
    
    try {
      const response = await fetch(`/api/games/${game.id}/enchant-dice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumableId,
          diceId,
          target,
          enchantType,
          newValue,
          newSuit,
        }),
      });
      const updatedGame = await response.json();
      setGame(updatedGame);
      setDices(updatedGame.dices as Dice[]);
    } catch (error) {
      console.error('Failed to enchant dice:', error);
      throw error;
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
          <div className="text-right flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-black text-orange-500" data-testid="text-enemy-damage">⚔️ {game.enemyDamage || 10}</div>
              <p className="text-muted-foreground text-xs">ATTACK</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-accent" data-testid="text-enemy-hp">{game.enemyHp}</div>
              <p className="text-muted-foreground text-xs">ENEMY HP</p>
            </div>
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
        {/* Left Panel - Stats, Jokers & Consumables */}
        <div className="hidden lg:flex flex-col gap-3">
          {/* Stats Row */}
          <div className="flex gap-2">
            <div className="bg-card border border-card-border rounded-lg px-3 py-2 flex items-center gap-2">
              <RotateCcwIcon className="w-4 h-4 text-primary" />
              <span className="text-lg font-black text-foreground" data-testid="text-rerolls">{game.rerollsLeft}</span>
            </div>
            <div className="bg-card border border-card-border rounded-lg px-3 py-2 flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-lg font-black text-primary" data-testid="text-gold">${game.gold}</span>
            </div>
            <div className="bg-card border border-card-border rounded-lg px-3 py-2 flex items-center gap-2">
              <HeartIcon className="w-4 h-4 text-destructive" />
              <span className="text-lg font-black text-destructive" data-testid="text-health">{game.health}/{game.maxHealth || 100}</span>
            </div>
          </div>

          {/* Joker Slots */}
          <div className="bg-card border border-card-border rounded-lg p-3">
            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Jokers</div>
            <div className="grid grid-cols-5 gap-2">
              {(() => {
                const jokers = Array.isArray(game.jokers) ? game.jokers : [];
                const maxSlots = Math.max(5, Math.ceil((jokers.length + 1) / 5) * 5);
                return [...Array(maxSlots)].map((_, i) => {
                  const joker = jokers[i];
                  return (
                    <div
                      key={`joker-${i}`}
                      data-testid={`slot-joker-${i}`}
                      className={`aspect-[3/4] bg-background/50 border-2 rounded-lg flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer ${
                        joker ? 'border-primary/50' : 'border-dashed border-muted-foreground/30'
                      }`}
                      title={joker ? `${joker.name}: ${joker.description}` : 'Empty Joker Slot'}
                    >
                      {joker ? (
                        <>
                          <span className="text-2xl">🃏</span>
                          <span className="text-[8px] text-center mt-1 px-1 truncate w-full">{joker.name}</span>
                        </>
                      ) : (
                        <span className="text-2xl text-muted-foreground/30">🃏</span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Consumable Slots */}
          <div className="bg-card border border-card-border rounded-lg p-3">
            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Consumables</div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={`consumable-${i}`}
                  data-testid={`slot-consumable-${i}`}
                  className="aspect-square bg-background/50 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <span className="text-xl text-muted-foreground/30">⚗️</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - 3D Dice Board */}
        <div className="lg:col-span-3 relative min-h-0">
          <DiceBoard 
            dices={dices} 
            onLockToggle={toggleLock} 
            rolling={rolling} 
            power={rollPower} 
            onValueSettled={handleValueSettled}
            activatingDiceId={activatingDiceId}
            activationOrder={activationOrder}
            activationResults={activationResults}
          />
          
          {/* 최종 데미지 계산식 표시 (화면 최상단 중앙) */}
          {isActivating && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-card/95 backdrop-blur-sm border-2 border-primary rounded-lg px-8 py-5 shadow-2xl w-fit min-w-[400px]">
                <div className="text-center whitespace-nowrap">
                  <div className="text-xs text-muted-foreground mb-3 font-bold uppercase tracking-wider">데미지 계산</div>
                  <div className="flex items-baseline justify-center gap-3 mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-primary tabular-nums">{cumulativeChips}</span>
                      <span className="text-2xl text-muted-foreground">Chips</span>
                    </div>
                    <span className="text-3xl text-muted-foreground">×</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl text-muted-foreground">(</span>
                      <span className="text-4xl font-black text-primary tabular-nums">{cumulativeMultiplier}</span>
                      <span className="text-2xl text-muted-foreground">+ 1)</span>
                    </div>
                    <span className="text-3xl text-muted-foreground">=</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-accent tabular-nums drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">{currentDamage}</span>
                      <span className="text-2xl text-muted-foreground">Damage</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t border-card-border whitespace-nowrap">
                    <div>
                      <span className="font-bold text-primary">{cumulativeChips}</span> Chips
                    </div>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                    <div>
                      <span className="font-bold text-primary">{cumulativeMultiplier}</span> Mult
                    </div>
                    {activationOrder > 0 && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                        <div>
                          발동 <span className="font-bold text-primary">#{activationOrder}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 발동 순서 번호 표시 */}
          {isActivating && activatingDiceId !== null && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg border-2 border-primary">
                <div className="text-xl font-black">발동 #{activationOrder}</div>
                {activationResults[currentActivationIndex] && (
                  <div className="text-xs mt-1 opacity-90">
                    +{activationResults[currentActivationIndex].chips} Chips | 
                    +{activationResults[currentActivationIndex].multiplier} Mult
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 조커 효과 표시 */}
          {isActivating && activatingDiceId !== null && activationResults[currentActivationIndex]?.jokerEffects.length > 0 && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="bg-card/90 border border-card-border rounded-lg p-2 shadow-lg">
                <div className="flex gap-2 flex-wrap justify-center max-w-md">
                  {activationResults[currentActivationIndex].jokerEffects.map((effect, idx) => (
                    <div key={idx} className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold">
                      🃏 {effect.jokerName}
                      {effect.chipsBonus > 0 && <span className="ml-1">+{effect.chipsBonus} Chips</span>}
                      {effect.multBonus > 0 && <span className="ml-1">+{effect.multBonus} Mult</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {damageDealt && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 pointer-events-none animate-in fade-in duration-300">
              <div className="text-center">
                <div className="text-7xl font-black text-accent mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]" data-testid="text-damage">{damageDealt}</div>
                <p className="text-primary text-xl font-bold uppercase tracking-widest">DAMAGE!</p>
              </div>
            </div>
          )}

          {/* Action Buttons - Top Right */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={() => setShowDiceList(true)}
              className="bg-card/90 backdrop-blur border border-card-border hover:border-primary rounded-lg p-3 transition-colors shadow-lg"
              title="주사위 리스트"
            >
              <List className="w-5 h-5 text-primary" />
            </button>
            <button
              onClick={() => setShowHandUpgrade(true)}
              className="bg-card/90 backdrop-blur border border-card-border hover:border-primary rounded-lg p-3 transition-colors shadow-lg"
              title="족보 업그레이드"
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </button>
            <button
              onClick={() => setShowDiceEnchant(true)}
              className="bg-card/90 backdrop-blur border border-card-border hover:border-primary rounded-lg p-3 transition-colors shadow-lg"
              title="주사위 인챈트"
            >
              <Wand2 className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Floating Controls - Bottom Right */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 items-end">
            {waitingForNewRound ? (
              <button
                onClick={startNewRound}
                disabled={rolling}
                data-testid="button-new-round"
                className="bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground text-accent-foreground font-black py-4 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-lg"
              >
                <RotateCcwIcon className="w-5 h-5" />
                ROLL DICE
              </button>
            ) : (
              <>
                {selectedHand && (
                  <div className="bg-card/90 backdrop-blur border border-primary rounded-lg px-3 py-2 text-center shadow-lg">
                    <div className="text-sm font-black text-primary" data-testid="text-hand-name">{selectedHand.name}</div>
                    <div className="text-lg font-black text-accent" data-testid="text-calculated-damage">{calculateScore()} DMG</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      onMouseDown={startCharging}
                      onMouseUp={releaseCharge}
                      onMouseLeave={() => isCharging && releaseCharge()}
                      onTouchStart={startCharging}
                      onTouchEnd={releaseCharge}
                      disabled={game.rerollsLeft === 0 || rolling}
                      data-testid="button-reroll"
                      className={`relative overflow-hidden font-black py-3 px-5 rounded-lg transition-all select-none shadow-lg ${
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
                        {isCharging ? `${Math.round(chargePower * 100)}%` : 'REROLL'}
                      </span>
                    </button>
                    {!isCharging && !rolling && game.rerollsLeft > 0 && (
                      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-white/70 whitespace-nowrap drop-shadow">
                        Hold longer = stronger
                      </span>
                    )}
                  </div>

                  <button
                    onClick={submitHand}
                    disabled={!selectedHand || damageDealt !== null || rolling}
                    data-testid="button-submit"
                    className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-black py-3 px-5 rounded-lg transition-colors flex items-center gap-1 shadow-lg"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    SUBMIT
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Stats - Top Left */}
          <div className="lg:hidden absolute top-4 left-4 z-20 flex gap-2">
            <div className="bg-card/90 backdrop-blur border border-card-border rounded px-2 py-1 flex items-center gap-1 shadow-lg">
              <RotateCcwIcon className="w-3 h-3 text-primary" />
              <span className="font-bold text-sm">{game.rerollsLeft}</span>
            </div>
            <div className="bg-card/90 backdrop-blur border border-card-border rounded px-2 py-1 flex items-center gap-1 shadow-lg">
              <Crown className="w-3 h-3 text-primary" />
              <span className="font-bold text-sm">${game.gold}</span>
            </div>
            <div className="bg-card/90 backdrop-blur border border-card-border rounded px-2 py-1 flex items-center gap-1 shadow-lg">
              <HeartIcon className="w-3 h-3 text-destructive" />
              <span className="font-bold text-sm">{game.health}/{game.maxHealth || 100}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Reset Button - Bottom Left (Global) */}
      <button
        onClick={async () => {
          try {
            const response = await fetch('/api/games/new', { method: 'POST' });
            if (!response.ok) {
              const error = await response.json().catch(() => ({ error: 'Failed to reset game' }));
              throw new Error(error.error || 'Failed to reset game');
            }
            const newGame = await response.json();
            setLocation(`/stage-select/${newGame.id}`);
          } catch (error) {
            console.error('Failed to reset game:', error);
            toast.error('게임 리셋에 실패했습니다', {
              description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
            });
          }
        }}
        data-testid="button-reset"
        className="fixed bottom-4 left-4 z-50 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg text-sm font-bold"
      >
        <RefreshCw className="w-4 h-4" />
        RESET
      </button>

      {/* 개발 모드 테스트 패널 */}
      {isDevMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg text-sm font-bold"
          >
            <TestTube className="w-4 h-4" />
            TEST
          </button>
          {showTestPanel && game && (
            <div className="absolute bottom-12 right-0 bg-card border border-card-border rounded-lg p-4 shadow-xl w-80 max-h-96 overflow-y-auto">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-3">테스트 도구</div>
              
              {/* 주사위 값 설정 */}
              <div className="mb-4">
                <div className="text-xs font-semibold mb-2">주사위 값 설정</div>
                <div className="space-y-2">
                  {dices.map((dice, i) => (
                    <div key={dice.id} className="flex items-center gap-2">
                      <span className="text-xs w-8">주사위 {i + 1}:</span>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={dice.value}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 1;
                          const newDices = [...dices];
                          newDices[i] = { ...newDices[i], value: Math.max(1, Math.min(6, newValue)) };
                          setDices(newDices);
                        }}
                        className="flex-1 bg-background border border-card-border rounded px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => {
                          const newDices = [...dices];
                          newDices[i] = { ...newDices[i], locked: !newDices[i].locked };
                          setDices(newDices);
                        }}
                        className={`text-xs px-2 py-1 rounded ${dice.locked ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                      >
                        {dice.locked ? '잠금' : '해제'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 빠른 족보 생성 */}
              <div className="mb-4">
                <div className="text-xs font-semibold mb-2">빠른 족보 생성</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      // Pair 생성 (같은 값 2개)
                      const newDices = dices.map((d, i) => ({
                        ...d,
                        value: i < 2 ? 6 : Math.floor(Math.random() * 6) + 1,
                        locked: i < 2,
                      }));
                      setDices(newDices);
                    }}
                    className="bg-primary/20 hover:bg-primary/30 text-primary text-xs px-2 py-1 rounded"
                  >
                    Pair
                  </button>
                  <button
                    onClick={() => {
                      // Triple 생성
                      const newDices = dices.map((d, i) => ({
                        ...d,
                        value: i < 3 ? 6 : Math.floor(Math.random() * 6) + 1,
                        locked: i < 3,
                      }));
                      setDices(newDices);
                    }}
                    className="bg-primary/20 hover:bg-primary/30 text-primary text-xs px-2 py-1 rounded"
                  >
                    Triple
                  </button>
                  <button
                    onClick={() => {
                      // Straight 3 생성
                      const newDices = dices.map((d, i) => ({
                        ...d,
                        value: i < 3 ? i + 1 : Math.floor(Math.random() * 6) + 1,
                        locked: i < 3,
                      }));
                      setDices(newDices);
                    }}
                    className="bg-primary/20 hover:bg-primary/30 text-primary text-xs px-2 py-1 rounded"
                  >
                    Straight 3
                  </button>
                  <button
                    onClick={() => {
                      // Flush 생성 (같은 슈트)
                      const suit = '♠' as const;
                      const newDices = dices.map((d, i) => ({
                        ...d,
                        value: Math.floor(Math.random() * 6) + 1,
                        suit,
                        locked: true,
                      }));
                      setDices(newDices);
                    }}
                    className="bg-primary/20 hover:bg-primary/30 text-primary text-xs px-2 py-1 rounded"
                  >
                    Flush
                  </button>
                </div>
              </div>

              {/* 골드 수급 테스트 */}
              <div className="mb-4">
                <div className="text-xs font-semibold mb-2">골드 수급 테스트</div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    현재 골드: <span className="font-bold text-primary">${game.gold}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    예상 보상: <span className="font-bold text-accent">+${game.pendingGoldReward || 0}</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (!selectedHand || lockedDices.length === 0) {
                        toast.error('족보를 선택하고 주사위를 잠그세요');
                        return;
                      }
                      // 적을 처치할 수 있는 큰 데미지로 제출
                      await submitHand();
                    }}
                    className="w-full bg-accent hover:bg-accent/80 text-accent-foreground text-xs px-2 py-1 rounded font-bold"
                  >
                    적 처치 (골드 획득 테스트)
                  </button>
                </div>
              </div>

              {/* 디버그 정보 */}
              <div className="text-xs">
                <div className="font-semibold mb-1">디버그 정보</div>
                <div className="text-muted-foreground space-y-1">
                  <div>게임 상태: {game.gameState}</div>
                  <div>적 HP: {game.enemyHp}/{game.maxEnemyHp}</div>
                  <div>잠긴 주사위: {lockedDices.length}개</div>
                  <div>선택된 족보: {selectedHand?.name || '없음'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {game && (
        <>
          <DiceListModal
            diceDeck={isDeckDiceArray(game.diceDeck) ? game.diceDeck : []}
            dices={dices}
            isOpen={showDiceList}
            onClose={() => setShowDiceList(false)}
            onLockToggle={toggleLock}
            onSubmit={submitHand}
            selectedHand={selectedHand}
          />
          <HandUpgradeModal
            game={game}
            isOpen={showHandUpgrade}
            onClose={() => setShowHandUpgrade(false)}
            onUpgrade={handleUpgradeHand}
          />
          <DiceEnchantModal
            game={game}
            dices={dices}
            isOpen={showDiceEnchant}
            onClose={() => setShowDiceEnchant(false)}
            onEnchant={handleEnchantDice}
          />
        </>
      )}
    </div>
  );
}
