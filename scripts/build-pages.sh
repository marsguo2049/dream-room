#!/usr/bin/env bash
# Regenerate the static GitHub Pages build under docs/ from the app sources.
#
# docs/scene.js and docs/textures.js are generated files: they are app/scene.ts
# and app/textures.ts with the types stripped. Edit the TypeScript, then run
# this script — never hand-edit the generated JavaScript.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

npx tsc app/scene.ts app/house.ts app/textures.ts \
  --target es2022 \
  --module esnext \
  --moduleResolution bundler \
  --skipLibCheck \
  --outDir "$work"

# TypeScript keeps the extensionless specifier; a browser needs the real path.
sed -i 's#from "\./textures"#from "./textures.js"#' "$work/scene.js"
sed -i 's#from "\./house"#from "./house.js"#' "$work/scene.js"

header='// Generated from app/%s by scripts/build-pages.sh. Do not edit by hand.\n'
for name in scene house textures; do
  printf "$header" "$name.ts" > "docs/$name.js"
  cat "$work/$name.js" >> "docs/$name.js"
done

# Keep the vendored three.js in step with the version the app builds against.
version="$(node -p "require('./node_modules/three/package.json').version")"
if [ "$version" != "$(cat docs/vendor/three/VERSION)" ]; then
  echo "Refreshing vendored three.js to $version"
  cp node_modules/three/build/three.module.min.js docs/vendor/three/
  cp node_modules/three/build/three.core.min.js docs/vendor/three/
  cp node_modules/three/examples/jsm/controls/OrbitControls.js docs/vendor/three/
  cp node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js docs/vendor/three/
  cp node_modules/three/LICENSE docs/vendor/three/
  echo "$version" > docs/vendor/three/VERSION
fi

echo "Static Pages build refreshed: docs/scene.js, docs/house.js, docs/textures.js (three $version)"
