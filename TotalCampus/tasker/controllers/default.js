// Tasker's routes — the front door of the app.
//
// 📚 Module 2 · Anatomy — controllers hold routes.
// 📚 Module 3 · Routing & controllers — the REST API (list/read/create/update/delete).
// 📚 Module 7 · Users — `+` means "must be logged in".
// 📚 Module 8 · Views & real-time — the HTML page.
// 📚 Module 4 (frontend M7 calls it) · API routing — one /api/ door, many named operations.
//
// Tasker shows TWO ways to reach the backend, on purpose:
//   • Tasks → schema operations (NEWSCHEMA + $.action) exposed as REST routes,
//     called from the UI with AJAX. Classic, explicit, one route per verb.
//   • Auth  → the *login plugin* the NEWACTION way (route lives in the action),
//     called from the UI by name with TAPI('Login|signin'). The OpenPlatform style.

exports.install = function() {

	// The web page (Module 8 · Views). `+GET` = logged-in only: you reach the app
	// only with a valid session. When you're not logged in, the login plugin's
	// `-GET /` route serves the login form at the same URL instead.
	ROUTE('+GET /', index);

	// REST API for tasks (Module 3). `-->` routes straight to a schema operation.
	// `+` requires a logged-in user (Module 7).
	ROUTE('+GET    /api/tasks/             --> *Tasks/query');
	ROUTE('+GET    /api/tasks/{id}/        --> *Tasks/read');
	ROUTE('+POST   /api/tasks/             --> *Tasks/insert');
	ROUTE('+PUT    /api/tasks/{id}/        --> *Tasks/update');
	ROUTE('+DELETE /api/tasks/{id}/        --> *Tasks/remove');
	ROUTE('+POST   /api/tasks/{id}/assign/ --> *Tasks/assign');   // Module 9 · sharing

	// Accounts the REST way (Module 7 · users) — the login plugin offers the very
	// same thing the NEWACTION way; both are valid, kept side by side to compare.
	ROUTE('POST /api/register/ --> *Users/register');
	ROUTE('POST /api/login/    --> *Users/login');
};

// 📚 Module 8 · Views — pass data to the template; Tangular renders @{...}.
function index($) {
	$.view('index', { motto: CONF.tasker_motto });
}
