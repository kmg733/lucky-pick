import LadderGame from '@/components/games/LadderGame';

export default function LadderPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🪜 사다리 타기
        </h1>
        <p className="text-lg text-gray-600">
          클래식한 사다리 타기 게임을 즐겨보세요.
        </p>
      </div>

      {/* 게임 컴포넌트 */}
      <LadderGame />

      {/* 게임 소개 */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-semibold text-gray-800 mb-2">공정한 추첨</h3>
          <p className="text-sm text-gray-600">
            랜덤 사다리 알고리즘으로 공정한 결과를 보장합니다
          </p>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
          <div className="text-3xl mb-3">✨</div>
          <h3 className="font-semibold text-gray-800 mb-2">부드러운 애니메이션</h3>
          <p className="text-sm text-gray-600">
            Canvas API로 구현한 실시간 경로 애니메이션
          </p>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
          <div className="text-3xl mb-3">🎨</div>
          <h3 className="font-semibold text-gray-800 mb-2">커스터마이징</h3>
          <p className="text-sm text-gray-600">
            참가자와 결과를 자유롭게 설정할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
