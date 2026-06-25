// Who is the current user? Reads the session cookie and fills in $.user.
//
// 📚 Module 7 · Users — the AUTH delegate runs before every protected (`+`)
//    route, so your actions can trust $.user.

AUTH(function($) {

	var raw = $.cookie(CONF.cookie);
	var session = raw ? DECRYPT(raw, CONF.secret, true) : null;

	if (!session || !session.id) {
		$.invalid();   // not logged in — protected routes return 401
		return;
	}

	NOSQL('tk_users').read().where('id', session.id).callback(function(err, user) {
		if (user)
			$.success(user);  // $.user is now set for the rest of the request
		else
			$.invalid();
	});
});
