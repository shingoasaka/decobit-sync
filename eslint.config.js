// eslint.config.js (Monorepo ルート)

import { config as baseConfig } from './packages/eslint-config/base.js'

/**
 * ルートの "eslint.config.js" は
 * 単に baseConfig をエクスポートするだけ
 */
export default baseConfig
