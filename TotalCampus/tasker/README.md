# Tasker — the complete TotalCampus app

This is the **finished Tasker** app you build across the [TotalCampus](https://apps.apple.com/) course — a real, runnable **full-stack** project: a **Total.js 5** backend *and* a **jComponent v20** frontend, the two halves the campus teaches. Every file is commented with the **module that taught that part**, so you can read the code and trace it back to a lesson.

Use it to **build along in parallel**: code each module yourself in your own editor (or in **Total.js Code**), then compare with this reference, or just read it end to end.

> ⚠️ **Tasker is a teaching app, not a production template.** On purpose it
> **mixes several ways of doing the same thing** — REST routes *and* `TAPI`,
> `NEWSCHEMA` operations *and* `NEWACTION`, a schema-based login *and* a plugin
> login — so you can see the range of what Total.js offers. A real app would
> pick one style and stay consistent (and add rate-limiting, password rules,
> CSRF, tests, etc.). Read it to learn the pieces, not to copy it wholesale.

## Run it

```bash
npm install
node index.js
```

Then open **http://localhost:8000** in your browser. With no session you land on **`/login/`** (served by the login plugin); create an account, and you're taken to the task app — add, complete, search and delete tasks. The frontend loads jComponent **v20 from the CDN** plus a **COMPONENTATOR** bundle (`REPO.tasker`, generated into `public/` on first boot). You can also drive the same backend with the REST API:

```bash
# 1) register
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret"}'

# 2) log in (stores a session cookie)
curl -c cookie.txt -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"secret"}'

# 3) create + list your tasks (uses the cookie)
curl -b cookie.txt -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
curl -b cookie.txt http://localhost:8000/api/tasks/
```

> The app stores data in the built-in embedded NoSQL under `databases/`
> (kept in git via `.gitkeep`; the `.nosql` data files are ignored).

## Lesson map

| File | What it covers | Learned in |
|------|----------------|------------|
| `index.js` | Bootstrapping the server | **M1** · Getting started |
| `config` | App settings (`CONF`) | **M2** · Anatomy · **M6** · Toolbox |
| folder layout | `/controllers`, `/schemas`, `/definitions`, `/views` | **M2** · Anatomy |
| `controllers/default.js` | REST routes, `+` auth, the view | **M3** · Routing · **M7** · auth · **M8** · views |
| `schemas/tasks.js` | Task shape + validation, CRUD, DB, audit, assign | **M3** · **M4** · **M5** · **M6** · **M7** · **M9** |
| `schemas/users.js` | Register & login | **M7** · Users |
| `definitions/auth.js` | Session cookie → `$.user` (the `AUTH` delegate) | **M7** · Users |
| `definitions/audit.js` | `DEF.onAudit` — where audit logs go | **M6** · Audit |
| `definitions/notify.js` | WebSocket channel, notify (live/email), CRON reminders | **M8** · real-time · **M9** · sharing & reminders |
| `definitions/init.js` | Startup hooks + `COMPONENTATOR` (builds `REPO.tasker`) | **M2** · definitions · **M6** · toolbox |
| `plugins/login/index.js` | Accounts the **NEWACTION** way (`route:'API ?'`) + serves `-GET /` | **Frontend** · Creating a plugin |
| `plugins/login/signin.html` | The login UI — `ui-plugin` + `PLUGIN` + `TAPI('Login|signin')` | **Frontend** · Creating a plugin |
| `plugins/files/index.js` | Attach files to tasks — `FILESTORAGE` + `DataURI` upload + FILE download | **Frontend** · Working with files |
| `views/index.html` | The task **SPA** — `PLUGIN`, model binding, list/empty/search, plain `data-exec` buttons, the `icons` picker | **Frontend M1–M9** + **M8** · Views |
| `public/ui-tasker-*.min.js` | The COMPONENTATOR bundle (`REPO.tasker`), built from the CDN | **Frontend M0** · A real Total.js frontend |

### A few touches worth noting

- **Auth by routing**: `+GET /` serves the app only when logged in; the login plugin's `-GET /` serves the form otherwise. Signing in `reload()`s and the app appears.
- **Icons**: the new-task input has an icon button that opens the **j-Icons** picker (Total.js ships ~600 icons) and tags the task.
- **Attachments**: each task has a 📎 button — files go to the built-in **FILESTORAGE** (no external service) and download from a public FILE route.

### Two ways to reach the backend, side by side

Tasker shows the two styles a real Total.js app mixes — exactly what the campus teaches:

- **Tasks** use **`NEWSCHEMA` + `$.action`** operations (`schemas/tasks.js`) exposed as **REST routes** (`controllers/default.js`), called from the UI with **`AJAX`**. One route per verb, the id in the URL.
- **Auth** uses the **login plugin** the **`NEWACTION`** way — the route lives inside the action (`route: 'API ?'`, scoped by `config: $api`) — called from the UI by name with **`TAPI('Login|signin')`**. This is the OpenPlatform-compatible style used by the official **admin** app.

The frontend follows **jComponent v20**: components come from the CDN + the COMPONENTATOR bundle, the page is a `PLUGIN` with a path-bound model, and buttons are plain `<button class="exec" data-exec="?/method">` (the v20 way — `j-Button` is gone).

## Going further

- **Production** (`release` mode, bundles, deploy) — **M10**.
- **Scaling** (cluster across CPU cores, extensions) — **M11**.
- Switch the database to PostgreSQL with `querybuilderpg` — the **same `NOSQL`/QueryBuilder methods**, no refactor (**M5**).

Built with ❤️ on [Total.js](https://www.totaljs.com).
