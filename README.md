# Lucky Pick - 공정한 추첨 게임 모음

[한국어](#한국어) | [English](#english)

---

<a id="한국어"></a>

## 한국어

### 소개

**Lucky Pick**은 공정하고 재미있는 추첨 게임 모음 웹 애플리케이션입니다. 상품 추첨, 이름 추첨, 번호 뽑기, 사다리 타기 등 4가지 게임을 제공하며, 모든 게임은 **암호학적으로 안전한 난수 생성기(CSPRNG)**를 사용하여 공정성을 보장합니다.

### 게임 목록

| 게임 | 경로 | 설명 |
|------|------|------|
| 🎁 **상품 추첨** | `/prize` | 여러 상품을 등록하고 슬롯머신 애니메이션으로 당첨자를 추첨합니다 |
| 👤 **이름 추첨** | `/name` | 참가자 이름을 입력하고 1~5명의 당첨자를 순차적으로 뽑습니다 |
| 🔢 **번호 뽑기** | `/number` | 지정한 범위에서 1~10개의 랜덤 번호를 생성합니다 |
| 🪜 **사다리 타기** | `/ladder` | 2~8명이 참여하는 캔버스 기반 사다리 게임입니다 |

### 주요 기능

- **CSPRNG 기반 공정한 추첨** — `crypto.getRandomValues()` 사용
- **다크 모드** — 시스템 설정 자동 감지 및 수동 전환
- **프리셋 저장** — 게임별 설정을 저장하고 불러올 수 있음 (최대 5개)
- **추첨 기록** — 라운드별 당첨 기록을 화면에 표시
- **중복 제거 옵션** — 당첨자를 풀에서 제거하는 기능
- **반응형 디자인** — 모바일과 데스크톱 모두 지원
- **정적 배포** — 서버 없이 GitHub Pages, Vercel 등에 배포 가능

---

### 게임 공정성 보장 방식

Lucky Pick은 다음 세 가지 기둥으로 게임의 공정성을 보장합니다.

#### 1. 암호학적으로 안전한 난수 생성 (CSPRNG)

모든 랜덤 로직은 예측 가능한 `Math.random()` 대신 **Web Crypto API의 `crypto.getRandomValues()`** 를 사용합니다. 이 API는 운영체제의 엔트로피 소스로부터 암호학적으로 안전한 난수를 생성하며, 외부에서 예측하는 것이 사실상 불가능합니다.

```typescript
// src/lib/random.ts
function secureRandomFloat(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);   // OS 엔트로피 기반 CSPRNG
  return array[0] / 4294967296;    // [0, 1) 범위의 균등 분포
}
```

**`Math.random()` vs `crypto.getRandomValues()` 비교**:

| 항목 | Math.random() | crypto.getRandomValues() |
|------|---------------|--------------------------|
| 보안 수준 | 예측 가능 (PRNG) | 암호학적 보안 (CSPRNG) |
| 엔트로피 소스 | 소프트웨어 시드 | OS 하드웨어 엔트로피 |
| 시드 추측 가능성 | 가능 | 사실상 불가능 |
| 적합한 용도 | 시뮬레이션, 비보안 | 추첨, 암호화, 보안 |

#### 2. Fisher-Yates 셔플 알고리즘

배열 무작위 섞기에는 학술적으로 검증된 **Fisher-Yates (Knuth) 셔플 알고리즘**을 사용합니다. 이 알고리즘은 모든 순열이 동일한 확률로 나타나는 것이 수학적으로 증명되어 있습니다.

```typescript
// src/lib/random.ts
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];              // 원본 보존
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandomFloat() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

- n개 요소의 모든 순열(n!)이 동일한 확률로 생성됨
- 원본 배열을 변경하지 않음 (불변성 보장)
- 각 교환 단계에서 CSPRNG 난수를 사용

#### 3. 통계적 균등 분포 검증 (자동화 테스트)

공정성은 주장이 아니라 **5,000회 반복 실행을 통한 통계적 검증**으로 증명됩니다.

```
테스트 시나리오: [0, 1, 2, 3, 4] 배열에서 2개 선택, 5000회 반복

기대 빈도: 5000 × 2 ÷ 5 = 2000회 (요소당)
허용 범위: ±20% → 1600회 ~ 2400회

검증 항목:
  ✅ 각 요소의 전체 선택 빈도가 기대값 ±20% 이내
  ✅ 각 위치에 각 요소가 균일하게 분포
  ✅ 첫 번째 위치에 나타나는 요소가 균일하게 분포
```

**테스트 스위트 구성** (`src/test/random.test.ts`):

| 검증 영역 | 테스트 수 | 내용 |
|-----------|-----------|------|
| CSPRNG 사용 검증 | 4 | `Math.random()` 미호출 + `crypto.getRandomValues()` 호출 확인 |
| 정확성 검증 | 13 | 엣지 케이스, 원본 불변성, 반환값 범위 |
| 균등 분포 검증 | 3 | 요소별 빈도, 위치별 분포, 첫 위치 분포 |
| **합계** | **20+** | |

#### 게임별 공정성 적용

| 게임 | 사용 함수 | 공정성 메커니즘 |
|------|----------|----------------|
| 상품 추첨 | `pickRandom()` | CSPRNG로 단일 항목 선택, 애니메이션은 결과에 영향 없음 |
| 이름 추첨 | `pickRandom()` | 순차 선택 시 매 회차 독립적 CSPRNG 호출 |
| 번호 뽑기 | `generateRandomNumber()` | 범위 내 균등 확률 정수 생성 |
| 사다리 타기 | `shuffleArray()` + `generateRandomNumber()` | Fisher-Yates로 결과 매핑, CSPRNG로 라인 배치 |

#### 비적용 사항 (의도적)

| 기법 | 미적용 이유 |
|------|-----------|
| Blockchain 검증 | 클라이언트 사이드 게임으로 불필요 |
| Commit-Reveal 스킴 | 서버가 없는 정적 앱 |
| 시드 기반 재현성 | 무상태(stateless) 설계로 조작 원천 차단 |

> Lucky Pick은 클라이언트에서 실행되는 오픈소스 앱이므로, 코드를 직접 검증하여 공정성을 확인할 수 있습니다.

---

### 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | ^16.1 |
| UI 라이브러리 | React | 19.2 |
| 언어 | TypeScript | ^5 |
| 스타일링 | Tailwind CSS | v4 |
| 테스트 | Vitest + Testing Library | ^4.0 |
| 테스트 환경 | jsdom | ^28.1 |
| 빌드 | Next.js Static Export | - |
| 폰트 | Geist Sans / Geist Mono | - |

### 프로젝트 구조

```
lucky-pick/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── layout.tsx          # 루트 레이아웃 (테마, 헤더, 푸터)
│   │   ├── page.tsx            # 홈 (게임 카드 목록)
│   │   ├── prize/page.tsx      # 상품 추첨
│   │   ├── name/page.tsx       # 이름 추첨
│   │   ├── number/page.tsx     # 번호 뽑기
│   │   └── ladder/page.tsx     # 사다리 타기
│   ├── components/
│   │   ├── games/              # 게임 컴포넌트 (PrizePicker, NamePicker 등)
│   │   ├── layout/             # Header, Footer
│   │   └── ui/                 # Button, Card, Input, PresetPanel 등
│   ├── contexts/               # ThemeContext (다크 모드)
│   ├── hooks/                  # useTheme, usePreset
│   ├── lib/                    # random.ts, presetStorage.ts, messages.ts
│   ├── types/                  # 타입 정의
│   └── test/                   # 테스트 파일 (12개)
├── public/                     # 정적 자산
├── next.config.ts              # Static Export 설정
├── vitest.config.ts            # 테스트 설정 (80% 커버리지 임계치)
└── package.json
```

### 시작하기

#### 요구 사항

- Node.js 18+
- npm, yarn, pnpm 또는 bun

#### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/kmg733/lucky-pick.git
cd lucky-pick

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

#### 빌드 및 배포

```bash
# 정적 빌드 (out/ 디렉토리에 생성)
npm run build

# 테스트 실행
npm test

# 커버리지 리포트
npm run test:coverage
```

`out/` 디렉토리를 GitHub Pages, Vercel, Netlify 등 정적 호스팅에 배포할 수 있습니다.

### 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 정적 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm test` | 전체 테스트 실행 |
| `npm run test:watch` | 파일 변경 감지 모드 테스트 |
| `npm run test:coverage` | 커버리지 리포트 생성 |

### 테스트

12개 테스트 파일로 구성되어 있으며, 모든 핵심 모듈에 대해 80% 이상의 커버리지를 보장합니다.

| 테스트 파일 | 대상 |
|------------|------|
| `random.test.ts` | CSPRNG, Fisher-Yates, 균등 분포 검증 |
| `presetStorage.test.ts` | 프리셋 CRUD, XSS 방어, 크기 제한 |
| `PrizePicker.test.tsx` | 상품 추첨 UI 및 로직 |
| `NamePicker.test.tsx` | 이름 추첨 UI 및 로직 |
| `NumberPicker.test.tsx` | 번호 뽑기 UI 및 로직 |
| `LadderGame.test.tsx` | 사다리 게임 캔버스 및 애니메이션 |
| `PresetPanel.test.tsx` | 프리셋 저장/불러오기/삭제 |
| `ConfirmDialog.test.tsx` | 확인 다이얼로그 접근성 |
| `ThemeContext.test.tsx` | 테마 전환 및 localStorage 동기화 |
| `ThemeToggle.test.tsx` | 테마 토글 버튼 |
| `usePreset.test.tsx` | 프리셋 훅 |

### 라이선스

MIT License — [LICENSE](./LICENSE) 참조

---
---

<a id="english"></a>

## English

### Introduction

**Lucky Pick** is a collection of fair and fun lottery game web applications. It offers 4 games — Prize Draw, Name Picker, Number Picker, and Ladder Game — all powered by a **Cryptographically Secure Pseudo-Random Number Generator (CSPRNG)** to guarantee fairness.

### Games

| Game | Path | Description |
|------|------|-------------|
| 🎁 **Prize Draw** | `/prize` | Register prizes and draw winners with a slot machine animation |
| 👤 **Name Picker** | `/name` | Enter participant names and draw 1–5 winners sequentially |
| 🔢 **Number Picker** | `/number` | Generate 1–10 random numbers from a custom range |
| 🪜 **Ladder Game** | `/ladder` | Canvas-based ladder game for 2–8 participants |

### Key Features

- **CSPRNG-based fair draws** — Uses `crypto.getRandomValues()`
- **Dark mode** — Auto-detects system preference with manual toggle
- **Preset system** — Save and load game configurations (up to 5 per game)
- **Draw history** — Displays results by round
- **Remove-after-pick** — Option to remove winners from the pool
- **Responsive design** — Works on mobile and desktop
- **Static deployment** — No server required; deploy to GitHub Pages, Vercel, etc.

---

### How Game Fairness Is Guaranteed

Lucky Pick ensures game fairness through three pillars.

#### 1. Cryptographically Secure Random Number Generation (CSPRNG)

All random logic uses the **Web Crypto API's `crypto.getRandomValues()`** instead of the predictable `Math.random()`. This API generates cryptographically secure random numbers from the operating system's entropy source, making prediction practically impossible.

```typescript
// src/lib/random.ts
function secureRandomFloat(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);   // OS entropy-based CSPRNG
  return array[0] / 4294967296;    // Uniform distribution in [0, 1)
}
```

**`Math.random()` vs `crypto.getRandomValues()`**:

| Property | Math.random() | crypto.getRandomValues() |
|----------|---------------|--------------------------|
| Security level | Predictable (PRNG) | Cryptographically secure (CSPRNG) |
| Entropy source | Software seed | OS hardware entropy |
| Seed guessability | Possible | Practically impossible |
| Suitable for | Simulations, non-security | Lotteries, cryptography, security |

#### 2. Fisher-Yates Shuffle Algorithm

Array shuffling uses the academically proven **Fisher-Yates (Knuth) shuffle algorithm**, which is mathematically proven to produce all permutations with equal probability.

```typescript
// src/lib/random.ts
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];              // Preserves original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandomFloat() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

- All n! permutations of n elements are equally likely
- Original array is never mutated (immutability guaranteed)
- Each swap step uses a CSPRNG random number

#### 3. Statistical Uniform Distribution Verification (Automated Tests)

Fairness is not just claimed — it is **proven through statistical verification over 5,000 iterations**.

```
Test scenario: Pick 2 from [0, 1, 2, 3, 4], repeated 5,000 times

Expected frequency: 5000 × 2 ÷ 5 = 2,000 per element
Tolerance: ±20% → 1,600 to 2,400

Verified:
  ✅ Overall selection frequency per element within ±20% of expected
  ✅ Uniform distribution of elements at each position
  ✅ Uniform distribution of first-position elements
```

**Test Suite** (`src/test/random.test.ts`):

| Verification Area | Tests | Description |
|-------------------|-------|-------------|
| CSPRNG usage | 4 | Confirms `Math.random()` is never called + `crypto.getRandomValues()` is called |
| Correctness | 13 | Edge cases, immutability, return value ranges |
| Uniform distribution | 3 | Per-element frequency, per-position distribution, first-position distribution |
| **Total** | **20+** | |

#### Fairness by Game

| Game | Function Used | Fairness Mechanism |
|------|---------------|-------------------|
| Prize Draw | `pickRandom()` | CSPRNG single-item selection; animation does not affect outcome |
| Name Picker | `pickRandom()` | Independent CSPRNG call for each sequential pick |
| Number Picker | `generateRandomNumber()` | Equal probability integer generation within range |
| Ladder Game | `shuffleArray()` + `generateRandomNumber()` | Fisher-Yates for result mapping, CSPRNG for rung placement |

#### Intentionally Not Implemented

| Technique | Reason |
|-----------|--------|
| Blockchain verification | Unnecessary for a client-side game |
| Commit-Reveal scheme | No server in this static app |
| Seed-based reproducibility | Stateless design prevents manipulation |

> Lucky Pick is an open-source client-side app — you can verify fairness by inspecting the code yourself.

---

### Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | ^16.1 |
| UI Library | React | 19.2 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | v4 |
| Testing | Vitest + Testing Library | ^4.0 |
| Test Environment | jsdom | ^28.1 |
| Build | Next.js Static Export | - |
| Font | Geist Sans / Geist Mono | - |

### Project Structure

```
lucky-pick/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (theme, header, footer)
│   │   ├── page.tsx            # Home (game card grid)
│   │   ├── prize/page.tsx      # Prize draw
│   │   ├── name/page.tsx       # Name picker
│   │   ├── number/page.tsx     # Number picker
│   │   └── ladder/page.tsx     # Ladder game
│   ├── components/
│   │   ├── games/              # Game components (PrizePicker, NamePicker, etc.)
│   │   ├── layout/             # Header, Footer
│   │   └── ui/                 # Button, Card, Input, PresetPanel, etc.
│   ├── contexts/               # ThemeContext (dark mode)
│   ├── hooks/                  # useTheme, usePreset
│   ├── lib/                    # random.ts, presetStorage.ts, messages.ts
│   ├── types/                  # Type definitions
│   └── test/                   # Test files (12 files)
├── public/                     # Static assets
├── next.config.ts              # Static Export config
├── vitest.config.ts            # Test config (80% coverage threshold)
└── package.json
```

### Getting Started

#### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

#### Installation

```bash
# Clone the repository
git clone https://github.com/kmg733/lucky-pick.git
cd lucky-pick

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Build & Deploy

```bash
# Static build (generates out/ directory)
npm run build

# Run tests
npm test

# Coverage report
npm run test:coverage
```

Deploy the `out/` directory to any static hosting service (GitHub Pages, Vercel, Netlify, etc.).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Static build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |

### Testing

The project includes 12 test files ensuring 80%+ coverage across all core modules.

| Test File | Coverage |
|-----------|----------|
| `random.test.ts` | CSPRNG, Fisher-Yates, uniform distribution |
| `presetStorage.test.ts` | Preset CRUD, XSS defense, size limits |
| `PrizePicker.test.tsx` | Prize draw UI and logic |
| `NamePicker.test.tsx` | Name picker UI and logic |
| `NumberPicker.test.tsx` | Number picker UI and logic |
| `LadderGame.test.tsx` | Ladder game canvas and animation |
| `PresetPanel.test.tsx` | Preset save/load/delete |
| `ConfirmDialog.test.tsx` | Confirm dialog accessibility |
| `ThemeContext.test.tsx` | Theme switching and localStorage sync |
| `ThemeToggle.test.tsx` | Theme toggle button |
| `usePreset.test.tsx` | Preset hook |

### License

MIT License — See [LICENSE](./LICENSE)
