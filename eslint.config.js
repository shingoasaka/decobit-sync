const { config: baseConfig } = require('./packages/eslint-config/base.js')

/**
 * ルートの "eslint.config.js" は
 * 単に baseConfig をエクスポートするだけ
 */
module.exports = baseConfig
