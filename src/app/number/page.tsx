import NumberPicker from '@/components/games/NumberPicker';

export default function NumberPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🔢 번호 뽑기
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          지정한 범위에서 랜덤 번호를 생성합니다.
        </p>
        <div className="max-w-2xl mx-auto bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-left">
          <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-2">📖 사용 방법</h3>
          <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
            <li>1️⃣ 최소값과 최대값을 설정하세요 (예: 1~100)</li>
            <li>2️⃣ 뽑을 번호 개수를 선택하세요 (1~10개)</li>
            <li>3️⃣ 중복 허용 여부와 정렬 옵션을 선택하세요</li>
            <li>4️⃣ 추첨하기 버튼을 클릭하면 디지털 숫자가 롤링됩니다</li>
            <li>5️⃣ 각 숫자가 순차적으로 확정되며, 최종 결과가 표시됩니다</li>
          </ul>
        </div>
      </div>

      <NumberPicker />
    </div>
  );
}
