'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LadderParticipant, LadderResult } from '@/types';

interface HorizontalLine {
  fromIndex: number;
  y: number;
}

interface LadderPath {
  x: number;
  y: number;
  direction?: 'down' | 'right' | 'left';
}

interface LadderGameProps {
  className?: string;
}

export default function LadderGame({ className = '' }: LadderGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [participantCount, setParticipantCount] = useState(4);
  const [participants, setParticipants] = useState<LadderParticipant[]>([]);
  const [results, setResults] = useState<LadderResult[]>([]);
  const [ladder, setLadder] = useState<HorizontalLine[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedResults, setRevealedResults] = useState<Set<number>>(new Set());
  const animationFrameRef = useRef<number | undefined>(undefined);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PADDING = 80;
  const TOP_MARGIN = 60;
  const BOTTOM_MARGIN = 60;

  // 참가자 수 변경 시 초기화
  useEffect(() => {
    const newParticipants: LadderParticipant[] = Array.from({ length: participantCount }, (_, i) => ({
      id: `participant-${i}`,
      name: `참가자 ${i + 1}`,
    }));
    const newResults: LadderResult[] = Array.from({ length: participantCount }, (_, i) => ({
      id: `result-${i}`,
      name: i === 0 ? '당첨' : '꽝',
    }));
    setParticipants(newParticipants);
    setResults(newResults);
    setRevealedResults(new Set());
    setSelectedIndex(null);
    generateLadder(participantCount);
  }, [participantCount]);

  // 사다리 생성 로직
  const generateLadder = useCallback((count: number) => {
    const lines: HorizontalLine[] = [];
    const ladderHeight = CANVAS_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
    const segmentHeight = 50;
    const segments = Math.floor(ladderHeight / segmentHeight);

    for (let segment = 1; segment < segments; segment++) {
      const y = TOP_MARGIN + segment * segmentHeight;
      const availablePositions = Array.from({ length: count - 1 }, (_, i) => i);

      // 각 세그먼트에 1-3개의 가로선 추가
      const lineCount = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < lineCount && availablePositions.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        const fromIndex = availablePositions[randomIndex];
        availablePositions.splice(randomIndex, 1);

        // 인접한 위치 제거하여 겹치지 않도록
        const leftIndex = availablePositions.indexOf(fromIndex - 1);
        if (leftIndex !== -1) availablePositions.splice(leftIndex, 1);
        const rightIndex = availablePositions.indexOf(fromIndex + 1);
        if (rightIndex !== -1) availablePositions.splice(rightIndex, 1);

        lines.push({ fromIndex, y });
      }
    }

    setLadder(lines);
  }, []);

  // 경로 계산
  const calculatePath = useCallback((startIndex: number, count: number): LadderPath[] => {
    const path: LadderPath[] = [];
    const lineSpacing = (CANVAS_WIDTH - PADDING * 2) / (count - 1);
    const ladderHeight = CANVAS_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

    let currentX = PADDING + startIndex * lineSpacing;
    let currentY = TOP_MARGIN;
    let currentIndex = startIndex;

    path.push({ x: currentX, y: currentY });

    const sortedLines = [...ladder].sort((a, b) => a.y - b.y);
    const usedLines = new Set<number>();

    for (const line of sortedLines) {
      // 현재 위치까지 이동
      if (currentY < line.y) {
        path.push({ x: currentX, y: line.y, direction: 'down' });
        currentY = line.y;
      }

      const lineId = sortedLines.indexOf(line);
      if (usedLines.has(lineId)) continue;

      // 가로선을 만났는지 확인
      if (line.fromIndex === currentIndex) {
        // 오른쪽으로 이동
        currentIndex++;
        currentX = PADDING + currentIndex * lineSpacing;
        path.push({ x: currentX, y: currentY, direction: 'right' });
        usedLines.add(lineId);
      } else if (line.fromIndex === currentIndex - 1) {
        // 왼쪽으로 이동
        currentIndex--;
        currentX = PADDING + currentIndex * lineSpacing;
        path.push({ x: currentX, y: currentY, direction: 'left' });
        usedLines.add(lineId);
      }
    }

    // 마지막 지점까지 이동
    const finalY = CANVAS_HEIGHT - BOTTOM_MARGIN;
    if (currentY < finalY) {
      path.push({ x: currentX, y: finalY, direction: 'down' });
    }

    return path;
  }, [ladder]);

  // Canvas 그리기
  const drawLadder = useCallback((ctx: CanvasRenderingContext2D, count: number, highlightPath?: LadderPath[], animationProgress?: number) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const lineSpacing = (CANVAS_WIDTH - PADDING * 2) / (count - 1);
    const ladderHeight = CANVAS_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

    // 세로선 그리기
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 3;

    for (let i = 0; i < count; i++) {
      const x = PADDING + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(x, TOP_MARGIN);
      ctx.lineTo(x, CANVAS_HEIGHT - BOTTOM_MARGIN);
      ctx.stroke();
    }

    // 가로선 그리기
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 3;

    for (const line of ladder) {
      const x1 = PADDING + line.fromIndex * lineSpacing;
      const x2 = PADDING + (line.fromIndex + 1) * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(x1, line.y);
      ctx.lineTo(x2, line.y);
      ctx.stroke();
    }

    // 경로 하이라이트 그리기
    if (highlightPath && highlightPath.length > 1 && animationProgress !== undefined) {
      const pathLength = highlightPath.length;
      const currentSegment = Math.min(Math.floor(animationProgress * pathLength), pathLength - 1);
      const segmentProgress = (animationProgress * pathLength) % 1;

      // 지나간 경로 그리기
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < currentSegment; i++) {
        ctx.beginPath();
        ctx.moveTo(highlightPath[i].x, highlightPath[i].y);
        ctx.lineTo(highlightPath[i + 1].x, highlightPath[i + 1].y);
        ctx.stroke();
      }

      // 현재 세그먼트 그리기
      if (currentSegment < pathLength - 1) {
        const start = highlightPath[currentSegment];
        const end = highlightPath[currentSegment + 1];
        const currentX = start.x + (end.x - start.x) * segmentProgress;
        const currentY = start.y + (end.y - start.y) * segmentProgress;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // 이동 중인 마커 그리기
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [ladder]);

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawLadder(ctx, participantCount);
  }, [ladder, participantCount, drawLadder]);

  // 애니메이션 실행
  const animatePath = useCallback((path: LadderPath[], resultIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsAnimating(true);
    const duration = 2000; // 2초
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      drawLadder(ctx, participantCount, path, progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setRevealedResults(prev => new Set(prev).add(resultIndex));
      }
    };

    animate();
  }, [participantCount, drawLadder]);

  // 참가자 선택
  const handleParticipantClick = (index: number) => {
    if (isAnimating) return;

    setSelectedIndex(index);
    const path = calculatePath(index, participantCount);

    // 결과 인덱스 계산
    const finalX = path[path.length - 1].x;
    const lineSpacing = (CANVAS_WIDTH - PADDING * 2) / (participantCount - 1);
    const resultIndex = Math.round((finalX - PADDING) / lineSpacing);

    animatePath(path, resultIndex);
  };

  // 참가자 이름 변경
  const handleParticipantNameChange = (index: number, name: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], name };
    setParticipants(newParticipants);
  };

  // 결과 이름 변경
  const handleResultNameChange = (index: number, name: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], name };
    setResults(newResults);
  };

  // 사다리 재생성
  const handleRegenerate = () => {
    setRevealedResults(new Set());
    setSelectedIndex(null);
    generateLadder(participantCount);
  };

  // 초기화
  const handleReset = () => {
    setRevealedResults(new Set());
    setSelectedIndex(null);
  };

  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {/* 설정 패널 */}
      <Card className="p-6 lg:w-80 flex-shrink-0">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">게임 설정</h3>

        {/* 참가자 수 설정 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            참가자 수: {participantCount}명
          </label>
          <input
            type="range"
            min="2"
            max="8"
            value={participantCount}
            onChange={(e) => setParticipantCount(Number(e.target.value))}
            className="w-full accent-orange-500"
            disabled={isAnimating}
          />
        </div>

        {/* 참가자 이름 입력 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">참가자 이름</h4>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <input
                key={participant.id}
                type="text"
                value={participant.name}
                onChange={(e) => handleParticipantNameChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder={`참가자 ${index + 1}`}
                disabled={isAnimating}
              />
            ))}
          </div>
        </div>

        {/* 결과 입력 */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">결과 설정</h4>
          <div className="space-y-2">
            {results.map((result, index) => (
              <input
                key={result.id}
                type="text"
                value={result.name}
                onChange={(e) => handleResultNameChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder={`결과 ${index + 1}`}
                disabled={isAnimating}
              />
            ))}
          </div>
        </div>

        {/* 버튼들 */}
        <div className="space-y-2">
          <Button
            onClick={handleRegenerate}
            disabled={isAnimating}
            className="w-full bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
          >
            사다리 새로 만들기
          </Button>
          <Button
            onClick={handleReset}
            disabled={isAnimating}
            variant="outline"
            className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            결과 초기화
          </Button>
        </div>
      </Card>

      {/* 게임 영역 */}
      <div className="flex-1">
        <Card className="p-6">
          {/* 참가자 버튼들 */}
          <div className="mb-4">
            <div className="flex justify-around items-center px-8">
              {participants.map((participant, index) => (
                <button
                  key={participant.id}
                  onClick={() => handleParticipantClick(index)}
                  disabled={isAnimating}
                  className={`
                    w-16 h-16 rounded-full font-medium text-sm transition-all duration-200
                    ${selectedIndex === index
                      ? 'bg-orange-500 text-white scale-110 shadow-lg'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200 hover:scale-105'
                    }
                    ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {participant.name.length > 6
                    ? participant.name.substring(0, 5) + '...'
                    : participant.name}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex justify-center mb-4 bg-gray-50 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="max-w-full h-auto"
            />
          </div>

          {/* 결과 표시 */}
          <div className="mt-4">
            <div className="flex justify-around items-center px-8">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className={`
                    w-20 h-20 rounded-lg flex items-center justify-center font-medium text-sm
                    transition-all duration-300
                    ${revealedResults.has(index)
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg scale-110'
                      : 'bg-gray-200 text-gray-400'
                    }
                  `}
                >
                  {revealedResults.has(index) ? result.name : '?'}
                </div>
              ))}
            </div>
          </div>

          {/* 사용 방법 */}
          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">사용 방법</h4>
            <ol className="text-sm text-orange-800 space-y-1 list-decimal list-inside">
              <li>참가자 수를 설정하고 이름을 입력하세요</li>
              <li>결과를 원하는 대로 설정하세요</li>
              <li>상단의 참가자 버튼을 클릭하면 경로가 표시됩니다</li>
              <li>모든 경로를 확인했다면 사다리를 새로 만들 수 있습니다</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
}
