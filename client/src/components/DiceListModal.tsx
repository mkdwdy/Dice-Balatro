import { X, Lock, Unlock, CheckCircle } from 'lucide-react';
import type { DeckDice, Dice } from '@shared/schema';

interface HandType {
  name: string;
  multiplier: number;
  condition: string;
}

interface DiceListModalProps {
  diceDeck: DeckDice[];
  dices: Dice[]; // 현재 게임 화면의 주사위 상태
  isOpen: boolean;
  onClose: () => void;
  onLockToggle: (id: number, value: number) => void; // 주사위 잠금/해제 함수
  onSubmit?: () => void; // 족보 제출 함수
  selectedHand?: HandType | null; // 현재 선택된 족보
}

export default function DiceListModal({ diceDeck, dices, isOpen, onClose, onLockToggle, onSubmit, selectedHand }: DiceListModalProps) {
  if (!isOpen) return null;

  // 현재 게임 화면의 주사위 상태를 ID로 매핑
  const diceStateMap = new Map(dices.map(d => [d.id, d]));
  
  // 잠긴 주사위 개수 확인
  const lockedDices = dices.filter(d => d.locked);
  const canSubmit = selectedHand && lockedDices.length > 0 && onSubmit;
  
  const handleSubmit = async () => {
    if (canSubmit && onSubmit) {
      await onSubmit();
      onClose(); // 제출 후 모달 닫기
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-primary">주사위 덱</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {diceDeck.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">보유한 주사위가 없습니다.</p>
        ) : (
          <div className="space-y-6">
            {diceDeck.map((dice) => {
              const currentFace = dice.faces[dice.currentTopFace];
              return (
                <div
                  key={dice.id}
                  className="bg-background/50 border border-card-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">주사위 #{dice.id}</span>
                      <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-lg">
                        <span className="text-xs text-muted-foreground">현재 윗면:</span>
                        <span className="font-bold text-primary">
                          {currentFace.value} {currentFace.suit === 'None' ? '' : currentFace.suit}
                        </span>
                      </div>
                      {diceStateMap.has(dice.id) && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                          diceStateMap.get(dice.id)?.locked 
                            ? 'bg-yellow-500/20 border border-yellow-500/50' 
                            : 'bg-muted/50'
                        }`}>
                          {diceStateMap.get(dice.id)?.locked ? (
                            <>
                              <Lock className="w-4 h-4 text-yellow-500" />
                              <span className="text-xs font-bold text-yellow-500">잠금</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">해제</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {diceStateMap.has(dice.id) && (
                      <button
                        onClick={() => {
                          const currentDice = diceStateMap.get(dice.id);
                          if (currentDice) {
                            onLockToggle(dice.id, currentDice.value);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                          diceStateMap.get(dice.id)?.locked
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`}
                      >
                        {diceStateMap.get(dice.id)?.locked ? (
                          <>
                            <Unlock className="w-4 h-4" />
                            잠금 해제
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            잠금
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* 모든 면 표시 */}
                  <div className="grid grid-cols-6 gap-2">
                    {dice.faces.map((face, faceIndex) => {
                      const isCurrentTop = faceIndex === dice.currentTopFace;
                      return (
                        <div
                          key={faceIndex}
                          className={`relative p-3 rounded-lg border-2 transition-all ${
                            isCurrentTop
                              ? 'border-primary bg-primary/10 shadow-lg scale-105'
                              : 'border-card-border bg-background/30'
                          }`}
                        >
                          {isCurrentTop && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                              ↑
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-2xl font-black mb-1">{face.value}</div>
                            <div className="text-sm font-bold">
                              {face.suit === 'None' ? (
                                <span className="text-muted-foreground">없음</span>
                              ) : (
                                <span className="text-primary">{face.suit}</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              면 #{faceIndex + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 면 정보 요약 */}
                  <div className="mt-3 pt-3 border-t border-card-border">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">값 범위: </span>
                        <span className="font-bold">
                          {Math.min(...dice.faces.map(f => f.value))} - {Math.max(...dice.faces.map(f => f.value))}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">슈트 종류: </span>
                        <span className="font-bold">
                          {new Set(dice.faces.map(f => f.suit)).size}개
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-card-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                총 {diceDeck.length}개의 주사위 (각 주사위는 6면체)
              </p>
              {selectedHand && (
                <p className="text-sm font-bold text-primary">
                  선택된 족보: {selectedHand.name} (x{selectedHand.multiplier + 1})
                </p>
              )}
              {lockedDices.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  잠긴 주사위: {lockedDices.length}개
                </p>
              )}
            </div>
            {onSubmit && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`px-6 py-3 rounded-lg font-black text-sm transition-colors flex items-center gap-2 ${
                  canSubmit
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                SUBMIT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
