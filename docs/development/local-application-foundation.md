# ローカルアプリケーション基盤

Issue #3 は ADR 0001 の最初の実装Issueとして、Vite + React + TypeScript の品質基盤だけを追加する。三段仕込み、データ、音響、Canvas、同期、AWSは含まない。

## 必要環境と導入

- Node.js `>=20.19.0`（Vite 8 と Vitest 4 の対応範囲）。開発確認には Node.js 24.14.0 を使用した。
- npm。グローバルパッケージは不要。

```sh
npm ci
npm run dev
```

WindowsのPowerShellで実行ポリシーが `npm.ps1` を拒否する環境では、同じnpmに含まれる `npm.cmd ci`、`npm.cmd run dev` を使う。

開発サーバーの入口は次の二つである。

- 参加者: `http://localhost:5173/`
- 会場: `http://localhost:5173/venue.html`

React Routerを導入せず、Viteの複数HTMLエントリを採用した。参加者と会場を明示的に分けつつ、同じViteプロジェクト、依存、将来のドメインコードを共有できるためである。現段階の表示は識別用プレースホルダーのみであり、承認済みプロトタイプのデザインではない。

## コマンド

| コマンド                                  | 用途                                                      |
| ----------------------------------------- | --------------------------------------------------------- |
| `npm run dev`                             | ローカル開発サーバー                                      |
| `npm run build` / `npm run preview`       | 本番ビルド / ビルド結果の確認                             |
| `npm run format` / `npm run format:check` | Prettierの整形 / 検査                                     |
| `npm run lint`                            | ESLint（TypeScript、React Hooks、型情報を使う規則を含む） |
| `npm run typecheck`                       | TypeScript strict検査                                     |
| `npm run test` / `npm run test:run`       | Vitest watch / 一回実行                                   |
| `npm run test:e2e:install`                | Playwright Chromiumの導入                                 |
| `npm run test:e2e`                        | 参加者・会場入口のHTTP smoke test                         |
| `npm run validate`                        | format check、lint、typecheck、unit test、build、E2E      |

初回のE2E前には、ローカルでは `npm exec playwright install chromium`、CIでは `npx playwright install --with-deps chromium` を実行する。Chromiumのみを対象にする。

## TypeScriptの方針

- `strict`、`noUncheckedIndexedAccess`、`noImplicitOverride`、`useUnknownInCatchVariables` を有効化し、後続のドメイン・生成規則で不明確な値を早期に検出する。
- `allowJs` は無効。新しい本番コードはTypeScriptで作る。
- `skipLibCheck` は有効。依存パッケージの宣言ファイルを毎回精査するコストを避けるためであり、アプリケーションコードのstrict検査を緩めるものではない。
- `any` は本番コードに使わない。外部入力とfixtureのschema検証、ドメイン型は後続Issueで導入する。

## 品質ゲートとCI

pre-commitはstaged diff検査、secret scan、対象拡張子のPrettier、ESLintを実行する。pre-pushはtypecheck、Vitest、buildを実行する。登録済みのコマンドは実行され、未登録として成功扱いにはしない。CIは`npm ci`後に同じnpm scriptsを実行し、Chromiumを導入してPlaywright smoke testを行う。

既存の仕様書・ADR・プロトタイプはこのIssueで機械整形しない。Prettierは対象外として明示し、今後それらを実質変更するIssueで個別に整形方針を決める。
