# Sharing a preference between arenas

Kiro CLI proposed using React's `useSyncExternalStore` to read tab preferences during hydration. The store's server snapshot is `null`. Both the server and the initial browser render therefore use the same defaults. React then reads the saved string from `sessionStorage`.

The string is a stable snapshot for React. The workbench parses it when it changes. The settings popover writes the value and notifies same-tab listeners when a visitor applies or resets a choice. This matters because a browser storage event does not notify the document that performed the write. The same workbench is mounted in both arenas. [Preference store](../../../src/skeleton/ui/model-settings-popover.tsx) · [Workbench](../../../src/skeleton/ui/tribunal-workbench.tsx)

The registry's `AppSpec` is the union of the incident and manuscript specs. The report formatter on each spec keeps its own verdict type. [Application registry](../../../src/apps/registry.ts)
