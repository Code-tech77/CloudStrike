# CloudStrike

CloudStrike is a local security event simulation and threat operations project. The `frontend/` folder contains a responsive, self-contained SOC dashboard for exploring the generated event data.

## Open the dashboard

From the project root, start Python's static file server:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000/frontend/](http://localhost:8000/frontend/) in a browser. The dashboard reads `simulated_events.json` from the project root. Serve it over HTTP so the browser can load that file; opening `index.html` directly uses the small built-in preview dataset.

The reload intro uses a custom Elastic-inspired vector mark drawn from the supplied reference. Use **Simulate attack** to configure a local password-spray or brute-force scenario, **Export report** to download the loaded events as CSV, and the left navigation to inspect the event stream and project detection concepts. The event stream supports free-text search and outcome filtering. The incident queue supports status filtering and triage actions. Simulated events and triage state stay in browser memory and are not written back to the JSON file. Press `/` or `Ctrl+K` (`⌘K` on macOS) to jump to event search. The help and profile controls explain the local workspace and its shortcuts.
