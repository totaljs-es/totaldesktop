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
- Product page: [totaljs.es/totalresources](https://totaljs.es/totalresources/)
- Privacy policy: [totaljs.es/totalresources/privacy](https://totaljs.es/totalresources/privacy/)
- Accessibility: [totaljs.es/totalresources/accessibility](https://totaljs.es/totalresources/accessibility/)

### TotalMonitor

TotalMonitor is a calm operations dashboard for Total.js projects. It watches
bridge reachability, runtime metrics, traffic, endpoint pressure, health signals,
alerts and optional AI-assisted early-warning context.

Product links:

- Product page: [totaljs.es/totalmonitor](https://totaljs.es/totalmonitor/)
- Privacy policy: [totaljs.es/totalmonitor/privacy](https://totaljs.es/totalmonitor/privacy/)
- Accessibility: [totaljs.es/totalmonitor/accessibility](https://totaljs.es/totalmonitor/accessibility/)

## Installation

Copy the bridge module or modules you need into the `modules` folder of your
Total.js application:

```text
your-totaljs-app/
  modules/
    totalresources-bridge.js
    totalmonitor-bridge.js
```

You can install only one module, or both modules together. They share the same
default route prefix and do not conflict with each other.

## Configuration

Add a private token to your Total.js config:

```js
desktop_token : change-this-token
```

Both modules use `CONF.desktop_token` by default.

TotalMonitor can also use a separate token when you want monitoring access to be
isolated from resource editing access:

```js
desktop_token : resources-token
desktop_monitor_token : monitor-token
```

Optionally configure the shared bridge route prefix:

```js
desktop_url : /$desktop/
```

If `CONF.desktop_url` is not defined, the default prefix is:

```text
/$desktop/
```

Restart your Total.js application after installing or updating bridge modules.

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

## TotalResources endpoints

With the default prefix, TotalResources exposes:

```text
GET  /$desktop/resources_init
GET  /$desktop/resources
POST /$desktop/resources
```

TotalResources uses these endpoints to discover translatable strings and write
updated `.resource` files back to your project.

## TotalMonitor endpoints

With the default prefix, TotalMonitor exposes:

```text
GET /$desktop/monitor_init
GET /$desktop/monitor
GET /$desktop/monitor_live
GET /$desktop/monitor_status
```

TotalMonitor uses:

- `monitor_init` to validate that the bridge belongs to TotalMonitor.
- `monitor` to read the latest Total.js minute snapshot plus runtime context.
- `monitor_live` to read live runtime and route-pressure data between snapshots.
- `monitor_status` as a protected HTML status endpoint for operators.

## Authentication

Requests must include the configured token in this header:

```text
x-totaldesktop-token: change-this-token
```

TotalMonitor uses `desktop_monitor_token` when it is configured, otherwise it
uses `desktop_token`.

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

- Spanish Total.js: [totaljs.es](https://totaljs.es)
- Total.js framework: [totaljs.com](https://www.totaljs.com/)
