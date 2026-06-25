// Notifications + the real-time channel + scheduled reminders.
//
// 📚 Module 9 · Sharing & notifications — reach a user the best way available:
//    live over a WebSocket if they're online, by email if they're not.

// Who is connected right now (userid -> client). Filled by the SOCKET route below.
var online = {};

// Module 8/9 · Real-time — a WebSocket channel. Remember who's connected.
ROUTE('SOCKET /live/', function($) {
	$.on('open', function(client) {
		online[client.user ? client.user.id : client.id] = client;
	});
	$.on('close', function(client) {
		delete online[client.user ? client.user.id : client.id];
	});
});

// Module 9 · the one notify, two channels. Shared via FUNC so any schema can call it.
FUNC.notify = function(userid, message) {
	var client = online[userid];
	if (client) {
		client.send({ type: 'notify', message: message });   // instant (online)
	} else if (CONF.mail_smtp) {
		// Offline → email. MAIL is the built-in SMTP client (Module 6 · toolbox).
		MAIL('user' + userid + '@example.com', 'Tasker', message);
	}
};

// 📚 Module 9 · Reminders — every morning at 09:00, nudge owners about tasks due
//    today. CRON is built in; no node-cron, no extra process.
CRON('0 9 * * *', function() {
	var today = NOW.format('yyyy-MM-dd');
	NOSQL('tk_tasks').find().where('done', false).callback(function(err, tasks) {
		for (var task of (tasks || [])) {
			if (task.due && task.due.format && task.due.format('yyyy-MM-dd') === today)
				FUNC.notify(task.userid, 'Task due today: ' + task.title);
		}
	});
});
