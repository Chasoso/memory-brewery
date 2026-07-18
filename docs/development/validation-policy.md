# 検証方針

## 実行可能なゲート

| 場所 | 実行内容 | 結果表示 |
| --- | --- | --- |
| pre-commit | staged diff、secret scan、対象拡張子のPrettier、ESLint | 成功時は`[PASS]`、失敗時はhook失敗、未登録時のみ`[NOT CONFIGURED]` |
| pre-push | TypeScript strict typecheck、Vitest unit test、Vite build | 成功時は`[PASS]`、失敗時はpush拒否、未登録時のみ`[NOT CONFIGURED]` |
| CI | `npm ci`、基盤検証、format check、lint、typecheck、unit test、build、Chromium Playwright smoke test | GitHub Actionsの各stepでPASS/FAILを示す |

現時点でformatter、lint、typecheck、unit test、buildはすべて `scripts/quality/commands.json` に登録済みであり、スキップしない。`[NOT CONFIGURED]` は将来、意図してコマンドを空にした場合だけを示し、PASSではない。

## ローカル実行

```sh
node scripts/setup-git-hooks.mjs
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run build
npm exec playwright install chromium
npm run test:e2e
```

まとめて実行する場合は `npm run validate` を使う。Windows PowerShellの実行ポリシーで `npm.ps1` が拒否される場合は `npm.cmd` を使用する。Git hookもWindowsでは `npm.cmd` を自動選択する。

## 検証の境界

既定の検証はネットワーク上のプロダクト依存先を必要としない。Playwrightのブラウザ導入時だけ、ブラウザバイナリ取得が必要となる。外部API、クラウド、実データは後続Issueで明示的にopt-inとする。

実装Issueでは、fixture / mock / ルールベースのフォールバック、固定seed、固定clock、固定animation driverを用いる。音声なしの完走と、必要に応じた参加者・会場の複数タブ確認をPRに記録する。
