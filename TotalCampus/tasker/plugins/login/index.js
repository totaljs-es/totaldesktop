// Tasker's "login" plugin — accounts packaged as a self-contained Total.js plugin.
//
// 📚 Frontend · Creating a plugin — a PLUGIN bundles its backend (this file) and
//    its UI (public/) in one folder. This is the OpenPlatform-compatible way real
//    Total.js apps are built (see the official "admin" app).
//
// It also shows the NEWACTION style (next to the NEWSCHEMA style used for tasks):
// the route lives INSIDE the action — `route: 'API ?'` registers it under the
// app's `$api` scope (config: $api = /api/), `input` validates the body, and the
// frontend reaches it by name with TAPI('Login|signin', ...).

exports.icon = 'ti ti-user';
exports.name = 'Login';

// A plugin can own its routes. Here it serves the login page at the SAME url as
// the app (`/`), but with `-GET` = only-when-NOT-logged-in. So visiting `/`:
//   • logged in     → the app   (controllers/default.js `+GET /`)
//   • not logged in → this form  (`-GET /`)
// After a successful sign-in the form reloads `/`, and now the app shows.
exports.install = function() {
	// ROUTE can take the view name directly — no handler needed.
	ROUTE('-GET /', '#login/signin');
};

// Register (create an account).
NEWACTION('Login|register', {
	name: 'Register a new account',
	route: 'API ?',
	input: '*name:String,*email:Email,*password:String',
	action: function($, model) {
		NOSQL('tk_users').read().where('email', model.email).callback(function(err, exists) {
			if (exists) {
				$.invalid('Email already registered');
				return;
			}
			var user = {};
			user.id = UID();
			user.name = model.name;
			user.email = model.email;
			user.password = model.password.hash('sha256');   // never store it in clear
			user.dtcreated = NOW;
			NOSQL('tk_users').insert(user).callback(function() {
				$.success(user.id);
			});
		});
	}
});

// Sign in (check the password, start an encrypted-cookie session).
NEWACTION('Login|signin', {
	name: 'Sign in',
	route: 'API ?',
	input: '*email:Email,*password:String',
	action: function($, model) {
		NOSQL('tk_users').read().where('email', model.email).callback(function(err, user) {
			if (!user || user.password !== model.password.hash('sha256')) {
				$.invalid('Wrong email or password');
				return;
			}
			$.cookie(CONF.cookie, ENCRYPT({ id: user.id }, CONF.secret, true), '5 days');
			$.success({ id: user.id, name: user.name });
		});
	}
});

// Who am I? Lets the UI restore the session on load (needs a logged-in user).
NEWACTION('Login|account', {
	name: 'Current account',
	route: 'API ?',
	user: true,
	action: function($) {
		// `$.callback` returns the raw value (no {success,value} wrapper), so the
		// UI gets the user object straight from TAPI('Login|account').
		$.callback({ id: $.user.id, name: $.user.name });
	}
});

// Sign out (clear the cookie).
NEWACTION('Login|signout', {
	name: 'Sign out',
	route: 'API ?',
	user: true,
	action: function($) {
		$.cookie(CONF.cookie, '', '-1 day');
		$.success();
	}
});
