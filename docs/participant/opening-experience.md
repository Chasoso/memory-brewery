# 開栓体験

Issue 4 は、三段仕込みで確定した `BrewingRecipe` を参加者自身の短い作品として開く境界です。会場送信、同期、保存は扱いません。

## 状態と操作

`ready → starting → playing → completed` の順で視覚状態を扱います。開栓は明示的な button 操作だけで開始し、再表示は同じ recipe を時刻 0 から再生します。reset と unmount は Canvas のフレーム予約と音響リソースを破棄します。

## Canvas と決定論

renderer version は `canvas-2d-v1` です。初期要素は既存の versioned Mulberry32 stream から `seed | recipeId | rendererVersion` を入力として一度だけ導出し、各フレームは経過時刻から計算します。したがって、recipe、renderer version、CSS canvas size、DPR 上限 2、経過時刻、reduced-motion 設定が同じなら描画モデルも同じです。描画ループでは `Math.random()` やフレーム数を使いません。

`VisualRecipe` は palette を背景・アクセントへ、particleCount/density を要素数へ、particleSpeed/flowDirection/turbulence/motionCharacter を流れへ、waveAmplitude を波へ、fade を背景の残像へ、durationSeconds を時間の周回へ、shapeFamily を粒・波・波紋の描き分けへ反映します。reduced motion でも作品を消さず、移動と振幅だけを抑えます。

`AnimationDriver` は本番では requestAnimationFrame、テストでは `ManualAnimationDriver` を使える小さな時刻境界です。

## 任意の音声

Tone.js 15.1.22 は開栓操作後に dynamic import されます。`Tone.start()` もこの user gesture 内からのみ呼びます。`AudioRecipe` の scale、register、notePattern は音高列、tempo/density は間隔、dynamics は安全な velocity、timbreCategory/ambientTexture は穏やかな Synth の波形・envelope に反映します。標準の長さは recipe の `durationSeconds`（5–60秒）で、音量は -22 dB から開始します。

音声を選ばない、Web Audio 非対応、dynamic import 失敗、または初期化失敗の場合は `NoOpAudioPlayer` または `failed` 状態となり、Canvas と reset は続行します。外部音源・録音・MIDIは使いません。

## テスト条件

E2E test mode は従来どおり `VITE_ENABLE_E2E_MODE=true` と `?test=1` の両方がある場合だけ有効です。固定 Chromium screenshot は 375×760 CSS px、Chromium、音声なし、固定 seed/clock、20ms の test opening 完了状態で比較します。Canvas rasterization の OS 差を隠す閾値は使わず、Playwright の Windows と Linux の platform-specific baseline をそれぞれ比較します。通常 production build の query parameter だけでは test mode になりません。

## 次の境界

この Issue は recipe をローカル表示するだけです。後続の会場同期は、同じ JSON-safe `BrewingRecipe` を送る側に接続し、Canvas renderer や Tone adapter に依存しません。
