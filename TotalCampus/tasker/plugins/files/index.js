// Tasker's "files" plugin — attach files to tasks.
//
// 📚 Frontend · Working with files — uses Total.js's built-in FILESTORAGE (no
//    external service): the bytes live in FILESTORAGE, the metadata in NOSQL,
//    and a public route streams them back. Modelled on the official "admin"
//    app's files plugin, adapted to Tasker's embedded database.
//
// NEWACTION style again: routes live in the actions (route:'API ?'), reached
// from the UI by name with TAPI('Files|upload', ...).

exports.icon = 'ti ti-paperclip';
exports.name = 'Files';

// Attach a file to a task. The browser sends it as a base64 data-URI; the
// `DataURI` input type parses it into { type, buffer } for free.
NEWACTION('Files|upload', {
	name: 'Attach a file to a task',
	route: 'API ?',
	user: true,
	input: '*taskid:String,*name:String,*data:DataURI',
	action: function($, model) {
		var id = UID();
		var ext = (model.name.split('.').pop() || 'bin').toLowerCase();
		var meta = {
			id: id,
			taskid: model.taskid,
			userid: $.user.id,
			name: model.name,
			ext: ext,
			type: model.data.type,
			size: model.data.buffer.length,
			url: '/download/' + id + '.' + ext,
			dtcreated: NOW
		};
		// Store the bytes (public:1 = downloadable without auth), then the metadata.
		FILESTORAGE('tasker').save(id, model.name, model.data.buffer, { public: 1 }, function(err) {
			if (err) {
				$.invalid(err);
				return;
			}
			NOSQL('tk_files').insert(meta).callback(function() {
				$.audit('File "{name}" attached');
				$.success(meta);
			});
		});
	}
});

// List a task's files (the UI loads them with each task — see Tasks/query).
NEWACTION('Files|query', {
	name: 'List a task\'s files',
	route: 'API ?',
	user: true,
	action: function($) {
		NOSQL('tk_files').find().where('taskid', $.query.taskid).callback(function(err, response) {
			$.callback(response || []);
		});
	}
});

// Remove a file (metadata + the stored bytes).
NEWACTION('Files|remove', {
	name: 'Remove a file',
	route: 'API ?',
	user: true,
	input: '*id:String',
	action: function($, model) {
		NOSQL('tk_files').remove().where('id', model.id).callback(function() {
			FILESTORAGE('tasker').remove(model.id, function() {
				$.audit('File removed', 'warning');
				$.success();
			});
		});
	}
});

// Public download route — a FILE route streams the file straight from
// FILESTORAGE (FILE routes give us `$.split` and proper file serving).
exports.install = function() {
	ROUTE('FILE /download/*.*', function($) {
		var name = $.split[1] || '';            // "{id}.{ext}"
		var id = name.substring(0, name.lastIndexOf('.'));
		FILESTORAGE('tasker').http($, { id: id, download: true });
	});
};
