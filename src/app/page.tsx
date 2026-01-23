import Link from 'next/link';
import Card from '@/components/ui/Card';
import type { GameCardInfo } from '@/types';

export default function Home() {
  const games: GameCardInfo[] = [
    {
      type: 'prize',
      title: '상품 추첨',
      description: '여러 상품을 등록하고 당첨자를 공정하게 추첨합니다.',
      icon: '🎁',
      href: '/prize'
    },
    {
      type: 'name',
      title: '이름 추첨',
      description: '참가자 이름을 입력하고 당첨자를 뽑습니다.',
      icon: '👤',
      href: '/name'
    },
    {
      type: 'number',
      title: '번호 뽑기',
      description: '지정한 범위에서 랜덤 번호를 생성합니다.',
      icon: '🔢',
      href: '/number'
    },
    {
      type: 'ladder',
      title: '사다리 타기',
      description: '클래식한 사다리 타기 게임을 즐겨보세요.',
      icon: '🪜',
      href: '/ladder'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Lucky Pick에 오신 것을 환영합니다
        </h1>
        <p className="text-lg text-gray-600">
          공정하고 재미있는 추첨 게임을 즐겨보세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {games.map((game) => (
          <Link key={game.type} href={game.href}>
            <Card hover className="p-6 h-full">
              <div className="flex flex-col items-center text-center space-y-4">
                <span className="text-6xl">{game.icon}</span>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {game.title}
                </h2>
                <p className="text-gray-600">
                  {game.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
