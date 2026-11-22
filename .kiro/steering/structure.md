---
inclusion: always
---
# Working across both arenas

Keep shared orchestration, session storage, streaming and graph rendering in `src/skeleton/`. Each folder under `src/apps/` owns its personas, example inputs, verdict schema, report formatter and visual theme. App Router pages and route handlers mount those definitions.

Use the shared model settings component for both arenas. Keep visitor preferences scoped to the browser tab. Read deployment credentials only on the server. Keep the provider endpoint under operator control.

For changes to shared behavior, run `npm run lint`, `npm run typecheck` and `npm run build`. Exercise both `/court` and `/defense` with their supplied presets. Verify citations, the saved dossier and the Markdown download.
