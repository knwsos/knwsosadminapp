# KNΩSOS Admin desktop app

This app opens the live admin page at https://knwsos.com/admin in a dedicated macOS or Windows window. The existing website asks for the admin password; the password is checked by the website and is not stored in or bundled with this app.

## Requirements

- Internet connection and the live KNΩSOS website.
- The existing Netlify functions and Netlify Blobs remain responsible for authentication and article storage.
- This app does not change, deploy, or replace the website.

## Build locally

Install Rust and the Tauri v2 platform prerequisites. Then, from this directory:

~~~sh
npm install
node -e "const fs = require('node:fs'); fs.writeFileSync('icons/knwsos-icon.png', Buffer.from(fs.readFileSync('icons/knwsos-icon.png.base64', 'utf8'), 'base64'))"
npm run tauri -- icon icons/knwsos-icon.png --output src-tauri/icons
npm run tauri -- build
~~~

To open the admin window during development:

~~~sh
npm run tauri -- dev
~~~

## Publish installers

The workflow at `.github/workflows/admin-desktop-release.yml` builds installers for Apple Silicon macOS, Intel macOS, and Windows x64. Create a GitHub release using a new tag such as `admin-v1.0.0`. The workflow will build the installers and attach them to that release.

The macOS build uses ad-hoc signing to avoid a broken-signature alert, but it is not Apple Developer ID signed or notarized. macOS may still require a one-time approval. The Windows installer is also unsigned and may show an unknown-publisher warning.
