# TotalDesktop

Public companion code for the **TotalDesktop** family of native tools for
Total.js developers, by **Spanish Total.js**.

The native apps are distributed through the App Store. This repository holds the
open pieces that live **inside your own Total.js projects**:

- **Bridge modules** — small, token-protected APIs that let the macOS / iPadOS
  apps work with your project without direct database, filesystem or server
  access.
- **TotalCampus companion** — the complete reference app and language pack that
  go with the TotalCampus learning app.

Links: [totaldesktop.totaljs.es](https://totaldesktop.totaljs.es/) · [totaljs.com](https://www.totaljs.com/)

## Repository contents

```text
totaldesktop/
  Bridge/        # bridge modules you copy into your Total.js app
  TotalCampus/   # companion resources for the TotalCampus app
```

| Path | What it is |
|------|------------|
| [`Bridge/totalresources-bridge.js`](./Bridge/totalresources-bridge.js) | Bridge module for **TotalResources** |
| [`Bridge/totalmonitor-bridge.js`](./Bridge/totalmonitor-bridge.js) | Bridge module for **TotalMonitor** |
| [`TotalCampus/`](./TotalCampus/) | The complete **Tasker** reference app + importable language pack |

## The apps

### TotalResources

Helps teams organize, translate, review, back up and publish Total.js
`.resource` files from a focused native workspace. *(Uses a bridge module.)*

- App Store: [TotalResources](https://apps.apple.com/app/totalresources/id6762512727)
- Product page: [totaldesktop.totaljs.es/totalresources](https://totaldesktop.totaljs.es/totalresources/)
- [Privacy](https://totaldesktop.totaljs.es/totalresources/privacy/) · [Accessibility](https://totaldesktop.totaljs.es/totalresources/accessibility/)

### TotalMonitor

A calm operations dashboard for Total.js projects: bridge reachability, runtime
metrics, traffic, health signals, alerts and optional AI-assisted early-warning
context. *(Uses a bridge module.)*

- App Store: [TotalMonitor](https://apps.apple.com/app/totalmonitor/id6762515811)
- Product page: [totaldesktop.totaljs.es/totalmonitor](https://totaldesktop.totaljs.es/totalmonitor/)
- [Privacy](https://totaldesktop.totaljs.es/totalmonitor/privacy/) · [Accessibility](https://totaldesktop.totaljs.es/totalmonitor/accessibility/)

### TotalCampus

Teaches Total.js — backend (Total.js 5) and frontend (jComponent v20) — by
building a real app called **Tasker**, from absolute beginner to developer.
*(Ships companion resources here, not a bridge — see
[TotalCampus companion](#totalcampus-companion) below.)*

- Product page: [totaldesktop.totaljs.es](https://totaldesktop.totaljs.es/)

---

## Bridge modules

> Applies to the **TotalResources** and **TotalMonitor** bridges only.
> TotalCampus does not use a bridge.

### Install

Copy the bridge module(s) you need into the `modules` folder of your Total.js
application:

```text
your-totaljs-app/
  modules/
    totalresources-bridge.js
    totalmonitor-bridge.js
```

Install just one or both. Restart your Total.js application after installing or
updating a bridge module.

### Configure

Add a private token to your Total.js config:

```js
desktop_token : change-this-token
```

Both modules use `CONF.desktop_token` by default. Optionally set the shared
bridge route prefix (default `/$desktop/`):

```js
desktop_url : /$desktop/
```

**Shared mode (default).** With both modules installed they behave like a single
TotalDesktop bridge — same route prefix and token — so the native apps need only
one bridge URL and one token.

**Independent mode.** To isolate the apps, give each module its own token and
prefix:

```js
desktop_resources_token : resources-token
desktop_resources_url   : /$resources/

desktop_monitor_token   : monitor-token
desktop_monitor_url     : /$monitor/
```

Each app then uses its matching bridge URL and token.

### Connect the apps

Use your application's URL with the bridge prefix, then enter the matching token
in the native app:

```text
# production
https://your-domain.com/$desktop/

# local development
http://localhost:8000/$desktop/
```

### Update

Replace the module file in your app's `modules` folder and restart. The bridge
files are standalone JavaScript modules, so deployment stays simple across small
servers, Docker containers and production hosts.

### Security notes

- Always use a strong private token; rotate it if you suspect exposure.
- Never commit real production tokens.
- Use HTTPS for remote projects whenever possible.
- Keep the bridge route private to your team and TotalDesktop apps.
- Install only the modules you need.

---

## TotalCampus companion

Companion resources for the **TotalCampus** learning app — not a bridge:

- **[`TotalCampus/tasker/`](./TotalCampus/tasker/)** — the complete, commented
  **Tasker** reference app (a runnable Total.js 5 project). Every file notes the
  module that taught it, so you can build along and compare. See its
  [README](./TotalCampus/tasker/README.md) for the lesson map and how to run it.
- **[`TotalCampus/languages/`](./TotalCampus/languages/)** — the importable
  **language pack template** to translate the whole app (interface + course).

## License

The public bridge modules are released under the MIT license. See [LICENSE](./LICENSE).
