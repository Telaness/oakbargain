# OAK BARGAIN 公式サイト

ヴィンテージジュエリーブランド **OAK BARGAIN** のブランド体験型公式ウェブサイト。

> 「時を旅した輝きに、次の物語を」

販売ツールではなく**ブランド体験ツール**として、訪問者がブランドの世界観に没入できる Three.js ベースのインタラクティブサイトです。実店舗・ポップアップへの誘導を主目的とします。

## サイトコンセプト

サイト全体を貫くメタファーは「**1本の木**」。スクロールに応じてカメラが木の根元から梢まで螺旋状に上昇し、各部位（幹・枝・葉・花）に対応する4つのジュエリーラインを発見していく構造です。

| ライン | 木の部位 | コンセプト |
|---|---|---|
| **Entry Line** | 幹（Trunk） | はじめての1つ、ここから |
| **Standard Line** | 枝（Branch） | 毎日つけたい定番 |
| **Premium Line** | 葉（Leaf） | 特別感を、日常に |
| **Luxury Line** | 花（Flower） | その輝きに、価値がある |

## 主な実装

- **3Dシーン**: React Three Fiber で構成された大樹（幹・枝・葉・花・草地・ジュエリー）。地面はカスタムシェーダーで草原を表現し、縁を暖色グローでぼかして自然の広大さを演出。
- **スクロール連動カメラ**: Lenis で滑らかに制御。木を4周しながら4ジュエリー位置でフォーカスする螺旋カメラリグ。
- **ライン詳細モーダル**: 各ジュエリーをクリックすると、額縁演出・落ち葉の払い落としインタラクション・ライン背景画像と説明テキストが順に展開。
- **環境演出**: ホタル / 浮遊する胞子 / 光の筋（ゴッドレイ）/ ダストパーティクル / 自然光 / 空気遠近の霧。
- **レスポンシブ**: PC / タブレット / スマートフォンで葉や草の数、UIレイアウトを最適化。
- **画像最適化**: 背景画像は WebP 化（合計 80MB → 約 810KB、99%削減）。

## 技術スタック

| カテゴリ | 採用技術 |
|---|---|
| フレームワーク | Next.js 15（App Router） |
| 言語 | TypeScript 5.x |
| 3D | Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing |
| アニメーション | GSAP |
| スクロール | Lenis |
| スタイリング | Tailwind CSS v4 |
| テスト | Vitest + Testing Library |
| デプロイ | Vercel |

## ディレクトリ構成

```
app/                    Next.js App Router（page.tsx, layout.tsx, /access, /story など）
components/
  three/                3Dシーン関連
    TreeScene.tsx         メインCanvas・地面・霧・ライティング
    TreeParts.tsx         幹・枝・根のジオメトリ
    Foliage.tsx           葉（InstancedMesh）
    Jewelry.tsx           4ラインのジュエリー
    LuxuryFlowers.tsx     Luxury用の花
    PremiumTwigLeaves.tsx Premium用の小枝
    LogoMesh.tsx          ロゴ3Dメッシュ
    CameraRig.tsx         スクロール連動カメラ制御
    EnvironmentEffects.tsx ホタル・胞子・光の筋
    DustParticles.tsx     インタラクティブダスト
  sections/             ページ単位のセクション（Hero, Home, Line）
  ui/                   モーダル・ナビ・トランジション等
hooks/                  useScrollProgress / useResponsive / useMousePosition
lib/                    定数（シーン設定・ライン設定・ブレイクポイント）
types/                  型定義
public/                 3Dモデル(.glb) / 画像 / Dracoデコーダー
docs/                   仕様書・コーディング規約
tests/                  Vitestテスト
```

## セットアップと開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev
# → http://localhost:3000

# 型チェック
pnpm type-check

# Lint
pnpm lint

# テスト
pnpm test         # 単発実行
pnpm test:watch   # 監視モード

# 本番ビルド
pnpm build
pnpm start
```

## ドキュメント

- [プロジェクト概要書](docs/specification/01_overview.md)
- [要件定義書](docs/specification/02_requirements.md)
- [基本設計書](docs/specification/03_basic_design.md)
- [詳細設計書](docs/specification/04_detail_design.md)

## デプロイ

Vercel（Edge Network）で運用。`main` ブランチへのマージで自動デプロイ。
