# TotalDesktop Bridges

Public Total.js bridge modules for the TotalDesktop native apps.

These modules are installed inside your Total.js applications and expose small,
token-protected APIs that the macOS and iPadOS apps can use without requiring
direct database, filesystem or server access.

## Included modules

- [Bridge/totalresources-bridge.js](./Bridge/totalresources-bridge.js) for **TotalResources**
- [Bridge/totalmonitor-bridge.js](./Bridge/totalmonitor-bridge.js) for **TotalMonitor**

The native apps are distributed through the App Store. This repository only
contains the public bridge modules that run inside your own Total.js projects.

## Apps

### TotalResources

TotalResources helps teams organize, translate, review, back up and publish
Total.js `.resource` files from a focused native workspace.

Product links:

- App Store: [TotalResources](https://apps.apple.com/app/totalresources/id6762512727)
- Product page: [totaldesktop.totaljs.es/totalresources](https://totaldesktop.totaljs.es/totalresources/)
- Privacy policy: [totaldesktop.totaljs.es/totalresources/privacy](https://totaldesktop.totaljs.es/totalresources/privacy/)
- Accessibility: [totaldesktop.totaljs.es/totalresources/accessibility](https://totaldesktop.totaljs.es/totalresources/accessibility/)

### TotalMonitor

TotalMonitor is a calm operations dashboard for Total.js projects. It watches
bridge reachability, runtime metrics, traffic, health signals, alerts and
optional AI-assisted early-warning context.

Product links:

- Product page: [totaldesktop.totaljs.es/totalmonitor](https://totaldesktop.totaljs.es/totalmonitor/)
- Privacy policy: [totaldesktop.totaljs.es/totalmonitor/privacy](https://totaldesktop.totaljs.es/totalmonitor/privacy/)
- Accessibility: [totaldesktop.totaljs.es/totalmonitor/accessibility](https://totaldesktop.totaljs.es/totalmonitor/accessibility/)

## Installation

Copy the bridge module or modules you need into the `modules` folder of your
Total.js application:

```text
your-totaljs-app/
  modules/
    totalresources-bridge.js
    totalmonitor-bridge.js
```

You can install only one module, or both modules together.

## Configuration

Add a private token to your Total.js config:

```js
desktop_token : change-this-token
```

Both modules use `CONF.desktop_token` by default.

Optionally configure the shared bridge route prefix:

```js
desktop_url : /$desktop/
```

If `CONF.desktop_url` is not defined, the default prefix is:

```text
/$desktop/
```

Restart your Total.js application after installing or updating bridge modules.

## Shared bridge behavior

When both modules are installed, they behave like a single TotalDesktop bridge:
they share the same route prefix and token, so users only need to configure one
bridge URL and one token in the native apps.

## Independent bridge behavior

If you prefer to isolate the apps, configure each module with its own token or
route prefix:

```js
desktop_resources_token : resources-token
desktop_resources_url   : /$resources/

desktop_monitor_token   : monitor-token
desktop_monitor_url     : /$monitor/
```

Each app should then use its matching bridge URL and token.

## Connect the apps

Use the public or local URL of your Total.js application with the bridge prefix.

Production example:

```text
https://your-domain.com/$desktop/
```

Local development example:

```text
http://localhost:8000/$desktop/
```

Then enter the matching token in the native app.

## Security notes

- Always use a strong private token.
- Do not commit real production tokens to your repository.
- Use HTTPS for remote projects whenever possible.
- Keep the bridge route private to your team and TotalDesktop apps.
- Rotate the token if you believe it has been exposed.
- Install only the modules you need for a given Total.js application.

## Updating

Replace the module file in your app's `modules` folder and restart the Total.js
application.

The bridge files are intentionally standalone JavaScript modules, so deployment
can stay simple across small servers, Docker containers and production hosts.

## License

The public bridge modules are released under the MIT license. See [LICENSE](./LICENSE).

## About

TotalDesktop is a family of native tools for Total.js developers by
**Spanish Total.js**.

- TotalDesktop suite: [totaldesktop.totaljs.es](https://totaldesktop.totaljs.es/)
- Total.js framework: [totaljs.com](https://www.totaljs.com/)
