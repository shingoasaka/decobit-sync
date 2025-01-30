// packages/eslint-config/base.js

import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import onlyWarn from 'eslint-plugin-only-warn'
import turboPlugin from 'eslint-plugin-turbo'

// TypeScript ESLint の正式パッケージ
import tseslint from '@typescript-eslint/eslint-plugin'
import tseslintParser from '@typescript-eslint/parser'

/**
 * Flat Config の配列をエクスポート。
 * これを最終的な ESLint 設定として使う。
 * @type {import("eslint").Linter.FlatConfig[]}
 */
export const config = [
  {
    ignores: [
      'apps/*/dist/**',
      'packages/*/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/build/**',
      '**/coverage/**',
      // '**/*.js',
      '**/*.d.ts',
      '**/generated/**',
      '**/.next/**',        // Next.jsの生成ファイルを除外
      '**/out/**',          // Next.jsのエクスポートディレクトリを除外
      '**/.vercel/**',      // Vercelのビルドファイルを除外
    ],
  },

  // ❷ JavaScript 全般に対する ESLint 公式推奨
  js.configs.recommended,

  // ❸ TypeScript 用設定（推奨ルール + 独自ルール）
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: true,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  // ❹ Prettier 競合ルールをオフ
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    ...eslintConfigPrettier,
  },

  // ❺ turbo の設定
  {
    plugins: { turbo: turboPlugin },
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
    },
  },

  // ❻ すべて warning 化する only-warn の設定
  {
    plugins: { 'only-warn': onlyWarn },
  },

  // ❼ Node や Jest のグローバルを扱うなら必要に応じて追加
  {
    files: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
    languageOptions: {
      // Flat Config では env ではなく globals 設定が推奨
      globals: {
        // "node": true という書き方はできないため
        // 必要なグローバルを個別に定義するか、別途プラグインを導入
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',

        // Jest 用
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },

  // テストファイル用の追加設定
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },
]
