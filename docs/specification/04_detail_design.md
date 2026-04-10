# OAK BARGAIN 公式HP　詳細設計書

**バージョン：** v1.0

---

## 1. ホコリ払い演出（FR-001）

### 1.1 DustParticlesコンポーネント仕様

| 項目 | 仕様 |
|------|------|
| ファイルパス | `components/three/DustParticles.tsx` |
| レンダリング | Points（Three.js）+ BufferGeometry |
| パーティクル数 | PC: 4,000個 / SP: 2,000個（useResponsive hookで切替） |
| パーティクルサイズ | 0.3〜1.2（ランダム分布） |
| 初期配置 | XY平面上のランダム座標（カメラ正面全域をカバー） |
| 消滅トリガー | マウス/タッチ中心から120px以内かつ速度ベクトル付与 |
| 自動消滅 | 70%消去後、残り30%をalpha fade out（2秒） |

### 1.2 TypeScript型定義

```typescript
interface DustParticle {
  position: THREE.Vector3;   // 現在座標
  velocity: THREE.Vector3;   // 速度ベクトル
  alpha: number;             // 透明度 0.0〜1.0
  size: number;              // パーティクルサイズ
  active: boolean;           // アクティブフラグ
}

interface DustParticlesProps {
  mousePosition: { x: number; y: number };
  onClearProgress: (progress: number) => void;
}
```

### 1.3 アニメーションループ処理フロー

```
毎フレーム全パーティクルをイテレート
  └→ マウス座標との距離計算（ワールド座標変換）
       └→ 距離 < 120px の場合
       │    └→ 速度ベクトルを吹き飛ばし方向に更新
       └→ 速度に基づき位置更新
       └→ 速度に摩擦係数（0.95）乗算
       └→ alpha < 0.01 → active = false
       └→ activeカウント / totalカウントを親へ通知
       └→ BufferAttribute.setNeedsUpdate(true)
```

---

## 2. ロゴ降下アニメーション（FR-002）

### 2.1 LogoMeshコンポーネント仕様

| 項目 | 仕様 |
|------|------|
| ファイルパス | `components/three/LogoMesh.tsx` |
| ジオメトリ | TextGeometry（FontLoader + typeface.json） |
| フォント | Cormorant Garamond（欧文セリフ） |
| マテリアル | MeshStandardMaterial（gold: #B8964E, metalness: 0.8, roughness: 0.2） |
| 初期Y座標 | 80.0（カメラ視点の木の天辺） |
| 終点Y座標 | -40.0（幹の根元付近） |
| 回転速度 | rotation.y += 0.015 / frame（Delta時間で正規化） |
| 輝きエフェクト | Bloom（@react-three/postprocessing）threshold: 0.8, intensity: 1.5 |

### 2.2 スクロール連動実装

```typescript
// useScrollProgress カスタムフック
export const useScrollProgress = (): number => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const lenis = getLenisInstance();
    lenis.on('scroll', ({ progress }: { progress: number }) => {
      setProgress(progress); // 0.0（最上部）〜1.0（最下部）
    });
  }, []);

  return progress;
};

// LogoMesh 内での使用
const scrollProgress = useScrollProgress();
const targetY = 80 - scrollProgress * 120; // 80 → -40

useFrame(({ clock }, delta) => {
  if (!meshRef.current) return;
  meshRef.current.position.y = THREE.MathUtils.lerp(
    meshRef.current.position.y,
    targetY,
    0.05 // 補間係数（慣性感）
  );
  meshRef.current.rotation.y += 0.015 * delta;
});
```

---

## 3. 大樹シーン（FR-003）

### 3.1 TreeTrunk（幹）実装仕様

| 項目 | 仕様 |
|------|------|
| ジオメトリ | `CylinderGeometry(4, 2.5, 60, 12, 8, false)` |
| テクスチャ | bark_diffuse.jpg + bark_normal.jpg |
| マテリアル | MeshStandardMaterial + normalMap + roughnessMap |
| クリック判定 | Raycasterによるクリック検出 → `/lines/entry` へルーティング |
| ホバー演出 | emissive colorを #000000 → #3A1A00 に変化（0.3秒 GSAP tween） |

### 3.2 TreeLeaves（葉群）InstancedMesh実装

```typescript
const LEAF_COUNT = 8000;

const leafGeometry = new THREE.PlaneGeometry(1.2, 0.8);
const leafMaterial = new THREE.MeshStandardMaterial({
  map: leafTexture,
  alphaMap: leafAlphaTexture,
  transparent: true,
  side: THREE.DoubleSide,
  color: new THREE.Color(0.08, 0.18, 0.05), // 深い緑
});

const instancedMesh = new THREE.InstancedMesh(leafGeometry, leafMaterial, LEAF_COUNT);
const dummy = new THREE.Object3D();

// 球状分布で葉のボリュームを表現
for (let i = 0; i < LEAF_COUNT; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  const r = 15 + Math.random() * 20; // 半径15〜35

  dummy.position.set(
    r * Math.sin(phi) * Math.cos(theta),
    20 + r * Math.cos(phi) * 0.7, // 上方向に圧縮
    r * Math.sin(phi) * Math.sin(theta)
  );
  dummy.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(i, dummy.matrix);
}

instancedMesh.instanceMatrix.needsUpdate = true;
```

### 3.3 葉の揺れ Vertex Shader

```glsl
uniform float uTime;
uniform float uWindStrength;

void main() {
  vec3 pos = position;
  float windX = sin(uTime * 0.8 + pos.y * 0.3) * uWindStrength;
  float windZ = cos(uTime * 0.6 + pos.x * 0.2) * uWindStrength * 0.6;
  pos.x += windX;
  pos.z += windZ;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

```typescript
// ShaderMaterialへの適用
const leafMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uWindStrength: { value: 0.3 },
    map: { value: leafTexture },
  },
  vertexShader,
  fragmentShader,
  transparent: true,
  side: THREE.DoubleSide,
});

useFrame(({ clock }) => {
  leafMaterial.uniforms.uTime.value = clock.getElapsedTime();
});
```

---

## 4. LINEページ詳細設計

### 4.1 各LINEページ共通仕様

| 要素 | 仕様 |
|------|------|
| レイアウト | フルスクリーン。背景はライン固有のグラデーション |
| ヘッダー | ライン名（大文字）+ 部位名（小文字）+ コンセプトキャッチ |
| メインビジュアル | 絵画風フィルター適用画像 |
| コンテンツ | ライン説明文 + 価格帯イメージ + 世界観テキスト |
| 戻るボタン | GSAPカーテン → トップページの該当スクロール位置に復帰 |

### 4.2 LINEごとのビジュアルトーン

| LINE | メインカラー | アクセント | ムード |
|------|------------|------------|--------|
| Luxury Line | #F8F0E3 / 白金 | #D4AF37 / 金 | 輝き・神聖・最高峰 |
| Premium Line | #1A2B1A / 深緑 | #8BA888 / シルバーグリーン | 深み・希少・特別感 |
| Standard Line | #2C1A0E / 深茶 | #B8964E / ゴールド | 温もり・定番・日常 |
| Entry Line | #3D2B1F / 茶 | #C4956A / ライトブラウン | 親しみ・入口・出会い |

### 4.3 LINEConfig型定義

```typescript
// types/line.ts
export type LineType = 'entry' | 'standard' | 'premium' | 'luxury';
export type TreePart = 'trunk' | 'branch' | 'leaf' | 'flower';

export interface LineConfig {
  id: LineType;
  name: string;           // 表示名
  nameSub: string;        // サブテキスト（日本語）
  treePart: TreePart;     // 紐づく木の部位
  concept: string;        // コンセプトキャッチ
  description: string;    // 詳細説明
  colors: {
    bg: string;
    text: string;
    accent: string;
  };
  scrollTarget: number;   // トップページの対応スクロール位置（0.0〜1.0）
  path: string;           // ルーティングパス
}

export const LINE_CONFIGS: Record<LineType, LineConfig> = {
  luxury: {
    id: 'luxury',
    name: 'LUXURY LINE',
    nameSub: 'ラグジュアリーライン',
    treePart: 'flower',
    concept: 'その輝きに、価値がある。',
    description: 'K18やプラチナなど、素材そのものにも高い価値を持つ最上位ライン。',
    colors: { bg: '#F8F0E3', text: '#1A1A1A', accent: '#D4AF37' },
    scrollTarget: 0.2,
    path: '/lines/luxury',
  },
  premium: {
    id: 'premium',
    name: 'PREMIUM LINE',
    nameSub: 'プレミアムライン',
    treePart: 'leaf',
    concept: '特別感を、日常に。',
    description: 'デザイン性・存在感・希少性を高めた中上位ライン。',
    colors: { bg: '#1A2B1A', text: '#F0EDE6', accent: '#8BA888' },
    scrollTarget: 0.45,
    path: '/lines/premium',
  },
  standard: {
    id: 'standard',
    name: 'STANDARD LINE',
    nameSub: 'スタンダードライン',
    treePart: 'branch',
    concept: '毎日つけたい定番。',
    description: '日常使いのしやすさとヴィンテージの存在感のバランスを意識したライン。',
    colors: { bg: '#2C1A0E', text: '#F0EDE6', accent: '#B8964E' },
    scrollTarget: 0.7,
    path: '/lines/standard',
  },
  entry: {
    id: 'entry',
    name: 'ENTRY LINE',
    nameSub: 'エントリーライン',
    treePart: 'trunk',
    concept: 'はじめての1つ、ここから。',
    description: 'ヴィンテージジュエリーを初めて手に取る方にも親しみやすい入門ライン。',
    colors: { bg: '#3D2B1F', text: '#F0EDE6', accent: '#C4956A' },
    scrollTarget: 0.9,
    path: '/lines/entry',
  },
};
```

---

## 5. パフォーマンス最適化設計

### 5.1 Three.js最適化

| 施策 | 概要 |
|------|------|
| InstancedMesh使用 | 葉・花は単一DrawCallで描画（描画コール削減） |
| LOD（Level of Detail） | カメラ距離に応じて葉のポリゴン数を削減 |
| Frustum Culling | カメラ外のオブジェクトを自動カリング（Three.js標準） |
| Texture Atlasing | 葉テクスチャを1枚にまとめサンプリング回数削減 |
| Dispose管理 | ページ離脱時にgeometry/material/textureをdispose() |

### 5.2 Next.js最適化

```typescript
// Three.jsコンポーネントはSSR無効で遅延ロード
const TreeScene = dynamic(
  () => import('@/components/three/TreeScene'),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);
```

- `next/image` による画像自動最適化（WebP変換・サイズ最適化）
- Route GroupsによるコードスプリットでLINEページを分離
- Vercel Edge Configによるキャッシュ戦略の最適化

### 5.3 モバイル対応

```typescript
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    mq.addEventListener('change', (e) => setIsMobile(e.matches));
  }, []);

  return { isMobile };
};

// パーティクル数の切り替え例
const { isMobile } = useResponsive();
const PARTICLE_COUNT = isMobile ? 2000 : 4000;
const LEAF_COUNT = isMobile ? 3000 : 8000;
```

---

## 6. Vercelデプロイ設計

### 6.1 Vercel設定

| 設定項目 | 内容 |
|----------|------|
| Framework Preset | Next.js（自動検出） |
| Node.jsバージョン | 20.x LTS |
| Build Command | `pnpm build` |
| Output Directory | `.next`（自動） |
| 環境変数 | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_ID`（任意） |
| カスタムドメイン | Vercelダッシュボードでドメインを設定 |
| Preview Deployment | Pull RequestごとにPreview URLを自動生成 |
| Edge Functions | 使用しない（静的サイト + クライアントJS） |

### 6.2 vercel.json設定例

```json
{
  "headers": [
    {
      "source": "/textures/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

---

## 7. SEO・メタデータ設計

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: 'OAK BARGAIN | 時を旅した輝きに、次の物語を',
  description:
    'ヴィンテージジュエリーブランド OAK BARGAIN。時を経て受け継がれてきたジュエリーの魅力を、現代の感性で再提案。',
  openGraph: {
    title: 'OAK BARGAIN',
    description: '時を旅した輝きに、次の物語を',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};
```

---

## 8. TypeScript型定義一覧

| 型名 | ファイル | 概要 |
|------|---------|------|
| `LineType` | `types/line.ts` | `'entry' \| 'standard' \| 'premium' \| 'luxury'` |
| `LineConfig` | `types/line.ts` | ライン設定オブジェクト（色・テキスト・パス等） |
| `TreePart` | `types/tree.ts` | `'trunk' \| 'branch' \| 'leaf' \| 'flower'` |
| `DustParticle` | `types/dust.ts` | パーティクル状態管理オブジェクト |
| `ScrollContext` | `types/scroll.ts` | スクロール進捗コンテキスト型 |
| `MousePosition` | `types/mouse.ts` | `{ x: number; y: number; normalizedX: number; normalizedY: number }` |

---

## 9. WebGL非対応フォールバック

```typescript
// hooks/useWebGLSupport.ts
export const useWebGLSupport = (): boolean => {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const ctx =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setSupported(!!ctx);
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
};

// 使用例（トップページ）
const isWebGLSupported = useWebGLSupport();

if (!isWebGLSupported) {
  return <FallbackPage />; // 静的画像ベースのフォールバック画面
}
```

---

## 10. 環境構築手順

```bash
# プロジェクト作成
pnpm create next-app@latest oak-bargain \
  --typescript --tailwind --app --no-src-dir

cd oak-bargain

# 依存パッケージインストール
pnpm add three @react-three/fiber @react-three/drei
pnpm add @react-three/postprocessing
pnpm add gsap lenis
pnpm add -D @types/three

# 開発サーバー起動
pnpm dev

# ビルド確認
pnpm build && pnpm start
```
