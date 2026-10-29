import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  lint: {
    rules: {
      "typescript/no-explicit-any": "off",
      "typescript/no-floating-promises": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    env: {
      node: true,
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  test: {
    globals: true,
    projects: [
      { test: { name: "unit", include: ["**/*.spec.ts"] } },
      { test: { name: "e2e", include: ["**/*.e2e-spec.ts"] } },
    ],
  },
  fmt: {
    singleQuote: true,
    trailingComma: "all",
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [],
  },
});
