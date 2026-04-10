# OAK BARGAIN 公式HP　基本設計書

**バージョン：** v1.0

---

## 1. システムアーキテクチャ

### 1.1 構成概要

本システムは Next.js（App Router）をベースとした静的/サーバーサイドレンダリング構成とし、Vercel Edge Networkにデプロイする。Three.jsによる3Dレンダリングはクライアントサイドのみで実行する。

| レイヤー | 技術・役割 |
|----------|------------|
| プレゼンテーション層 | Next.js App Router + React Server Components |
| 3Dレンダリング層 | Three.js + React Three Fiber（クライアント専用） |
| アニメーション層 | GSAP + Lenis（スクロール連動アニメーション） |
| スタイリング層 | Tailwind CSS + CSS Modules |
| インフラ層 | Vercel（Edge Network + CDN + 自動SSL） |
| アセット配信 | Vercel CDN / next/image（画像最適化） |

### 1.2 ディレクトリ構成

```
oak-bargain/
├── app/                          # Next.js App Router
│   ├── (root)/
│   │   ├── page.tsx              # SC-001: トップページ
│   │   └── layout.tsx            # 共通レイアウト
│   ├── lines/
│   │   ├── entry/page.tsx        # SC-002: Entry Line
│   │   ├── standard/page.tsx     # SC-003: Standard Line
│   │   ├── premium/page.tsx      # SC-004: Premium Line
│   │   └── luxury/page.tsx       # SC-005: Luxury Line
│   ├── story/page.tsx            # SC-006: ブランドストーリー
│   └── access/page.tsx           # SC-007: アクセス情報
├── components/
│   ├── three/                    # Three.js関連コンポーネント
│   │   ├── TreeScene.tsx         # メイン大樹シーン
│   │   ├── DustParticles.tsx     # ホコリパーティクル
│   │   ├── LogoMesh.tsx          # ロゴ3Dメッシュ
│   │   └── TreeParts.tsx         # 木パーツ（幹/枝/葉/花）
│   ├── ui/                       # 汎用UIコンポーネント
│   └── sections/                 # ページセクション
├── hooks/
│   ├── useScrollProgress.ts      # スクロール進捗
│   └── useMousePosition.ts       # マウス座標
├── lib/
│   ├── three/                    # Three.jsヘルパー
│   └── constants.ts              # 定数定義
├── public/
│   ├── textures/                 # テクスチャ画像
│   └── fonts/                    # カスタムフォント
└── types/                        # TypeScript型定義
```

---

## 2. 画面遷移設計

### 2.1 初回ロードフロー

```
ローディング画面
  └→ Three.jsシーン初期化
       └→ ホコリパーティクル展開
            └→ ユーザー操作待機（マウスムーブ / タッチ）
                 └→ 70%払い完了
                      └→ メインコンテンツ フェードイン
                           └→ ロゴ降下アニメーション開始
                                └→ スクロール操作で木を降下
```

### 2.2 LINEページ遷移フロー

```
トップ（木の部位クリック）
  └→ GSAPカーテンアニメーション（黒カーテン展開）
       └→ Next.js App Router ルーティング
            └→ LINEページ表示
                 └→ 戻るボタン押下
                      └→ カーテンアニメーション
                           └→ トップページ（該当スクロール位置に復帰）
```

---

## 3. コンポーネント設計

| コンポーネント名 | 種別 | 役割・概要 |
|-----------------|------|------------|
| TreeScene | Client | React Three Fiberのメインシーン。カメラ・ライト・全3Dオブジェクト統括 |
| DustParticles | Client | BufferGeometryによるパーティクルシステム。マウス位置を受け取り払い演出 |
| LogoMesh | Client | TextGeometryによるロゴ3Dメッシュ。スクロール連動降下＋回転 |
| TreeTrunk | Client | 幹ジオメトリ。CylinderGeometry + バークテクスチャ |
| TreeBranches | Client | 枝群。TubeGeometryで有機的なカーブ表現 |
| TreeLeaves | Client | 葉群。InstancedMeshで大量高速レンダリング |
| TreeFlowers | Client | 花群。少数配置。発光マテリアル使用 |
| LineSection | Client | 各LINE紹介セクション。クリックで遷移 |
| ScrollProgress | Client | Lenisのスクロール進捗をContextで配信 |
| PageTransition | Client | ページ遷移アニメーション（GSAPカーテン） |

---

## 4. Three.jsシーン設計

### 4.1 シーン設定値

| 要素 | 設定値 | 備考 |
|------|--------|------|
| カメラ種別 | PerspectiveCamera | FOV: 60, near: 0.1, far: 1000 |
| 初期カメラ位置 | (0, 80, 120) | 木全体を俯瞰 |
| 環境光 | AmbientLight | 強度: 0.3, 色: #4A3520（暖色） |
| 指向性ライト | DirectionalLight | 強度: 1.2, 月光方向（斜め上から） |
| フォグ | FogExp2 | 色: #1A0E00, 密度: 0.008（深みある霧） |
| 背景色 | Color | #0A0604（夜の森イメージ） |
| レンダラー | WebGLRenderer | antialias: true, toneMappingExposure: 1.2 |

### 4.2 木のジオメトリ設計

| 部位 | ジオメトリ | 主要パラメータ | 対応LINE |
|------|------------|--------------|---------|
| 幹 | CylinderGeometry | 底面r: 4, 上面r: 2.5, 高さ: 60 | Entry Line |
| 主要枝 | TubeGeometry | 半径: 0.8〜1.5, カーブ: CatmullRomCurve3 | Standard Line |
| 細枝 | TubeGeometry | 半径: 0.2〜0.5 | Standard Line |
| 葉群 | InstancedMesh | 約8,000インスタンス | Premium Line |
| 花 | InstancedMesh | 約200インスタンス | Luxury Line |

---

## 5. アニメーション設計

| アニメーション | ライブラリ | 実装概要 |
|--------------|------------|---------|
| ホコリ払い | Three.js（独自） | BufferAttributeでパーティクル位置更新。マウス距離で速度付与 |
| ロゴ降下＋回転 | GSAP + Three.js | scrollProgress × 最大Y移動量。rotation.y += 0.02/frame |
| カメラ降下 | GSAP ScrollTrigger | スクロール0→1でcamera.positionをY: 80→-40に補間 |
| 葉の揺れ | Three.js Shader | vertexShaderでsin波による微細な揺れ |
| ページ遷移 | GSAP Timeline | 黒カーテンのclipPathアニメーション |
| LINE部位ホバー | Three.js Raycaster | マウス位置でRaycastし対象メッシュをハイライト |
