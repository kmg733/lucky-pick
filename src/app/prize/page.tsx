import PrizePicker from '@/components/games/PrizePicker';

export default function PrizePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          🎁 경품 추첨
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 text-center">
          여러 경품을 등록하고 공정하게 추첨합니다
        </p>

        {/* 사용 방법 안내 */}
        <div className="max-w-3xl mx-auto bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
            <span>📋</span>
            <span>사용 방법</span>
          </h2>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex gap-2">
              <span className="font-semibold">1.</span>
              <span>왼쪽 입력 영역에 경품을 한 줄씩 입력하세요</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">2.</span>
              <span>당첨된 경품을 목록에서 제거하려면 체크박스를 선택하세요</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">3.</span>
              <span>&quot;추첨하기&quot; 버튼을 눌러 룰렛 애니메이션을 시작하세요</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">4.</span>
              <span>당첨 결과가 화면에 표시되고 이력에 기록됩니다</span>
            </li>
          </ol>
        </div>
      </div>

      {/* PrizePicker 컴포넌트 */}
      <PrizePicker />
    </div>
  );
}
