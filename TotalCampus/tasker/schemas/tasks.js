// Tasker's Task — the shape of a to-do, and everything you can do with it.
//
// 📚 Module 4 · Working with data — a SCHEMA describes and VALIDATES data.
//    In Total.js 5 the data shape is a JSON schema (the string below); the type
//    plus `*` (required) IS the validation — Total.js enforces it for free.
// 📚 Module 3 · Routing & controllers — the actions below are reached via routes.
// 📚 Module 5 · Databases — stored with the built-in embedded NoSQL via NOSQL(),
//    using the same `.find().where().callback()` style you learned. (Switch to
//    PostgreSQL with `querybuilderpg` and the very same methods — no refactor.)
// 📚 Module 6 · Audit — every change is recorded with $.audit().
// 📚 Module 7 · Users — a task belongs to a user ($.user).
// 📚 Module 9 · Sharing — a task can be assigned to another user.

// --- The data shape (Module 4) ----------------------------------------------
// `*title` is required; the rest are optional. Types: UID, String, Boolean, Number, Date.
NEWSCHEMA('Task', 'id:UID,*title:String(120),done:Boolean,icon:String,priority:Number,due:Date,userid:String,assignedto:String,dtcreated:Date');

// --- The operations (Module 3) ----------------------------------------------
NEWSCHEMA('Tasks', function($) {

	// List the current user's tasks.
	// 📚 Module 3 (GET) · Module 5 (find/sort) · Module 7 (filter by $.user)
	$.action('query', {
		name: 'List my tasks',
		action: function($) {
			var uid = $.user ? $.user.id : 'demo';
			var builder = NOSQL('tk_tasks').find();
			builder.where('userid', uid);
			builder.sort('dtcreated', 'desc'); // newest first
			builder.callback(function(err, tasks) {
				tasks = tasks || [];
				// Attach each task's files (Frontend · Working with files).
				NOSQL('tk_files').find().where('userid', uid).callback(function(err, files) {
					files = files || [];
					for (var i = 0; i < tasks.length; i++)
						tasks[i].files = files.filter(function(f) { return f.taskid === tasks[i].id; });
					$.callback(tasks);
				});
			});
		}
	});

	// Read one task.
	// 📚 Module 3 (GET /{id}, params) · Module 5 (read)
	$.action('read', {
		name: 'Read one task',
		params: 'id:UID',
		action: function($) {
			NOSQL('tk_tasks').read().where('id', $.params.id).callback(function(err, item) {
				if (item)
					$.callback(item);
				else
					$.invalid(404);
			});
		}
	});

	// Create a task (the input is validated against the Task shape).
	// 📚 Module 4 (validated `model`) · Module 5 (insert) · Module 6 (audit) · Module 7 (owner)
	$.action('insert', {
		name: 'Create a task',
		input: '@Task',
		action: function($, model) {
			model.id = UID();
			model.userid = $.user ? $.user.id : 'demo';
			model.done = false;
			model.dtcreated = NOW;
			NOSQL('tk_tasks').insert(model).callback(function() {
				$.audit('Task "{title}" created');  // Module 6 — dynamic {field} from the data
				$.success(model.id);
			});
		}
	});

	// Update a task (partial — only the given fields).
	// 📚 Module 3 (PUT) · Module 5 (modify = partial update)
	$.action('update', {
		name: 'Update a task',
		params: 'id:UID',
		input: 'title:String,done:Boolean,priority:Number,due:Date',
		action: function($, model) {
			// Only update the fields the client actually sent (a true partial
			// update) — so toggling `done` doesn't wipe the title.
			var patch = {};
			for (var key in $.body) {
				if (key in model)
					patch[key] = model[key];
			}
			NOSQL('tk_tasks').modify(patch).where('id', $.params.id).callback(function() {
				$.audit('Task updated');
				$.success();
			});
		}
	});

	// Delete a task.
	// 📚 Module 3 (DELETE) · Module 5 (remove)
	$.action('remove', {
		name: 'Delete a task',
		params: 'id:UID',
		action: function($) {
			NOSQL('tk_tasks').remove().where('id', $.params.id).callback(function() {
				$.audit('Task removed', 'warning');  // audit type (Module 6)
				$.success();
			});
		}
	});

	// Assign a task to another user, then notify them.
	// 📚 Module 9 · Sharing & notifications — live over WebSocket if online, email if not
	//    (see /definitions/notify.js).
	$.action('assign', {
		name: 'Assign a task to a user',
		params: 'id:UID',
		input: '*userid:String',
		action: function($, model) {
			NOSQL('tk_tasks').modify({ assignedto: model.userid }).where('id', $.params.id).callback(function() {
				FUNC.notify(model.userid, 'A task was shared with you');
				$.audit('Task shared');
				$.success();
			});
		}
	});
});
