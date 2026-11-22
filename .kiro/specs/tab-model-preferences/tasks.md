# Model preference checks

- [x] Specify the shared tab behavior and the server's initial snapshot.
- [x] Replace the untyped registry entries with a union of the two app specs.
- [x] Subscribe the shared workbench to preference changes and retain its stream cleanup.
- [x] Run `npm run lint`, `npm run typecheck` and `npm run build`.
- [x] From each live arena, save a single-model preference, refresh and open the other arena in the same tab. Verify the chosen model appears each time.
- [x] Reset the ensemble, load an existing partial single-model preference and verify the default model appears without a hydration error.
- [x] Reopen each recorded dossier and download its Markdown report.

Verified in desktop Chromium against the Railway deployment of commit `1a6b472` on 2026-11-23.
