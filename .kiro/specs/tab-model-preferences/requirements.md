# Tab-scoped model preferences

A visitor can choose an OpenRouter model in either arena. The same tab should carry that choice when the visitor opens the other arena.

1. Both apps render default settings on the server and during hydration, then display the tab's saved settings.
2. Applying or resetting a choice updates the workbench label and the preferences used for the next request immediately.
3. Existing entries under `marrow_openrouter_config_v2` retain their meaning. A partial single-model choice uses the existing default model.
4. An optional visitor key stays in that tab's session storage and goes to the application's server when running a case. The operator controls the provider endpoint.
5. The application registry retains the concrete types of the two domain definitions. A change to a verdict can be checked against its formatter.
