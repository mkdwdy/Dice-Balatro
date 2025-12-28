import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { GameSession, Consumable } from '@shared/schema';
import { getPlanetsByPokerHand } from '@benchmark/balatro-planets-db';
import type { BalatroPlanet } from '@benchmark/balatro-schemas';

interface HandUpgradeModalProps {
  game: GameSession;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planetCardId: string, handName: string) => Promise<void>;
}

const HAND_NAMES = [
  'High Dice',
  'Pair',
  'Two Pair',
  'Triple',
  'Straight 3',
  'Straight 4',
  'Straight 5',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Yahtzee',
];

export default function HandUpgradeModal({
  game,
  isOpen,
  onClose,
  onUpgrade,
}: HandUpgradeModalProps) {
  const [selectedHand, setSelectedHand] = useState<string>('');
  const [availablePlanets, setAvailablePlanets] = useState<BalatroPlanet[]>([]);
  const [loading, setLoading] = useState(false);

  const consumables = Array.isArray(game.consumables) ? game.consumables : [];
  const handUpgrades = (game.handUpgrades as Record<string, number>) || {};

  useEffect(() => {
    if (isOpen && selectedHand) {
      // 선택된 족보에 해당하는 행성 카드 찾기
      const planets = getPlanetsByPokerHand(selectedHand);
      // 소모품 중에서 행성 카드인 것만 필터링
      const planetIds = planets.map(p => p.id);
      const available = consumables.filter((c: Consumable) => 
        planetIds.includes(c.id)
      ) as Consumable[];
      
      // 행성 카드 정보와 매칭
      const matchedPlanets = planets.filter((p: BalatroPlanet) => 
        available.some((a: Consumable) => a.id === p.id)
      );
      
      setAvailablePlanets(matchedPlanets);
    }
  }, [isOpen, selectedHand, consumables]);

  const handleUpgrade = async (planetId: string) => {
    if (!selectedHand) return;
    
    setLoading(true);
    try {
      await onUpgrade(planetId, selectedHand);
      setSelectedHand('');
      setAvailablePlanets([]);
    } catch (error) {
      console.error('Failed to upgrade hand:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-primary">족보 업그레이드</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 족보 선택 */}
          <div>
            <label className="block text-sm font-bold mb-2">업그레이드할 족보 선택</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {HAND_NAMES.map((handName) => {
                const currentBonus = handUpgrades[handName] || 0;
                return (
                  <button
                    key={handName}
                    onClick={() => setSelectedHand(handName)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedHand === handName
                        ? 'border-primary bg-primary/10'
                        : 'border-card-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-bold text-sm">{handName}</div>
                    {currentBonus > 0 && (
                      <div className="text-xs text-primary mt-1">
                        +{currentBonus} Mult
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 사용 가능한 행성 카드 */}
          {selectedHand && (
            <div>
              <label className="block text-sm font-bold mb-2">
                사용 가능한 행성 카드 ({availablePlanets.length}개)
              </label>
              {availablePlanets.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  {selectedHand} 족보를 업그레이드할 수 있는 행성 카드가 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {availablePlanets.map((planet) => {
                    const consumable = consumables.find((c: Consumable) => c.id === planet.id);
                    return (
                      <div
                        key={planet.id}
                        className="bg-background/50 border border-card-border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold">{planet.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {planet.addition}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              대상: {planet.pokerHand}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUpgrade(planet.id)}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-bold px-4 py-2 rounded-lg transition-colors ml-4"
                          >
                            사용
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

