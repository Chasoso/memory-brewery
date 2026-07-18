# Contributing

作業の詳細なルールは [AGENTS.md](AGENTS.md)、Issue から PR までの手順は [開発ワークフロー](docs/development/workflow.md) を参照してください。

開始時は `main` の最新状態から `type/issue-N-short-name` を作成します。変更前に対象 Issue、仕様書、必要なプロトタイプ画面を読み、スコープ外を確認します。

ローカルフックは `node scripts/setup-git-hooks.mjs` で有効化します。フックを回避せず、検証に失敗した場合は修正または PR で未実行理由を明記してください。

データを追加・更新する場合は、`docs/data/data-sources.md` と `data/README.md` のルールに従い、出典・ライセンス・加工・再配布条件を追跡します。
