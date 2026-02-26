'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { generateRandomNumber } from '@/lib/random';

interface PickedNumber {
  value: number;
  slot: number;
  timestamp: number;
}

export default function NumberPicker() {
  const [minValue, setMinValue] = useState<number>(1);
  const [maxValue, setMaxValue] = useState<number>(100);
  const [pickCount, setPickCount] = useState<number>(5);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  const [sortResults, setSortResults] = useState<boolean>(true);
  const [pickedNumbers, setPickedNumbers] = useState<PickedNumber[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [currentSlot, setCurrentSlot] = useState<number>(0);
  const [rollingNumbers, setRollingNumbers] = useState<number[]>([]);
  const [history, setHistory] = useState<number[][]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const timeout = timeoutRef.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  useEffect(() => {
    validateInputs();
  }, [minValue, maxValue, pickCount, allowDuplicates]);

  const validateInputs = () => {
    if (minValue >= maxValue) {
      setValidationError('최소값은 최대값보다 작아야 합니다.');
      return false;
    }

    const range = maxValue - minValue + 1;
    if (!allowDuplicates && pickCount > range) {
      setValidationError(`중복 불허 시 뽑을 수 있는 최대 개수는 ${range}개입니다.`);
      return false;
    }

    setValidationError('');
    return true;
  };

  const spinForSingleNumber = (
    slotNumber: number,
    usedNumbers: number[],
    onComplete: (pickedNumber: PickedNumber) => void
  ) => {
    let spinCount = 0;
    const maxSpins = 25;
    const baseDelay = 40;

    const spin = () => {
      if (spinCount < maxSpins) {
        let randomNum: number;
        if (allowDuplicates) {
          randomNum = generateRandomNumber(minValue, maxValue);
        } else {
          do {
            randomNum = generateRandomNumber(minValue, maxValue);
          } while (usedNumbers.includes(randomNum));
        }

        setRollingNumbers(prev => {
          const newRolling = [...prev];
          newRolling[slotNumber] = randomNum;
          return newRolling;
        });

        spinCount++;
        const delay = baseDelay + (spinCount * 8);

        timeoutRef.current = setTimeout(spin, delay);
      } else {
        let finalNumber: number;
        if (allowDuplicates) {
          finalNumber = generateRandomNumber(minValue, maxValue);
        } else {
          do {
            finalNumber = generateRandomNumber(minValue, maxValue);
          } while (usedNumbers.includes(finalNumber));
        }

        const pickedNumber: PickedNumber = {
          value: finalNumber,
          slot: slotNumber,
          timestamp: Date.now()
        };

        setRollingNumbers(prev => {
          const newRolling = [...prev];
          newRolling[slotNumber] = finalNumber;
          return newRolling;
        });

        onComplete(pickedNumber);
      }
    };

    spin();
  };

  const startSpin = () => {
    if (!validateInputs()) {
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setPickedNumbers([]);
    setCurrentSlot(0);
    setRollingNumbers(new Array(pickCount).fill(minValue));

    const newPickedNumbers: PickedNumber[] = [];
    const usedNumbers: number[] = [];
    let currentSlotIndex = 0;

    const pickNext = () => {
      if (currentSlotIndex < pickCount) {
        setCurrentSlot(currentSlotIndex);

        spinForSingleNumber(currentSlotIndex, usedNumbers, (pickedNumber) => {
          newPickedNumbers.push(pickedNumber);
          usedNumbers.push(pickedNumber.value);
          setPickedNumbers([...newPickedNumbers]);

          currentSlotIndex++;

          if (currentSlotIndex < pickCount) {
            timeoutRef.current = setTimeout(pickNext, 500);
          } else {
            let finalNumbers = newPickedNumbers.map(pn => pn.value);

            if (sortResults) {
              finalNumbers.sort((a, b) => a - b);
            }

            setHistory(prev => [finalNumbers, ...prev]);
            setIsSpinning(false);
            setCurrentSlot(-1);
          }
        });
      }
    };

    pickNext();
  };

  const handleReset = () => {
    setMinValue(1);
    setMaxValue(100);
    setPickCount(5);
    setAllowDuplicates(false);
    setSortResults(true);
    setPickedNumbers([]);
    setRollingNumbers([]);
    setHistory([]);
    setCurrentSlot(-1);
    setValidationError('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSpinning(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const getDisplayNumbers = () => {
    if (pickedNumbers.length === 0) return rollingNumbers;

    if (sortResults && !isSpinning) {
      return [...pickedNumbers].sort((a, b) => a.value - b.value).map(pn => pn.value);
    }

    return rollingNumbers;
  };

  const isSlotActive = (index: number) => {
    return isSpinning && currentSlot === index;
  };

  const isSlotCompleted = (index: number) => {
    return pickedNumbers.some(pn => pn.slot === index);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 설정 영역 */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">번호 설정</h2>

            <div className="space-y-4">
              {/* 범위 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    최소값
                  </label>
                  <input
                    type="number"
                    id="minValue"
                    value={minValue}
                    onChange={(e) => setMinValue(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    disabled={isSpinning}
                  />
                </div>
                <div>
                  <label htmlFor="maxValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    최대값
                  </label>
                  <input
                    type="number"
                    id="maxValue"
                    value={maxValue}
                    onChange={(e) => setMaxValue(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    disabled={isSpinning}
                  />
                </div>
              </div>

              {/* 뽑을 개수 */}
              <div>
                <label htmlFor="pickCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  뽑을 개수: {pickCount}개
                </label>
                <input
                  type="range"
                  id="pickCount"
                  min="1"
                  max="10"
                  value={pickCount}
                  onChange={(e) => setPickCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  disabled={isSpinning}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1개</span>
                  <span>5개</span>
                  <span>10개</span>
                </div>
              </div>

              {/* 옵션 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowDuplicates"
                    checked={allowDuplicates}
                    onChange={(e) => setAllowDuplicates(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={isSpinning}
                  />
                  <label htmlFor="allowDuplicates" className="text-sm text-gray-700 dark:text-gray-300">
                    중복 허용
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sortResults"
                    checked={sortResults}
                    onChange={(e) => setSortResults(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={isSpinning}
                  />
                  <label htmlFor="sortResults" className="text-sm text-gray-700 dark:text-gray-300">
                    오름차순 정렬
                  </label>
                </div>
              </div>

              {/* 검증 오류 */}
              {validationError && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">⚠️ {validationError}</p>
                </div>
              )}
            </div>

            {/* 설정 요약 */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">설정 요약</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>• 범위: {minValue} ~ {maxValue} ({maxValue - minValue + 1}개)</p>
                <p>• 추첨 개수: {pickCount}개</p>
                <p>• 중복: {allowDuplicates ? '허용' : '불허'}</p>
                <p>• 정렬: {sortResults ? '오름차순' : '추첨 순서'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 오른쪽: 추첨 결과 */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">추첨 결과</h2>

            {/* 디지털 디스플레이 */}
            <div className="relative mb-6">
              <div className="bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-purple-900 dark:to-indigo-800 rounded-2xl p-8 border-4 border-purple-400 dark:border-purple-600 shadow-lg min-h-[280px] flex items-center justify-center">
                {isSpinning || pickedNumbers.length > 0 ? (
                  <div className="w-full">
                    {isSpinning && (
                      <div className="text-center mb-4 text-sm font-medium text-purple-700 dark:text-purple-300">
                        {currentSlot + 1}번째 번호 추첨 중...
                      </div>
                    )}

                    {/* 숫자 슬롯들 */}
                    <div className="grid grid-cols-5 gap-3">
                      {getDisplayNumbers().map((num, index) => (
                        <div
                          key={`slot-${index}`}
                          className={`
                            relative aspect-square flex items-center justify-center rounded-xl border-4 font-mono font-bold text-2xl transition-all duration-300
                            ${isSlotActive(index)
                              ? 'border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200 animate-pulse shadow-lg scale-110'
                              : isSlotCompleted(index) && !isSpinning
                              ? 'border-purple-500 bg-gradient-to-br from-purple-200 to-indigo-300 text-purple-800 shadow-md'
                              : 'border-gray-300 bg-white text-gray-400 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-500'
                            }
                          `}
                          style={{
                            animationDelay: `${index * 0.1}s`
                          }}
                        >
                          {num !== undefined ? num : '?'}
                          {isSlotActive(index) && (
                            <div className="absolute inset-0 bg-yellow-300/30 rounded-lg animate-ping" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 완료 메시지 */}
                    {!isSpinning && pickedNumbers.length > 0 && (
                      <div className="mt-6 text-center">
                        <div className="text-xl font-medium text-purple-700 dark:text-purple-300 mb-3">
                          🎉 추첨 완료! 🎉
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {getDisplayNumbers().map((num, index) => (
                            <div
                              key={`result-${num}-${index}`}
                              className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-mono font-bold text-lg rounded-full shadow-lg animate-bounce"
                              style={{
                                animationDelay: `${index * 0.1}s`,
                                animationDuration: '1s'
                              }}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <div className="text-6xl mb-4">🔢</div>
                    <p className="text-lg">추첨을 시작하세요</p>
                    <p className="text-sm mt-2">디지털 숫자가 롤링됩니다</p>
                  </div>
                )}
              </div>

              {isSpinning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-white/10 dark:bg-black/10 rounded-2xl animate-pulse" />
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3">
              <Button
                onClick={startSpin}
                disabled={isSpinning || !!validationError}
                className="flex-1 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
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
              <div className="max-h-64 overflow-y-auto space-y-3">
                {history.map((numbers, index) => (
                  <div
                    key={`history-${numbers.join('-')}-${index}`}
                    className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-500 text-white font-bold rounded-full text-xs">
                        {history.length - index}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {numbers.length}개 추첨
                      </span>
                      {index === 0 && (
                        <span className="ml-auto text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                          최근
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {numbers.map((num, numIndex) => (
                        <div
                          key={`num-${num}-${numIndex}`}
                          className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-mono font-bold rounded-lg shadow text-sm"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
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
