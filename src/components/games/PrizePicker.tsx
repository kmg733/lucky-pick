'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { pickRandom } from '@/lib/random';

export default function PrizePicker() {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayItem, setDisplayItem] = useState<string>('');
  const [removeAfterPick, setRemoveAfterPick] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const animationFrame = animationFrameRef.current;
    const timeout = timeoutRef.current;

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    const newItems = text
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    setItems(newItems);
  };

  const startSpin = () => {
    if (items.length === 0) {
      alert('경품을 입력해주세요!');
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedItem(null);

    let spinCount = 0;
    const maxSpins = 30;
    const baseDelay = 50;

    const spin = () => {
      if (spinCount < maxSpins) {
        const randomItem = pickRandom(items);
        if (randomItem) {
          setDisplayItem(randomItem);
        }

        spinCount++;
        const delay = baseDelay + (spinCount * 10);

        timeoutRef.current = setTimeout(spin, delay);
      } else {
        const winner = pickRandom(items);
        if (winner) {
          setSelectedItem(winner);
          setDisplayItem(winner);
          setHistory(prev => [winner, ...prev]);

          if (removeAfterPick) {
            const newItems = items.filter(item => item !== winner);
            setItems(newItems);
            setInputText(newItems.join('\n'));
          }
        }
        setIsSpinning(false);
      }
    };

    spin();
  };

  const handleReset = () => {
    setInputText('');
    setItems([]);
    setSelectedItem(null);
    setDisplayItem('');
    setHistory([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSpinning(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 입력 영역 */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">경품 목록</h2>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              placeholder="경품을 한 줄씩 입력하세요&#10;예시:&#10;아이패드&#10;에어팟&#10;스타벅스 쿠폰&#10;치킨 쿠폰"
              className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 dark:bg-slate-700 dark:text-white"
              disabled={isSpinning}
            />

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="removeAfterPick"
                checked={removeAfterPick}
                onChange={(e) => setRemoveAfterPick(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSpinning}
              />
              <label htmlFor="removeAfterPick" className="text-sm text-gray-700 dark:text-gray-300">
                당첨된 경품은 목록에서 제거
              </label>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  등록된 경품 ({items.length}개)
                </h3>
              </div>
              {items.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {items.map((item, index) => (
                    <div
                      key={`prize-${item}-${index}`}
                      className="px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded text-sm text-gray-700 dark:text-gray-300"
                    >
                      {index + 1}. {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  등록된 경품이 없습니다
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* 오른쪽: 추첨 결과 */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">추첨 결과</h2>

            {/* 슬롯 머신 디스플레이 */}
            <div className="relative mb-6">
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-2xl p-8 border-4 border-yellow-400 dark:border-yellow-600 shadow-lg min-h-[200px] flex items-center justify-center">
                {isSpinning || selectedItem ? (
                  <div
                    className={`text-center transition-all duration-300 ${
                      isSpinning
                        ? 'animate-bounce'
                        : 'scale-110 animate-pulse'
                    }`}
                  >
                    <div
                      className={`text-3xl font-bold ${
                        isSpinning ? 'text-gray-700' : 'text-yellow-600'
                      }`}
                    >
                      {displayItem}
                    </div>
                    {!isSpinning && selectedItem && (
                      <div className="mt-4 text-xl font-medium text-yellow-700">
                        🎉 축하합니다! 🎉
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <div className="text-6xl mb-4">🎁</div>
                    <p className="text-lg">추첨을 시작하세요</p>
                  </div>
                )}
              </div>

              {isSpinning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/20 rounded-2xl animate-pulse" />
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3">
              <Button
                onClick={startSpin}
                disabled={isSpinning || items.length === 0}
                className="flex-1"
                size="lg"
              >
                {isSpinning ? '추첨 중...' : '🎲 추첨하기'}
              </Button>
              <Button
                onClick={handleReset}
                variant="secondary"
                disabled={isSpinning}
                size="lg"
              >
                초기화
              </Button>
            </div>
          </Card>

          {/* 추첨 이력 */}
          {history.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  추첨 이력 ({history.length}회)
                </h3>
                <button
                  onClick={handleClearHistory}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 transition-colors"
                >
                  이력 삭제
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {history.map((item, index) => (
                  <div
                    key={`history-${item}-${index}`}
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-800"
                  >
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-yellow-400 text-white font-bold rounded-full text-sm">
                      {history.length - index}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{item}</span>
                    {index === 0 && (
                      <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                        최근
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
