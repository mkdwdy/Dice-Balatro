import { useState, useEffect } from 'react';
import { X, Wand2 } from 'lucide-react';
import type { GameSession, Consumable, Dice } from '@shared/schema';

interface DiceEnchantModalProps {
  game: GameSession;
  dices: Dice[];
  isOpen: boolean;
  onClose: () => void;
  onEnchant: (consumableId: string, diceId: number | undefined, target: 'top' | 'all', enchantType: 'value' | 'suit' | 'both', newValue?: number, newSuit?: 'None' | '♠' | '♦' | '♥' | '♣') => Promise<void>;
}

export default function DiceEnchantModal({
  game,
  dices,
  isOpen,
  onClose,
  onEnchant,
}: DiceEnchantModalProps) {
  const [selectedConsumable, setSelectedConsumable] = useState<string>('');
  const [selectedDice, setSelectedDice] = useState<number | undefined>(undefined);
  const [target, setTarget] = useState<'top' | 'all'>('top');
  const [enchantType, setEnchantType] = useState<'value' | 'suit' | 'both'>('value');
  const [newValue, setNewValue] = useState<number>(1);
  const [newSuit, setNewSuit] = useState<'None' | '♠' | '♦' | '♥' | '♣'>('None');
  const [loading, setLoading] = useState(false);

  const consumables = Array.isArray(game.consumables) ? game.consumables : [];

  useEffect(() => {
    if (target === 'all') {
      setSelectedDice(undefined);
    }
  }, [target]);

  const handleEnchant = async () => {
    if (!selectedConsumable) return;
    if (target === 'top' && selectedDice === undefined) {
      alert('주사위를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onEnchant(
        selectedConsumable,
        selectedDice,
        target,
        enchantType,
        (enchantType === 'value' || enchantType === 'both') ? newValue : undefined,
        (enchantType === 'suit' || enchantType === 'both') ? newSuit : undefined
      );
      // 초기화
      setSelectedConsumable('');
      setSelectedDice(undefined);
      setTarget('top');
      setEnchantType('value');
      setNewValue(1);
      setNewSuit('None');
    } catch (error) {
      console.error('Failed to enchant dice:', error);
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
            <Wand2 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-primary">주사위 인챈트</h2>
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
          {/* 소모품 선택 */}
          <div>
            <label className="block text-sm font-bold mb-2">소모품 선택</label>
            {consumables.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                사용 가능한 소모품이 없습니다.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {consumables.map((consumable: Consumable) => (
                  <button
                    key={consumable.id}
                    onClick={() => setSelectedConsumable(consumable.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedConsumable === consumable.id
                        ? 'border-primary bg-primary/10'
                        : 'border-card-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-bold text-sm">{consumable.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {consumable.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 타겟 선택 */}
          {selectedConsumable && (
            <div>
              <label className="block text-sm font-bold mb-2">대상 선택</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTarget('top')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    target === 'top'
                      ? 'border-primary bg-primary/10'
                      : 'border-card-border hover:border-primary/50'
                  }`}
                >
                  윗면만
                </button>
                <button
                  onClick={() => setTarget('all')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    target === 'all'
                      ? 'border-primary bg-primary/10'
                      : 'border-card-border hover:border-primary/50'
                  }`}
                >
                  모든 면
                </button>
              </div>
            </div>
          )}

          {/* 주사위 선택 (윗면만일 때) */}
          {selectedConsumable && target === 'top' && (
            <div>
              <label className="block text-sm font-bold mb-2">주사위 선택</label>
              <div className="grid grid-cols-5 gap-2">
                {dices.map((dice) => (
                  <button
                    key={dice.id}
                    onClick={() => setSelectedDice(dice.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedDice === dice.id
                        ? 'border-primary bg-primary/10'
                        : 'border-card-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-bold text-lg">{dice.value}</div>
                      <div className="text-xs text-muted-foreground">{dice.suit === 'None' ? '없음' : dice.suit}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 인챈트 타입 선택 */}
          {selectedConsumable && (target === 'all' || selectedDice !== undefined) && (
            <div>
              <label className="block text-sm font-bold mb-2">변경 타입</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEnchantType('value')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    enchantType === 'value'
                      ? 'border-primary bg-primary/10'
                      : 'border-card-border hover:border-primary/50'
                  }`}
                >
                  값만
                </button>
                <button
                  onClick={() => setEnchantType('suit')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    enchantType === 'suit'
                      ? 'border-primary bg-primary/10'
                      : 'border-card-border hover:border-primary/50'
                  }`}
                >
                  슈트만
                </button>
                <button
                  onClick={() => setEnchantType('both')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    enchantType === 'both'
                      ? 'border-primary bg-primary/10'
                      : 'border-card-border hover:border-primary/50'
                  }`}
                >
                  둘 다
                </button>
              </div>
            </div>
          )}

          {/* 새 값 입력 */}
          {(enchantType === 'value' || enchantType === 'both') && selectedConsumable && (target === 'all' || selectedDice !== undefined) && (
            <div>
              <label className="block text-sm font-bold mb-2">새 값 (1-6)</label>
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((val) => (
                  <button
                    key={val}
                    onClick={() => setNewValue(val)}
                    className={`p-3 rounded-lg border-2 transition-all font-bold ${
                      newValue === val
                        ? 'border-primary bg-primary/10'
                        : 'border-card-border hover:border-primary/50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 새 슈트 입력 */}
          {(enchantType === 'suit' || enchantType === 'both') && selectedConsumable && (target === 'all' || selectedDice !== undefined) && (
            <div>
              <label className="block text-sm font-bold mb-2">새 슈트</label>
              <div className="grid grid-cols-5 gap-2">
                {['None', '♠', '♦', '♥', '♣'].map((suit) => (
                  <button
                    key={suit}
                    onClick={() => setNewSuit(suit as typeof newSuit)}
                    className={`p-3 rounded-lg border-2 transition-all font-bold ${
                      newSuit === suit
                        ? 'border-primary bg-primary/10'
                        : 'border-card-border hover:border-primary/50'
                    }`}
                  >
                    {suit === 'None' ? '없음' : suit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 실행 버튼 */}
          {selectedConsumable && (target === 'all' || selectedDice !== undefined) && (
            <div className="pt-4 border-t border-card-border">
              <button
                onClick={handleEnchant}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? '인챈트 중...' : '인챈트 실행'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

