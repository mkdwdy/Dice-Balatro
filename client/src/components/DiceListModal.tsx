import { X } from 'lucide-react';
import type { DeckDice } from '@shared/schema';

interface DiceListModalProps {
  diceDeck: DeckDice[];
  isOpen: boolean;
  onClose: () => void;
}

export default function DiceListModal({ diceDeck, isOpen, onClose }: DiceListModalProps) {
  if (!isOpen) return null;

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
                    </div>
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
          <p className="text-xs text-muted-foreground text-center">
            총 {diceDeck.length}개의 주사위 (각 주사위는 6면체)
          </p>
        </div>
      </div>
    </div>
  );
}
