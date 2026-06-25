// Startup code — runs once when the app boots.
//
// 📚 Module 2 · Anatomy — files in /definitions run at startup (register globals,
//    seed data, set things up).
// 📚 Module 6 · Toolbox — CONF for settings, ON('ready') for boot hooks.

ON('ready', function() {
	console.log(CONF.name + ' is ready — ' + (CONF.tasker_motto || ''));
	console.log('Open the app:  http://localhost:8000/');
	console.log('Note: a TEACHING app — it mixes styles on purpose, not for production.');

	// Builds public/ui-tasker-*.min.js from the CDN and exposes it as REPO.tasker.
	// These are the jComponent v20 components our two pages use (admin-style):
	// the login view (input/enter/validate/exec) and the task app (repeater/
	// empty/search). `intranetcss` brings the built-in form styling.
	COMPONENTATOR('tasker', 'exec,loading,input,enter,validate,empty,search,intranetcss,message,icons', true);
});
