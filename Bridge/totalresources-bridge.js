// Total.js bridge module for the TotalResources native app.
// Default route prefix: /$desktop/{what}

const desktop_token = CONF.desktop_token || '';
const desktop_url = normalizeDesktopURL(CONF.desktop_url || '/$desktop/');

exports.install = function() {
	ROUTE('GET ' + desktop_url + 'resources_init', resources_init);
	ROUTE('GET ' + desktop_url + 'resources', resources_read_endpoint);
	ROUTE('POST ' + desktop_url + 'resources', resources_save_endpoint);
};

var Total = Total || F;
if (!F.is5) $ = this;

function authorize($) {
	if (!desktop_token) {
		$.invalid(401);
		return false;
	}

	if (BLOCKED($, 20)) {
		$.invalid(401);
		return false;
	}

	var token = $.headers['x-totaldesktop-token'] || '';
	if (!token || token !== desktop_token) {
		$.invalid(401);
		return false;
	}

	BLOCKED($, null);
	return true;
}

function normalizeDesktopURL(url) {
	return url.endsWith('/') ? url : url + '/';
}

function resources_init($) {
	if (!authorize($))
		return;

	init($);
}

function resources_read_endpoint($) {
	if (!authorize($))
		return;

	resources_read($);
}

function resources_save_endpoint($) {
	if (!authorize($))
		return;

	resources_save($);
}

function init($) {
	$.json({
		name: CONF.name || 'Total.js App',
		app: 'resources',
		resourcesEndpoint: 'resources',
		resourcesReadEndpoint: 'resources',
		resourcesWriteEndpoint: 'resources',
		total_version: Total.version + ''
	});
}

function resources_read($) {
	U.ls(PATH.root(), function(files) {
		var unique = {};

		for (var i = 0; i < files.length; i++) {
			var filename = files[i];

			if (filename.startsWith(PATH.root('node_modules')) || filename.startsWith(PATH.modules()) || filename.endsWith('spa.min@20.js') || filename.endsWith('spa.min@19.js'))
				continue;

			if (!isresourcefile(filename))
				continue;

			var content = Total.Fs.readFileSync(filename, 'utf8');
			var phrases = extractphrases(content);

			for (var key in phrases)
				unique[key] || (unique[key] = phrases[key]);
		}

		var items = [];
		for (var hash in unique)
			items.push({ hash: hash, text: unique[hash] });

		items.quicksort('hash');

		$.json({
			success: true,
			items: items
		});
	}, function(filename, isdir) {
		return isdir ? true : isresourcefile(filename);
	});
}

function resources_save($) {
	var body = $.body || '';
	var language = (body.language || '').toLowerCase();
	var resource = body.resource || '';

	if (!language || !/^[a-z]{2}(?:_[a-z]{2,4})?$/.test(language) || !resource) {
		$.invalid(400);
		return;
	}

	var filename = language + '.resource';
	var path = PATH.root('resources/' + filename);

	Total.Fs.writeFile(path, resource, function(err) {
		if (err) {
			$.invalid(400);
			return;
		}

		$.json({
			success: true,
			language: language
		});
	});
}

function extractphrases(value) {
	var index = -1;
	var output = {};

	while (true) {
		index = value.indexOf('@(', index);
		if (index === -1)
			break;

		var counter = 0;

		for (var i = index + 2; i < value.length; i++) {
			var c = value[i];

			if (c === '(') {
				counter++;
				continue;
			}

			if (c !== ')')
				continue;

			if (counter) {
				counter--;
				continue;
			}

			var raw = value.substring(index, i + 1);
			var text = raw.substring(2, raw.length - 1);
			output['T' + text.hash(true).toString(36)] = text;
			index += raw.length - 2;
			break;
		}
	}

	return output;
}

function isresourcefile(filename) {
	var ext = U.getExtension(filename).toLowerCase();
	return ext === 'html' || ext === 'js';
}
