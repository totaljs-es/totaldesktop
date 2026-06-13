// Total.js bridge module for the TotalResources native app.
// Default route prefix: /$desktop/{what}

const desktop_token = CONF.desktop_token || '';
const desktop_resources_token = CONF.desktop_resources_token || desktop_token;
const desktop_resources_url = normalizeDesktopURL(CONF.desktop_resources_url || CONF.desktop_url || '/$desktop/');
const desktop_resources_bridge_version = '1.1.0';

exports.install = function() {
	ROUTE('GET ' + desktop_resources_url + 'resources_init', resources_init);
	ROUTE('GET ' + desktop_resources_url + 'resources', resources_read_endpoint);
	ROUTE('POST ' + desktop_resources_url + 'resources', resources_save_endpoint);
};

var Total = Total || F;
if (!F.is5) $ = this;

var path_resources = PATH.root('resources');
PATH.mkdir(path_resources);

function authorize($) {
	if (!desktop_resources_token) {
		$.invalid(401);
		return false;
	}

	if (BLOCKED($, 20)) {
		$.invalid(401);
		return false;
	}

	var token = $.headers['x-totaldesktop-token'] || '';
	if (!token || token !== desktop_resources_token) {
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
		bridge: desktop_resources_bridge_version,
		resourcesEndpoint: 'resources',
		resourcesReadEndpoint: 'resources',
		resourcesWriteEndpoint: 'resources',
		total_version: Total.version + ''
	});
}

function resources_read($) {
	U.ls(PATH.root(), function(files) {
		var unique = {};
		var skipped = 0;

		for (var i = 0; i < files.length; i++) {
			var filename = files[i];

			if (shouldskipfile(filename))
				continue;

			if (!isresourcefile(filename))
				continue;

			var content = readtextfile(filename);
			if (content === null) {
				skipped++;
				continue;
			}

			var phrases = extractphrases(content);

			for (var key in phrases)
				unique[key] || (unique[key] = phrases[key]);
		}

		var items = [];
		for (var hash in unique)
			items.push({ hash: hash, text: unique[hash] });

		items.sort(function(a, b) {
			return a.hash.localeCompare(b.hash);
		});

		$.json({
			success: true,
			bridge: desktop_resources_bridge_version,
			count: items.length,
			skipped: skipped,
			items: items
		});
	}, function(filename, isdir) {
		return isdir ? !shouldskipdirectory(filename) : isresourcefile(filename);
	});
}

function resources_save($) {
	var body = parsebody($.body);
	var language = (body.language || '').toLowerCase().replace(/-/g, '_');
	var resource = body.resource;

	if (!language || !/^[a-z]{2}(?:_[a-z0-9]{2,8})?$/.test(language) || typeof(resource) !== 'string') {
		$.invalid(400);
		return;
	}

	var filename = language + '.resource';
	var path = PATH.root('resources/' + filename);
	PATH.mkdir(path_resources);

	Total.Fs.writeFile(path, resource, function(err) {
		if (err) {
			$.invalid(400);
			return;
		}

		$.json({
			success: true,
			bridge: desktop_resources_bridge_version,
			language: language,
			saved: counttranslatedlines(resource)
		});
	});
}

function parsebody(body) {
	if (!body)
		return {};

	if (typeof(body) === 'string') {
		try {
			return JSON.parse(body);
		} catch (e) {
			return {};
		}
	}

	return body;
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
			output['T' + resourcehash(text)] = text;
			index += raw.length - 2;
			break;
		}
	}

	return output;
}

function resourcehash(text) {
	if (text && typeof(text.hash) === 'function')
		return text.hash(true).toString(36);

	var hash = 0;
	for (var i = 0; i < text.length; i++)
		hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;

	return Math.abs(hash).toString(36);
}

function isresourcefile(filename) {
	var ext = U.getExtension(filename).toLowerCase();
	return ext === 'html' || ext === 'js';
}

function shouldskipdirectory(filename) {
	return filename.startsWith(PATH.root('node_modules')) ||
		filename.startsWith(PATH.modules()) ||
		filename.startsWith(PATH.root('.git')) ||
		filename.startsWith(PATH.root('.build')) ||
		filename.startsWith(PATH.root('tmp')) ||
		filename.startsWith(PATH.root('logs'));
}

function shouldskipfile(filename) {
	return shouldskipdirectory(filename) ||
		filename.endsWith('.min.js') ||
		filename.endsWith('spa.min.js') ||
		filename.endsWith('spa.min@19.js') ||
		filename.endsWith('spa.min@20.js');
}

function readtextfile(filename) {
	try {
		return Total.Fs.readFileSync(filename, 'utf8');
	} catch (e) {
		return null;
	}
}

function counttranslatedlines(resource) {
	var lines = resource.split('\n');
	var count = 0;

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (line && !line.startsWith('//') && line.indexOf(':') !== -1)
			count++;
	}

	return count;
}
