# ADR 0001: ローカルMVPのアーキテクチャと将来の公開候補

- Status: Accepted
- Date: 2026-07-18
- Decision scope: v0.1.0 のローカルMVP。AWS リソース、デプロイ、アプリ実装はこの決定に含めない。

## Context

正本は product spec の三段仕込み（初添→踊り→仲添→留添→作品再生）と、`prototypes/high-fidelity-v0.1/` の参加者・会場画面である。MVPはスマートフォン参加者画面、会場画面、ブラウザ音響、Canvasビジュアル、参加者作品の会場反映を必要とする。一方、外部API・クラウドなしで fixture のみから主要フローを完走し、ハッカソン期間内に完成・検証できなければならない。

## Decision drivers

- TypeScript の `strict`、入力/fixtureのスキーマ検証、決定論的な recipe 生成。
- 承認済みプロトタイプの見た目と三段仕込みの操作順を保ちながら、DOMは保守可能に再構成できること。
- 音声拒否・未対応時も操作と視覚出力を完走できること。
- Windows で再現でき、formatter、lint、typecheck、unit test、build、E2Eを実コマンドにできること。
- バックエンド、DB、認証、クラウド、monorepoをMVPの前提にしないこと。

## Options considered

| 選択肢 | 利点 | 欠点 | 判定 |
| --- | --- | --- | --- |
| Vite + React の単一プロジェクト | 高速なローカル開発、TypeScript/テストの一般的な組合せ、二画面を同一ドメインモデルで共有できる | 初期設定が静的HTMLより増える | **採用** |
| Next.js の単一アプリ | 将来のSSR/API Routeを置ける | MVPにSSR/API不要。設定・ルーティング・デプロイ判断を早期に持ち込む | 却下 |
| 静的HTMLプロトタイプを拡張 | 見た目の出発点がある | 型、状態、テスト、分離が育ちにくく、本番実装とプロトタイプが混在する | 却下。参照として保存 |
| 素のTypeScript + Vite | 最小依存 | 複数の状態同期・UI更新を手作業で管理し、プロトタイプ移植の速度と保守性で不利 | 却下 |

### ライブラリ・方式の比較

| 領域 | 比較 | 決定 | 理由 |
| --- | --- | --- | --- |
| UI | React / 素のDOM | React | 画面状態・アクセシビリティを部品化し、見た目はプロトタイプを参照して再実装する。 |
| 音響 | Tone.js / Web Audio直書き | Tone.js | スケジューリング・音色・再生停止を短く安全に扱える。音響ポートは no-op 実装を必ず持つ。 |
| ビジュアル | Canvas API / p5.js | Canvas API | 追加ランタイムを増やさず、seedと描画時刻を明示的に注入できる。p5.jsの簡便さはMVP規模では依存増に見合わない。 |
| ローカル同期 | BroadcastChannel / WebSocket / polling | BroadcastChannel | 同一 origin・同一ブラウザの複数タブで即時反映でき、サーバー不要。会場表示の検証条件を満たす。異なるブラウザ間同期は公開版まで保留。 |
| 単体テスト | Vitest / Jest | Vitest | Vite/TypeScriptとの親和性と高速なwatch。clock、RNG、animation driverを注入して純粋関数を検証する。 |
| E2E・視覚回帰 | Playwright / 手動のみ | Playwright | Chromiumで参加者→会場の導線、音声無効時、スクリーンショット差分を自動化する。Canvasは固定seedで安定化する。 |
| パッケージ管理 | npm / pnpm | npm | Windows/Nodeに標準で、現リポジトリの最小前提に合う。`package-lock.json` をコミットし `npm ci` で再現する。 |

## Decision

v0.1.0 は **Vite + React + TypeScript strict の単一プロジェクト**とする。参加者と会場は同一ビルドの別エントリ（`index.html` と `venue.html`、または同等の明示的ルート）とし、共通のドメイン・fixture・生成器を共有する。Reactの採用は視覚デザインの変更を意味しない。色、書体、余白、画面構成、操作順、主要アニメーションはプロトタイプを受け入れ基準として移植する。

最初の依存候補は React、Vite、TypeScript、Zod、Tone.js、Vitest、ESLint、Prettier、Playwright である。これは実装Issueで `package.json` と lockfile を追加し、各コマンドを実行確認してから確定する。現在は依存を追加しない。

### 分離と決定性

```text
UI (React participant / venue)
  -> application use cases
      -> domain (Recipe, mapping rules, seeded RNG, Clock)
      -> ports: RecipeRepository / VenuePublisher / AudioEngine / VisualRenderer
      -> adapters: fixture repository / BroadcastChannel / Tone.js / Canvas
```

- `BrewingRecipe`、参加入力、会場イベント、fixture は Zod schema で検証し、推論型を境界に使う。
- `SeededRandom`、`Clock`、`AnimationDriver` を引数またはポートとして渡す。`Math.random()`、`Date.now()`、`requestAnimationFrame()` をドメイン規則から直接呼ばない。
- `AudioEngine` は `enabled: false` または再生失敗時に no-op となり、recipe、画面遷移、会場反映は続行する。
- `BroadcastChannelVenuePublisher` はメモリ上のイベントと画面読込時の最新スナップショットを扱う。異ブラウザ・異端末の同期は保証しない。ローカルMVPの受け入れ確認は同一ブラウザの複数タブで行う。

## Consequences

正本を参照しながらUIを段階移植でき、ローカルではネットワークなしで完結する。純粋な生成規則とポート境界により、後で同期・保存をAWS実装に差し替えられる。一方で、ローカルMVPのBroadcastChannelは会場の別PCや参加者の別スマートフォンには届かない。ハッカソンの実会場同期は公開対応Issueを完了してから提供する。

## AWS公開構成の候補（将来）

ローカルの `RecipeRepository`、`VenuePublisher`、`VenueEventStore` ポートを維持し、AWS adapterを追加する。第一候補は **S3 + CloudFront（静的配信） + API Gateway HTTP API + Lambda + DynamoDB On-Demand** である。常時起動するEC2、ECSタスク、RDSは採用しない。

| 領域 | 候補 | 評価 | 将来の判断 |
| --- | --- | --- | --- |
| 静的配信 | S3 + CloudFront | 低運用、停止時に実行資源なし。公開の第一候補 | ローカルMVP完了後、IaC Issueで決定 |
| HTTP書込・読取 | HTTP API + Lambda | 小規模・断続アクセスに適合。ドメインロジックは共用 | 実会場でクロス端末同期が必要なら追加 |
| 保存 | DynamoDB On-Demand | 小規模・予測不能なイベント負荷に容量設定不要 | 作品保持期間・削除要件を決めてから |
| 同期: polling | HTTP APIで2–5秒取得 | 実装量最小、会場用途なら十分な可能性 | まず負荷試験で体感を確認 |
| 同期: API Gateway WebSocket | 接続分・メッセージ分課金、即時性 | 実装・接続管理が増える | pollingが受け入れられない場合のみ |
| 同期: AppSync等 | 高機能 | MVPには過剰 | 却下（必要性が出るまで） |
| AI | Bedrock | モデル、プロンプト、データ取扱い、コストが増える | ルールベース版が受入基準を満たさない時のみ評価 |
| AIなし | rule-based recipe | 決定的・低コスト・オフライン可 | **ローカルMVP採用** |

### 移行方法

1. ドメイン、recipe mapper、seed生成、Zod schema、React UIはそのまま共用する。
2. fixture repository を `HttpRecipeRepository`、BroadcastChannel publisher を HTTP polling または WebSocket publisher に差し替える。
3. Lambdaは薄い入出力検証・永続化・イベント配信のみとし、生成規則を複製しない。
4. IaC、予算、ログ保持、削除手順は公開対応の独立Issueでレビューする。

## コスト比較（概算）

計算日: 2026-07-18。候補リージョン: `ap-northeast-1`（東京）、CloudFront/Route 53はグローバル料金を含む。金額はUSD、税・ドメイン登録費を除く。料金・無料枠は変更されるため、実装前にAWS Pricing Calculatorで再計算する。

前提: Aは200 HTTP request/日を30日として6,000 request/月、Bは50人×20=1,000 participant request + 会場2台が5秒pollを8時間（約23,040 request）で合計約25,000 request、Cは1,000人×20=20,000 request/月。作品は各5KB以下、静的配信はCで概算100MB未満、Lambdaは128MB・100ms/HTTP requestを保守的な設計目標とする。WebSocket案はBで最大32接続×8時間=15,360 connection-minutes、各参加作品イベント等を約2,000 messageと置く。

| サービス | 固定費 / 未使用時 | 従量・無料枠 | A / B / C の概算 | 上限・終了時の措置 |
| --- | --- | --- | --- | --- |
| S3 Standard | バケット自体は$0、保存分のみ | 保存、PUT/GET、転送。小容量ではほぼ$0（無料枠に依存しない設計でも数セント未満） | 約$0 / 約$0 / 約$0.01未満 | Lifecycle/バケット削除。不要な原本・ログを削除 |
| CloudFront | distributionの固定費なし | データ転送・request。全顧客に月1TBと1,000万HTTP(S) requestの無料枠がある | $0 / $0 / $0 前提 | AWS Budget、CloudFront無効化/削除。無料枠超過時は地域別従量 |
| HTTP API | 固定費なし | 例示単価は最初の3億requestまで$1.00/百万request、転送別 | 約$0.006 / $0.025 / $0.02 | Budget/usage alarm。APIとstageを削除 |
| Lambda | 固定費なし | request + GB-second。無料枠は100万request、40万GB-s/月 | 無料枠内なら$0 / $0 / $0 | 予約同時実行数、Budget、関数削除。無料枠依存なしでもこの量は数セント以下 |
| DynamoDB On-Demand | 固定費なし、保存分のみ | read/write requestとGB月。小規模数KB作品では極小 | 約$0 / 約$0.01未満 / 約$0.01未満 | TTL、PITR無効、table削除。保存期間を短くする |
| WebSocket API（比較） | 固定費なし | connection-minute + message（32KB単位） | $0 / 数セント以下見込み / 利用量次第 | connection上限、Budget、API削除。pollingより実装負荷が主コスト |
| CloudWatch Logs | 固定費なし | 収集・保存・分析。無料枠はログ計5GB/月 | $0前提 | retention 7–14日、ログ量/Insight queryを制限、log group削除 |
| Bedrock | 固定費なし | 入出力tokenとモデル・リージョンに依存 | 不採用なら$0 / $0 / $0 | model allow-list、token上限、Budget。モデル/ログを無効化し関連設定を削除 |
| Route 53 | hosted zoneは最初の25で$0.50/zone/月。ドメインはTLD別年額 | 標準queryは$0.40/百万（最初の10億） | 約$0.50 + ドメイン / 同左 / 同左 | custom domain不要なら作らない。zone削除、ドメイン自動更新を止める |
| WAF | Web ACL/rule/requestが課金。小規模でも月額要素がある | request数が少なくてもACL・rule固定相当が主になる | MVPでは$0（未採用） | 公開後に脅威・公開期間を踏まえ再評価。使うならWeb ACLとloggingを削除 |
| Data transfer | インターネット向け・サービス別の従量 | CloudFront無料枠内想定、AWS内転送には条件あり | $0前提 | CloudFront usage/Budgetを監視。大きな画像・音源を持ち込まない |

この負荷では、custom domainを使う場合のRoute 53 hosted zone（月$0.50）以外は、多くが無料枠内または数セント規模と見込む。ただし無料枠、Bedrockのモデル価格、WAF、ログ分析、外部転送、ドメイン年額は見積りを大きく変えるため、"$0" を保証値にはしない。Bedrockは選定モデル・トークン予算が未決定なので、誤った単価を仮定せず、現時点の概算はルールベース採用の$0としている。

料金根拠: [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/)、[S3 pricing](https://aws.amazon.com/s3/pricing/)、[API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)、[Lambda pricing](https://aws.amazon.com/lambda/pricing/)、[DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/)、[CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/)、[Route 53 pricing](https://aws.amazon.com/route53/pricing/)、[WAF pricing](https://aws.amazon.com/waf/pricing/)、[Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)。Bedrock Runtimeは東京リージョンで利用可能であることを[公式リージョン一覧](https://docs.aws.amazon.com/bedrock/latest/userguide/endpoints-region-availability.html)で確認した。

## AWSを今実装しない理由と決定時期

AWSはローカルMVPの受け入れ基準（生成・音響・ビジュアル・アクセシビリティ・同一ブラウザ複数タブ）を満たすために不要であり、先行すると同期、データ保持、認証、コスト監視、IaCの検証対象を増やす。v0.1.0のローカルE2E・手動会場テスト完了後、実会場で異端末同期と公開URLが必要と確認した時点で、公開対応Issueを作成する。そのIssueでpollingを先に負荷試験し、必要な場合だけWebSocketを選ぶ。採用時はIaC、Budget、タグ、ログretention、TTL、削除runbookを同じ変更単位でレビューする。

## Deferred decisions

- 公開時のAWSアカウント/リージョン、CDN price class、独自ドメイン、TLS、WAF、ログ保持、Budget額。
- polling間隔とWebSocket採否、DynamoDBの正確なキー・TTL・保存期間。
- Bedrockの必要性、モデル、プロンプト、データ取扱い、token上限。
- Reactの具体的なコンポーネント設計、依存のバージョン、アクセシビリティ詳細は実装Issueで決める。

## Rejected approaches

Next.js、バックエンド/DB先行、WebSocket先行、p5.js、静的プロトタイプへの継ぎ足し、Bedrock必須化、EC2/ECS/RDS、monorepoをv0.1.0の開始条件にしない。いずれも正本の受け入れ基準より先に運用・依存・検証面積を増やすためである。
