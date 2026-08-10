import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // See tests/stubs/server-only-stub.ts for why this is needed.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only-stub.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["./tests/setup-env.ts"],
  },
});
