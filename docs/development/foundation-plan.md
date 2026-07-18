# 開発基盤の調査と方針

## 調査対象

`D:\Git\tableau-chat-extension` から、次の運用資産を確認した。

| 資産 | 判断 | Memory Brewery での扱い |
| --- | --- | --- |
| `AGENTS.md` の Issue 単位・PR・自己レビュー規約 | 適応 | `main` 専用、単一 Issue を原則とする簡潔な規約にした。 |
| PR テンプレート | 適応 | Issue、受け入れ基準、検証、正本への影響を必須にした。 |
| Issue 運用 | 適応 | feature / bug の最小テンプレートにした。 |
| pre-commit / pre-push と hook 設定スクリプト | 適応 | 依存パッケージなしの `.githooks` と Node スクリプトにした。 |
| PR CI | 適応 | `main` 向けの基盤・登録済みローカル品質コマンドのみを実行する。 |
| frontend/backend 個別 lint・typecheck・build・E2E | 不採用 | フレームワークも実装コードも未決定であり、仮コマンドを置かない。 |
| AWS deploy/preflight、infra、Hosted 接続、MCP 保護規約 | 不採用 | デプロイ、クラウド、外部接続は今回の対象外。 |
| `develop` ベース、複数 Issue の work package、nightly 運用 | 不採用 | 初期段階は `main` と Issue 単位の PR に絞る。 |

## 採用方針

仕様駆動開発の正本は product spec、視覚・操作の正本は高忠実度プロトタイプとする。変更は正本を先に更新し、実装はそれを追随する。プロトタイプはデザインの参照であり、実装の都合で独自に変えない。

GitHub では `main` への直接 push を禁止し、`<type>/issue-<number>-<short-name>` ブランチから PR を作る。PR は完了した Issue を `Closes #N` で閉じ、Codex はマージしない。

品質ゲートは、現在実行できるものと将来の機能別検証を明確に分離する。staged diff、秘密情報の簡易スキャン、formatter、lint、typecheck、unit test、build はローカルで検証し、CIも同じnpm scriptsを実行する。Playwrightは参加者・会場入口のChromium smoke testから開始し、機能別E2Eは後続Issueで追加する。未設定のチェックを成功とは扱わない。

## ローカル完結の設計制約

- 外部 API 不在でも fixture、mock、ルールベースのフォールバックで主要体験を検証する。
- 参加者画面と会場画面は複数タブまたは複数ブラウザでローカル検証する。
- 外部入力と fixture はスキーマ検証する。
- 醸造レシピは明示的型、生成表現は注入可能な seed、テストは固定可能な乱数・時刻・アニメーションを用いる。
- 音声なしでも操作完了可能とし、UI、ドメイン、音楽、ビジュアルを分離する。

技術選定、デプロイ、クラウド資源、実装機能はこの基盤作業では追加しない。
