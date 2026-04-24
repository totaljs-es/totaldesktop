# TotalDesktop

`TotalDesktop` is the native app suite from **Spanish Total.js** for teams building with [Total.js](https://www.totaljs.com/).

This public repository is the shareable layer of the suite: bridge modules, public docs, and lightweight assets that make sense outside the private app workspace itself.

Right now the first published module is **TotalResources**.

## Suite overview

| App | Status | Product page |
| --- | --- | --- |
| ![TotalResources](./Assets/icons/totalresources.webp) **TotalResources** | Public bridge module | [totaljs.es/totalresources](https://totaljs.es/totalresources) |
| ![TotalCode](./Assets/icons/totalcode.webp) **TotalCode** | Product in progress | [totaljs.es/totalcode](https://totaljs.es/totalcode) |
| ![TotalMonitor](./Assets/icons/totalmonitor.webp) **TotalMonitor** | Product in progress | [totaljs.es/totalmonitor](https://totaljs.es/totalmonitor) |

## What TotalDesktop is

`TotalDesktop` is being built as a family of focused native tools around the Total.js ecosystem.

The suite is designed to support:

- translation and content workflows
- code and editing workflows
- monitoring and runtime visibility
- local-first storage
- AI-assisted workflows
- product-specific bridges that keep the native app as the source of truth

## Public focus today

The current public module is **TotalResources**.

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

For `TotalResources`, this bridge is the key public piece: it connects your Total.js project to the native app workflow in a way that stays close to the app, the project, and the real source of truth.

## MCP ecosystem

`TotalDesktop` also powers hosted MCP workflows through:

- [mcp.totaljs.es](https://mcp.totaljs.es)

That hosted layer is part of the wider product ecosystem, but the main public focus of this repository is still the **bridge module** that connects a Total.js project with the native desktop app.

## Published files

Current public files:

- [Bridge/totalresources-bridge.js](./Bridge/totalresources-bridge.js)
- [Assets/icons/totalresources.webp](./Assets/icons/totalresources.webp)
- [Assets/icons/totalcode.webp](./Assets/icons/totalcode.webp)
- [Assets/icons/totalmonitor.webp](./Assets/icons/totalmonitor.webp)

## Getting started

If you want to experiment with the public `TotalResources` module:

1. Clone this repository locally.
2. Open [Bridge/totalresources-bridge.js](./Bridge/totalresources-bridge.js).
3. Configure the route prefix and desktop token inside your Total.js app.
4. Publish the bridge from your app-side integration.

## Notes

- The native apps themselves are not fully mirrored here.
- This repository only publishes the bridge-facing pieces that make sense to share publicly.
- MCP support is part of the private product integration layer and is not published here yet.

## Brand note

This repository follows the same product rule as the rest of the suite:

- `Total.js` refers to the framework and ecosystem
- `Spanish Total.js` refers to the apps, product pages, support, and operated services
