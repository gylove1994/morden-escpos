# Receipt Studio

A browser-only ESC/POS receipt template editor. Production builds use the
Next.js static export and do not require a Node.js server runtime. The browser
sends print data directly to a printer connected locally or over the LAN.

## Development and builds

```bash
pnpm dev
pnpm --filter @workspace/template-editor build
```

Static files are generated in `apps/template-editor/out/` and MAY be deployed
to any static file host.

For the GitHub Pages project site, build with the repository base path enabled:

```bash
GITHUB_PAGES=true pnpm --filter @workspace/template-editor build
```

Pushes to `main` deploy the app through
`.github/workflows/deploy-template-editor-pages.yml`. The public site is
<https://gylove1994.github.io/morden-escpos/>.

## Browser printing

- USB: WebUSB in Chrome or Edge. The user MUST select and authorize a device.
- Serial: Web Serial in Chrome or Edge, with a configurable baud rate.
- Network RAW 9100: requires a Chrome Isolated Web App with Direct Sockets.
  A regular browser tab cannot open a raw TCP socket.
- WebUSB and Web Serial require a secure HTTPS context. `localhost` MAY be used
  during local development.

Image commands used for browser printing accept only cross-origin-accessible
`http(s)` URLs.
