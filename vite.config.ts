// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  cloudflare: isGitHubPagesBuild ? false : undefined,
  tanstackStart: {
    ...(isGitHubPagesBuild
      ? {
          router: {
            basepath: "/postcodes-bangla-connect",
          },
          pages: [{ path: "/" }],
          prerender: {
            crawlLinks: false,
            autoStaticPathsDiscovery: false,
          },
          spa: {
            enabled: true,
            maskPath: "/offline",
            prerender: {
              outputPath: "/404",
            },
          },
        }
      : {}),
    server: { entry: "server" },
  },
  vite: {
    ...(isGitHubPagesBuild
      ? {
          base: "/postcodes-bangla-connect/",
        }
      : {
          base: "/",
      },
    ),
  },
});
