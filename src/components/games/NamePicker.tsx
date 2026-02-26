'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PresetPanel from '@/components/ui/PresetPanel';
import { pickRandomMultiple, pickRandom } from '@/lib/random';
import type { NamePresetData } from '@/types/preset';

interface Winner {
  name: string;
  rank: number;
  timestamp: number;
}

export default function NamePicker() {
  const [inputText, setInputText] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [currentRank, setCurrentRank] = useState<number>(0);
  const [pickCount, setPickCount] = useState<number>(1);
  const [removeAfterPick, setRemoveAfterPick] = useState(false);
  const [history, setHistory] = useState<Winner[][]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const cancelledRef = useRef(false);

  // 이슈 #2: ref 직접 참조로 cleanup (stale ref 방지)
  // 이슈 #3: animationFrameRef 제거 (dead code)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    const newNames = text
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    setNames(newNames);
  };

  const spinForSingleWinner = (
    availableNames: string[],
    rankNumber: number,
    onComplete: (winner: Winner) => void
  ) => {
    let spinCount = 0;
    const maxSpins = 30;
    const baseDelay = 50;

    const spin = () => {
      if (cancelledRef.current) return;
      if (spinCount < maxSpins) {
        const randomName = pickRandom(availableNames);
        if (randomName) {
          setDisplayName(randomName);
        }

        spinCount++;
        const delay = baseDelay + (spinCount * 10);

        timeoutRef.current = setTimeout(spin, delay);
      } else {
        const winnerName = pickRandom(availableNames);
        if (winnerName) {
          const winner: Winner = {
            name: winnerName,
            rank: rankNumber,
            timestamp: Date.now()
          };
          setDisplayName(winnerName);
          onComplete(winner);
        }
      }
    };

    spin();
  };

  const startSpin = () => {
    // 이슈 #4: alert() -> validationError state
    if (names.length === 0) {
      setValidationError('참가자 이름을 입력해주세요!');
      return;
    }

    if (pickCount > names.length) {
      setValidationError(`추첨 인원(${pickCount}명)이 참가자 수(${names.length}명)보다 많습니다!`);
      return;
    }

    if (isSpinning) return;

    setValidationError('');
    cancelledRef.current = false;
    setIsSpinning(true);
    setWinners([]);
    setCurrentRank(0);

    let currentNames = [...names];
    const newWinners: Winner[] = [];
    let currentRankIndex = 0;

    const pickNext = () => {
      if (currentRankIndex < pickCount) {
        if (cancelledRef.current) return;
        setCurrentRank(currentRankIndex + 1);

        spinForSingleWinner(currentNames, currentRankIndex + 1, (winner) => {
          newWinners.push(winner);
          setWinners([...newWinners]);

          // 이슈 #5: filter -> splice (첫 번째 매칭만 제거)
          if (removeAfterPick) {
            const winnerIdx = currentNames.indexOf(winner.name);
            if (winnerIdx !== -1) {
              currentNames = [...currentNames];
              currentNames.splice(winnerIdx, 1);
            }
          }

          currentRankIndex++;

          if (currentRankIndex < pickCount) {
            timeoutRef.current = setTimeout(pickNext, 1000);
          } else {
            setHistory(prev => [newWinners, ...prev]);

            if (removeAfterPick) {
              setNames(currentNames);
              setInputText(currentNames.join('\n'));
            }

            setIsSpinning(false);
            setCurrentRank(0);
          }
        });
      }
    };

    pickNext();
  };

  const handleReset = () => {
    cancelledRef.current = true;
    setWinners([]);
    setDisplayName('');
    setHistory([]);
    setCurrentRank(0);
    setValidationError('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSpinning(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-500';
      default:
        return 'bg-gradient-to-r from-green-400 to-green-500';
    }
  };

  const getRankLabel = (rank: number) => {
    if (pickCount === 1) return '당첨';
    return `${rank}번`;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 입력 영역 */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">참가자 목록</h2>
            <textarea
              value={inputText}
              onChange={handleInputChange}
              placeholder="참가자 이름을 한 줄씩 입력하세요&#10;예시:&#10;김철수&#10;이영희&#10;박민수&#10;최지은"
              className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200 dark:bg-slate-700 dark:text-white"
              disabled={isSpinning}
            />

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="pickCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  뽑을 인원 수: {pickCount}명
                </label>
                <input
                  type="range"
                  id="pickCount"
                  min="1"
                  max="5"
                  value={pickCount}
                  onChange={(e) => setPickCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                  disabled={isSpinning}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1명</span>
                  <span>2명</span>
                  <span>3명</span>
                  <span>4명</span>
                  <span>5명</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="removeAfterPick"
                  checked={removeAfterPick}
                  onChange={(e) => setRemoveAfterPick(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  disabled={isSpinning}
                />
                <label htmlFor="removeAfterPick" className="text-sm text-gray-700 dark:text-gray-300">
                  당첨된 이름은 목록에서 제거
                </label>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  등록된 참가자 ({names.length}명)
                </h3>
              </div>
              {names.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {names.map((name, index) => (
                    <div
                      key={`participant-${name}-${index}`}
                      className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-green-600">👤</span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  등록된 참가자가 없습니다
                </p>
              )}
            </div>

            <PresetPanel<NamePresetData>
              gameType="name"
              getCurrentData={() => ({ names: inputText, pickCount, removeAfterPick })}
              onLoad={(data) => {
                setInputText(data.names);
                setNames(data.names.split('\n').map((s) => s.trim()).filter(Boolean));
                setPickCount(data.pickCount);
                setRemoveAfterPick(data.removeAfterPick);
              }}
              disabled={isSpinning}
            />
          </Card>
        </div>

        {/* 오른쪽: 추첨 결과 */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">추첨 결과</h2>

            {/* 이슈 #4: 인라인 검증 메시지 */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-600">{validationError}</p>
              </div>
            )}

            {/* 슬롯 머신 디스플레이 */}
            <div className="relative mb-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-800 rounded-2xl p-8 border-4 border-green-400 dark:border-green-600 shadow-lg min-h-[200px] flex items-center justify-center">
                {isSpinning || winners.length > 0 ? (
                  <div className="text-center w-full">
                    {isSpinning && (
                      <div className="mb-4 text-sm font-medium text-green-700">
                        {currentRank > 0 && `${getRankLabel(currentRank)} 추첨 중...`}
                      </div>
                    )}
                    <div
                      className={`transition-all duration-300 ${
                        isSpinning
                          ? 'animate-bounce'
                          : 'scale-110'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <span className="text-4xl">👤</span>
                        <div
                          className={`text-3xl font-bold ${
                            isSpinning ? 'text-gray-700' : 'text-green-600'
                          }`}
                        >
                          {displayName}
                        </div>
                      </div>
                    </div>

                    {/* 당첨자 카드들 */}
                    {!isSpinning && winners.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div className="text-xl font-medium text-green-700 mb-4">
                          🎉 축하합니다! 🎉
                        </div>
                        <div className="grid gap-2">
                          {winners.map((winner, index) => (
                            <div
                              key={`winner-${winner.rank}-${winner.timestamp}`}
                              className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-2 border-green-300 dark:border-green-600 animate-pulse"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div
                                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center ${getRankBadgeColor(
                                  winner.rank
                                )} text-white font-bold rounded-full text-sm shadow-md`}
                              >
                                {winner.rank}
                              </div>
                              <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                                {winner.name}
                              </span>
                              <span className="ml-auto text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                {getRankLabel(winner.rank)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <div className="text-6xl mb-4">👥</div>
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
                disabled={isSpinning || names.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500"
                size="lg"
              >
                {isSpinning ? '추첨 중...' : '🎲 추첨하기'}
              </Button>
              {/* 이슈 #6: spinning 중에도 초기화 가능하도록 disabled 제거 */}
              <Button
                onClick={handleReset}
                variant="secondary"
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
              <div className="max-h-96 overflow-y-auto space-y-4">
                {history.map((winnerGroup, groupIndex) => (
                  <div
                    key={`history-${winnerGroup[0]?.timestamp ?? groupIndex}`}
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-500 text-white font-bold rounded-full text-xs">
                        {history.length - groupIndex}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {winnerGroup.length}명 추첨
                      </span>
                      {groupIndex === 0 && (
                        <span className="ml-auto text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                          최근
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 ml-8">
                      {winnerGroup.map((winner) => (
                        <div
                          key={`history-winner-${winner.rank}-${winner.timestamp}`}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span
                            className={`w-6 h-6 flex items-center justify-center ${getRankBadgeColor(
                              winner.rank
                            )} text-white font-bold rounded-full text-xs`}
                          >
                            {winner.rank}
                          </span>
                          <span>{winner.name}</span>
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
