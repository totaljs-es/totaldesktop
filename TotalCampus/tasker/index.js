// Tasker — the complete app you build across TotalCampus.
//
// Run it for real:
//     npm install
//     node index.js          → opens http://localhost:8000
//
// 📚 Learned in: Module 1 · Getting started — install Total.js and start a server.

require('total5');

// Total.js auto-loads /definitions, /schemas, /controllers, /modules and /views
// from this folder — the layout you learned in Module 2 · Anatomy of a Total.js
// project. You never wire them up by hand.
F.run({
	name: 'Tasker',
	port: 8000,
	release: false
	// 📚 Module 10 · Going to production — run with `release: true` (or `node index.js --release`),
	// and `cluster: 'auto'` to use every CPU core (Module 11 · Going expert).
});
