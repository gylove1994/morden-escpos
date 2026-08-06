/**
 * Copyright (c) 2025 Ophir LOJKINE
 * Copyright (c) 2026 morden-escpos-contributors
 * SPDX-License-Identifier: MIT
 */
import baseConfig from "../../eslint.config.mjs";

export default baseConfig.append({
  files: ["src/**/*.{ts,tsx}", "test/**/*.{js,ts,tsx}"],
  rules: {
    "react/no-nested-lazy-component-declarations": "off",
    "react/static-components": "off",
    "test/no-identical-title": "off",
    "ts/no-use-before-define": "off",
  },
});
