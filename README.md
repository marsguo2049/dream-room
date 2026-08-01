# Dream Room

An interactive 3D room, rendered in the browser with
[three.js](https://threejs.org/). Drag to look around, scroll to zoom, and click
a piece of the room to watch the girl live out that part of the dream: climb the
tree and swing a 360 off the branch, open the door and dive into the sea beyond
it, sit down and play a short melody, or settle at the desk to read and write.

**Live demo:** <https://moltpany.github.io/dream-room/>

Every surface is generated at runtime. Nothing is loaded from an external asset
or CDN — no models, no image textures, no fonts.

## How the room is made

- `app/scene.ts` builds the geometry, the animation state machine, the raycast
  interaction, and the Web Audio melody. It is plain TypeScript with no
  framework imports, so the same module drives both builds below.
- `app/textures.ts` paints every material into a canvas: oak boards with grain,
  knots and routed seams; troweled plaster; loop-pile wool; bark fissures; leaf
  clusters; linen, denim twill, ribbed knit and pebbled leather; laid paper and
  ruled manuscript; wet sand; and a tiling sea normal map summed from sines.
  Each surface ships a colour map, a normal map derived from a height pass, and
  a roughness map, so light breaks along the grain instead of sliding over
  flat plastic.
- Lighting is image-based. A painted equirectangular panorama is run through
  `PMREMGenerator` and set as `scene.environment`, so the lacquer, the brass,
  the eyes and the sea reflect a real surrounding rather than carrying a raised
  specular value. Directional sun, a cool sea-side fill, and four practical
  lights sit on top of it, with contact-shadow decals grounding the furniture.

## Layout

This repository serves two purposes.

- `app/`, `worker/`, `db/`, `vite.config.ts` … — the full-stack source, running
  the scene as a React client component on vinext / Cloudflare Workers.
- `docs/` — a static, build-step-free port of the same scene, published by
  GitHub Pages at the live demo URL above. `three.js` is vendored under
  `docs/vendor/three/`, so the page makes no external network calls, and it
  falls back to an explanatory message when WebGL is unavailable.

`docs/scene.js` and `docs/textures.js` are **generated files** — they are
`app/scene.ts` and `app/textures.ts` with the types stripped. Edit the
TypeScript and run `npm run build:pages`; never hand-edit the JavaScript. That
keeps the published page from drifting away from the source.

The static build lives under `docs/` rather than at the repository root because
Vite's dev server would otherwise serve a root `index.html` at `/` and shadow
the vinext app during `npm run dev`.

### GitHub Pages settings

Settings → Pages → Build and deployment → Deploy from a branch, then pick the
default branch and the **`/docs`** folder.

## Notes on this copy

- `.openai/hosting.json` has its `project_id` set to `null`. The upstream value
  bound the app to a specific OpenAI Sites project and is not meaningful here.
- `tsconfig.tsbuildinfo` is a local TypeScript build artifact; it is not tracked
  and is listed in `.gitignore`.

---

## Runtime: vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout and then validates the Sites artifact. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build and validate the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build, validate, and verify the rendered development-preview metadata
- `npm run build:pages`: regenerate `docs/scene.js` and `docs/textures.js` from the app sources
- `npm run validate:artifact`: recheck an existing artifact's manifest and ESM `default.fetch` export
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build and validation commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
