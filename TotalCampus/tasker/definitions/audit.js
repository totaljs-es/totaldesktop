// Where audit entries go. Implement this once and EVERY $.audit() / AUDIT()
// across the app flows through it — the Total.js delegate pattern.
//
// 📚 Module 6 · Audit logs — record who did what, then decide where to store it.

DEF.onAudit = function(name, log) {
	// `log` already has username, userid, ip, url, message, type, datetime…
	// Store it wherever you like — here, the built-in NoSQL (Module 5).
	NOSQL('tk_audit').insert(log);
};
