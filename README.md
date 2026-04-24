# TotalDesktop

`TotalDesktop` is the native app suite from **Spanish Total.js** for teams building with [Total.js](https://www.totaljs.com/).

This public repository contains public bridge modules, lightweight assets, and product links for the TotalDesktop suite.

Right now the first published module is **TotalResources**.

## Suite overview

### TotalResources

![TotalResources](./Assets/icons/totalresources.webp)

- Status: Public bridge module
- Product page: [totaljs.es/totalresources](https://totaljs.es/totalresources)

### TotalCode

![TotalCode](./Assets/icons/totalcode.webp)

- Status: Product in progress
- Product page: [totaljs.es/totalcode](https://totaljs.es/totalcode)

### TotalMonitor

![TotalMonitor](./Assets/icons/totalmonitor.webp)

- Status: Product in progress
- Product page: [totaljs.es/totalmonitor](https://totaljs.es/totalmonitor)

## What TotalDesktop is

`TotalDesktop` is being built as a family of focused native tools around the Total.js ecosystem.

The suite is designed to support:

- translation and content workflows
- code and editing workflows
- monitoring and runtime visibility
- local-first storage
- AI-assisted workflows
- product-specific bridges that keep the native app as the source of truth

## TotalResources

`TotalResources` is the translation workspace of the suite. It helps teams manage multilingual content, project context, AI-assisted review, snapshots, and safer publishing from one native workspace.

Product page:

- [https://totaljs.es/totalresources](https://totaljs.es/totalresources)

Privacy policy:

- [https://totaljs.es/totalresources/privacy](https://totaljs.es/totalresources/privacy)

## Repository structure

- [Bridge](./Bridge)  
  App-facing bridge modules used by TotalDesktop apps.
- [Assets](./Assets)  
  App icons used in this repository and public documentation.

## Bridge modules

Bridge modules are the integration layer between a TotalDesktop app and the outside world.

They are meant to:

- read state published by the native app
- expose a controlled protocol surface
- avoid coupling external tools directly to UI internals
- keep the native app as the source of truth

In short:

- the app owns the state
- the bridge exposes a safe, focused surface

For `TotalResources`, the bridge connects a Total.js project with the native desktop workflow.

## MCP

- [mcp.totaljs.es](https://mcp.totaljs.es)

## Getting started

How to use the public `TotalResources` bridge module:

1. Clone this repository locally.
2. Copy [Bridge/totalresources-bridge.js](./Bridge/totalresources-bridge.js) into your Total.js project, usually inside `modules/`.
3. Define `CONF.desktop_token` in your app so the bridge is protected.
4. Optionally define `CONF.desktop_url` if you want a different route prefix. The default prefix is `/$desktop/`.
5. Restart the app and connect the native TotalResources workflow to your project through that bridge surface.

## Notes

- The native apps themselves are not fully mirrored here.
- This repository currently focuses on the public bridge layer.

## Brand note

`Total.js` is [totaljs.com](https://www.totaljs.com/), the original framework and the main ecosystem behind this suite.

`Spanish Total.js` is [totaljs.es](https://totaljs.es/), a Spanish Total.js delegation focused on apps, product pages, support, and operated services built around the Total.js ecosystem.
