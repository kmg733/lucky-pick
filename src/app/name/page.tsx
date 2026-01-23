import NamePicker from '@/components/games/NamePicker';

export default function NamePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          👤 이름 추첨
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          참가자 이름을 입력하고 당첨자를 뽑습니다.
        </p>
        <div className="max-w-3xl mx-auto bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-green-800 mb-2">💡 사용 방법</h2>
          <ul className="text-sm text-green-700 space-y-1 text-left">
            <li>• 왼쪽 입력란에 참가자 이름을 한 줄씩 입력하세요</li>
            <li>• 슬라이더로 한 번에 뽑을 인원 수를 선택하세요 (1~5명)</li>
            <li>• 여러 명을 뽑으면 순차적으로 한 명씩 추첨됩니다</li>
            <li>• 당첨된 이름을 목록에서 제거하려면 체크박스를 선택하세요</li>
            <li>• 추첨 이력은 하단에 자동으로 기록됩니다</li>
          </ul>
        </div>
      </div>

      <NamePicker />
    </div>
  );
}
