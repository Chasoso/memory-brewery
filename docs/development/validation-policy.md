# 検証方針

## 現在の実行可能なゲート

| 場所 | 実行内容 | 状態 |
| --- | --- | --- |
| pre-commit | staged file の空白・競合マーカー検査、簡易 secret scan、登録済み formatter / lint | 前二者は有効。formatter / lint はスタック確定まで未登録。 |
| pre-push | 登録済み typecheck、unit tests、build | スタック確定まで未登録。未登録はスキップであり、成功した品質検査ではない。 |
| CI | `verify-foundation` と pre-push に登録済みのコマンド | `main` 宛て PR で実行。ローカルと同じ登録内容を用いる。 |

`node scripts/setup-git-hooks.mjs` でフックを有効化する。手動では `node scripts/quality/pre-commit.mjs`、`node scripts/quality/pre-push.mjs`、`node scripts/quality/verify-foundation.mjs` を実行できる。

## スタック確定後の有効化

フレームワークを選定する Issue で、`scripts/quality/commands.json` に実在するコマンドを登録する。コマンドはパッケージ管理方法と lockfile を含む同じ PR でローカル実行を確認してから追加する。

- `preCommit.formatter`: staged ファイルを対象にした高速 formatter check
- `preCommit.lint`: staged ファイルを対象にした高速 lint
- `prePush.typecheck`: TypeScript strict typecheck
- `prePush.unitTests`: fixture と schema validation を含む unit tests
- `prePush.build`: プロダクション相当のローカル build

各登録項目は `{ "command": "実行ファイル", "args": ["引数"] }` 形式とする。formatter / lint の `args` では `"{files}"` を staged ファイル一覧に展開できる。

実装 Issue では、外部 API を既定の検証に必要としない。fixture / mock / ルールベースのフォールバック、固定 seed、固定 clock、固定 animation driver を用い、音声なしの完走と複数タブまたは複数ブラウザの会場反映を必要に応じて確認する。

PR には実行したコマンド、終了結果、手動確認、未実行項目と理由を記載する。`--no-verify` は使用しない。
