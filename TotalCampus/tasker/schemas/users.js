// Tasker's User — accounts, registration and login.
//
// 📚 Module 7 · Users & sharing — Tasker goes multi-user.

// The data shape (Module 4). The `Email` type validates the format for free.
NEWSCHEMA('User', 'id:UID,*name:String(80),*email:Email,*password:String,dtcreated:Date');

NEWSCHEMA('Users', function($) {

	// Register (create an account).
	// 📚 Module 7 — never store a plain password; `.hash()` is built in (Module 6 · crypto).
	$.action('register', {
		name: 'Register a new user',
		input: '@User',
		action: function($, model) {
			NOSQL('tk_users').read().where('email', model.email).callback(function(err, exists) {
				if (exists) {
					$.invalid('Email already registered');
					return;
				}
				model.id = UID();
				model.password = model.password.hash('sha256');  // one-way hash
				model.dtcreated = NOW;
				NOSQL('tk_users').insert(model).callback(function() {
					$.audit('User registered');  // Module 6
					$.success(model.id);
				});
			});
		}
	});

	// Log in (find the user, check the password, start a session).
	// 📚 Module 7 — a session is an encrypted cookie; ENCRYPT/DECRYPT are built in.
	$.action('login', {
		name: 'Log in',
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
});
