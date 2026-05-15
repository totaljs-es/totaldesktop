<h1 align="center">
  <img src="https://totaljs.es/img/totaldesktop/totalresources-icon.webp" width="32" style="vertical-align: middle;" />
  TotalResources Bridge
</h1>

Public bridge module for connecting a Total.js application with **TotalResources**, the native workspace for managing multilingual Total.js projects.

TotalResources helps teams organize, translate, review, back up, and publish project resources from a focused native app for macOS and iPadOS.

[![Download on the App Store](https://totaljs.es/img/appstore/en.svg)](https://apps.apple.com/app/totalresources/id6762512727)

## Links

- App Store: [TotalResources](https://apps.apple.com/app/totalresources/id6762512727)
- Product page: [totaljs.es/totalresources](https://totaljs.es/en/totalresources/)
- Privacy policy: [totaljs.es/totalresources/privacy](https://totaljs.es/en/totalresources/privacy/)

## What this repository contains

This repository currently contains the public bridge module used by TotalResources:

- [Bridge/totalresources-bridge.js](./Bridge/totalresources-bridge.js)

The native app itself is distributed through the App Store.

## How the bridge works

The bridge is a small Total.js module installed inside your Total.js application.

It exposes a protected API that TotalResources can use to:

- read translatable strings from your project
- inspect available resource keys
- write updated `.resource` files back to your project

The bridge is protected with a token. TotalResources must use the same token when connecting to your app.

## Installation

1. Download or clone this repository.

2. Copy the bridge module into your Total.js app:

```text
Bridge/totalresources-bridge.js
```

Place it inside the `modules` folder of your Total.js application:

```text
your-totaljs-app/
  modules/
    totalresources-bridge.js
```

3. Configure a private token in your Total.js app config:

```js
desktop_token : change-this-token
```

4. Optionally configure the bridge route prefix:

```js
desktop_url : /$desktop/
```

If `CONF.desktop_url` is not defined, the default route prefix is:

```text
/$desktop/
```

5. Restart your Total.js application.

## Connect from TotalResources

In TotalResources, open your project settings and configure:

- Bridge URL: the public or local URL of your Total.js app using the bridge route.
- Token: the same value configured in `CONF.desktop_token`.

Example bridge URL:

```text
https://your-domain.com/$desktop/
```

Local development example:

```text
http://localhost:8000/$desktop/
```

TotalResources will use the bridge to read and publish your project resources.

## Available endpoints

With the default `CONF.desktop_url = '/$desktop/'`, the bridge exposes:

```text
GET  /$desktop/resources_init
GET  /$desktop/resources
POST /$desktop/resources
```

Requests must include the configured token in this header:

```text
x-totaldesktop-token: change-this-token
```

## Security notes

- Always use a strong private token.
- Do not commit real production tokens to your repository.
- Use HTTPS for remote projects whenever possible.
- Keep the bridge route private to your team and tools.
- Remove or rotate the token if you believe it has been exposed.

## License

The public bridge module is released under the MIT license. See [LICENSE](./LICENSE).

## About

TotalResources is part of the TotalDesktop family by **Spanish Total.js**.

- Spanish Total.js: [totaljs.es](https://totaljs.es)
- Total.js framework: [totaljs.com](https://www.totaljs.com/)
