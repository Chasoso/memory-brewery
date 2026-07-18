# BrewingRecipe

`BrewingRecipe` は、参加者入力、日本酒fixture、土地fixtureを、音とビジュアルが後で利用するJSON安全な中間表現へ変換するMVP契約です。Tone.js、Canvas、React、ブラウザAPIには依存しません。

- 入力: `SakeProfile`、`LandMemory`、`ParticipantInput`、seed、`Clock`
- 出力: schema version `1.0`、generator version `mulberry32-v1` を持つ `BrewingRecipe`
- 決定性: 同一の入力、seed、clockで同一JSONを返す。recipe IDもこの組合せのFNV-1a hashから決める。
- seed: 文字列化後、FNV-1aで32bit stateへ変換し、Mulberry32で数列を得る。これは暗号用途ではない。アルゴリズムを変更する場合は`generatorVersion`を変更してrecipe互換性を明示する。
- 時刻: mapperはClockのみを受け取り、SystemClockはproduction境界、FixedClockはテスト境界に置く。

AudioRecipeはtempo、scale、note pattern、timbre category等の抽象値だけを持つ。VisualRecipeは、承認済みプロトタイプにある `ink`、`rice`、`water`、`koji`、`ferment`、`earth`、`night` のtokenを参照し、CSS色値を持たない。実際の色解決、音源、描画は後続Issueのadapterが担う。

mapperは酒の正規化特性を基調、初添のgestureを動き、仲添の土地をambient/flow、留添の場面をscale/duration/titleへ写像する。これはMVP用の透明なルールであり、完成済みの音楽・ビジュアル表現ではない。
