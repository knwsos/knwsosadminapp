# KNΩSOS Desktop

This Tauri app opens the live KNΩSOS website in a native macOS or Windows window. The website frontend, visual design, article API, and admin panel remain on the existing hosted site.

## Requirements

- The app needs an internet connection and the live website at https://knwsos.com.
- Article storage and admin sign-in continue to use the existing Netlify functions and Netlify Blobs.
- This wrapper does not bundle the website or provide offline access.
- macOS builds are provided for Apple Silicon and Intel.
- Windows builds use WebView2, which is included with current supported Windows installations.

## Build locally

Install Rust and the platform prerequisites listed in the Tauri v2 prerequisites guide. Then, from this directory:

~~~sh
npm install
node -e "const fs = require('node:fs'); fs.writeFileSync('icons/knwsos-icon.png', Buffer.from(fs.readFileSync('icons/knwsos-icon.png.base64', 'utf8'), 'base64'))"
npm run tauri -- icon icons/knwsos-icon.png --output src-tauri/icons
npm run tauri -- build
~~~

To open the desktop window during development:

~~~sh
npm run tauri -- dev
~~~

## Publish installers with GitHub Releases

The workflow at .github/workflows/desktop-release.yml builds installers for Apple Silicon macOS, Intel macOS, and Windows x64. To publish a release, create and push a version tag:

~~~sh
git tag desktop-v1.0.0
git push origin desktop-v1.0.0
~~~

GitHub Actions builds the platform installers and attaches them to a GitHub Release. Users download the macOS DMG or Windows EXE installer from the release page.

Unsigned builds may show the standard macOS Gatekeeper warning. Developer ID signing and notarization require Apple credentials and are not configured here. Windows signing likewise requires a code-signing certificate.
