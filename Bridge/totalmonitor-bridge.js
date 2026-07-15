// Total.js bridge module for the TotalMonitor native app.
// Default route prefix: /$desktop/{what}

const desktop_token = CONF.desktop_token || '';
const desktop_monitor_token = CONF.desktop_monitor_token || desktop_token;
const desktop_monitor_url = normalizeDesktopURL(CONF.desktop_monitor_url || CONF.desktop_url || '/$desktop/');
const desktop_monitor_bridge_version = '1.6.1';

exports.install = function() {
	ROUTE('GET ' + desktop_monitor_url + 'monitor_init', monitor_init);
	ROUTE('GET ' + desktop_monitor_url + 'monitor', monitor_endpoint);
	ROUTE('GET ' + desktop_monitor_url + 'monitor_live', monitor_live_endpoint);
	installendpointinstrumentation();
};

var previouscpusnapshot = null;
var Total = Total || F;
if (!F.is5)	$ = this;

var performance_hooks = loadperformancehooks();
var eventloopmonitor = createeventloopmonitor(performance_hooks);
var previousgcstats = null;
var endpointinstrumentationinstalled = false;
var endpointmetrics = {};
var endpointmetriclimit = +(CONF.desktop_monitor_endpoint_limit || 200);
var endpointslowthresholdms = +(CONF.desktop_monitor_slow_ms || 800);
var endpointhistorylimit = +(CONF.desktop_monitor_endpoint_history || 60);

function authorize($) {
	if (!desktop_monitor_token) {
		$.invalid(401);
		return false;
	}

	if (BLOCKED($, 20)) {
		$.invalid(401);
		return false;
	}

	var token = $.headers['x-totaldesktop-token'] || '';
	if (!token || token !== desktop_monitor_token) {
		$.invalid(401);
		return false;
	}

	BLOCKED($, null);
	return true;
}

function normalizeDesktopURL(url) {
	return url.endsWith('/') ? url : url + '/';
}

function monitor_init($) {
	if (!authorize($))
		return;

	init($);
}

function monitor_endpoint($) {
	if (!authorize($))
		return;

	stats_read($);
}

function monitor_live_endpoint($) {
	if (!authorize($))
		return;

	live_read($);
}

function init($) {
	$.json({
		name: CONF.name || 'Total.js App',
		app: 'monitor',
		monitorEndpoint: 'monitor',
		liveEndpoint: 'monitor_live',
		total_version: Total.version + ''
	});
}

function stats_read($) {
	var started = Date.now();
	var filename = getsnapshotfilename();

	Total.Fs.readFile(filename, 'utf8', function(err, response) {
		var snapshot = parsesnapshot(response);
		var payload = buildmonitorpayload(snapshot, err, Date.now() - started, filename);
		$.json(payload);
	});
}

function getsnapshotfilename() {
	var main = process.mainModule && process.mainModule.filename ? process.mainModule.filename : null;

	if (!main && require.main && require.main.filename)
		main = require.main.filename;

	if (!main)
		main = PATH.root('index.js');

	return main + '.json';
}

function live_read($) {
	var started = Date.now();
	$.json(buildlivepayload(Date.now() - started));
}

function parsesnapshot(response) {
	if (!response)
		return emptySnapshot();

	try {
		return JSON.parse(response);
	} catch (e) {
		var snapshot = emptySnapshot();
		snapshot.invalidSnapshot = true;
		return snapshot;
	}
}

function buildmonitorpayload(snapshot, err, bridgeProcessingMs, sourceFile) {
	var stats = snapshot && snapshot.stats instanceof Array ? snapshot.stats : [];
	var latest = stats.length ? stats[stats.length - 1] : null;
	var runtime = getruntimeinfo(latest);

	return {
		success: !err,
		bridge: desktop_monitor_bridge_version,
		pid: snapshot.pid || process.pid,
		date: snapshot.date || new Date().toISOString(),
		stats: stats,
		current: latest,
		liveMetrics: getlivemetrics(),
		endpointMetrics: getendpointmetrics(latest),
		environment: {
			platform: process.platform,
			arch: process.arch,
			hostname: Total.Os.hostname(),
			isDocker: runtime.docker.isDocker
		},
		runtime: runtime,
		metrics: latest ? {
			requestsPerMinute: latest.rm || 0,
			filesServedPerMinute: latest.fm || 0,
			websocketMessagesPerMinute: latest.wm || 0,
			externalRequestsPerMinute: latest.em || 0,
			mailsPerMinute: latest.mm || 0,
			openFilesPerMinute: latest.om || 0,
			downloadedMBPerMinute: latest.dm || 0,
			uploadedMBPerMinute: latest.um || 0,
			publishMessagesPerMinute: latest.pm || 0,
			subscribeMessagesPerMinute: latest.sm || 0,
			callMessagesPerMinute: latest.cm || 0,
			dbReadsPerMinute: latest.dbrm || 0,
			dbWritesPerMinute: latest.dbwm || 0,
			cpuUsagePercent: latest.usage || 0,
			requestsTotal: latest.requests || 0,
			pendingRequests: latest.pending || 0,
			externalPending: latest.external || 0,
			errorCount: latest.errors || 0,
			timeoutCount: latest.timeouts || 0,
			onlineConnections: latest.online || 0,
			downloadedMBTotal: latest.download || 0,
			uploadedMBTotal: latest.upload || 0,
			overloadCount: latest.overload || 0
		} : null,
		diagnostics: {
			sourceFile: sourceFile,
			sourceAvailable: !err,
			invalidSnapshot: snapshot.invalidSnapshot === true,
			bridgeProcessingMs: bridgeProcessingMs
		}
	};
}

function buildlivepayload(bridgeProcessingMs) {
	var runtime = getruntimeinfo(null);

	return {
		success: true,
		bridge: desktop_monitor_bridge_version,
		pid: process.pid,
		date: new Date().toISOString(),
		stats: [],
		current: null,
		liveMetrics: getlivemetrics(),
		endpointMetrics: getendpointmetrics(null),
		environment: {
			platform: process.platform,
			arch: process.arch,
			hostname: Total.Os.hostname(),
			isDocker: runtime.docker.isDocker
		},
		runtime: runtime,
		diagnostics: {
			sourceFile: null,
			sourceAvailable: false,
			invalidSnapshot: false,
			bridgeProcessingMs: bridgeProcessingMs,
			mode: 'live'
		}
	};
}

function getlivemetrics() {
	var service = F.temporary && F.temporary.service ? F.temporary.service : {};
	var request = F.stats && F.stats.request ? F.stats.request : {};
	var response = F.stats && F.stats.response ? F.stats.response : {};
	var performance = F.stats && F.stats.performance ? F.stats.performance : {};
	var errors = F.errors && F.errors.length ? F.errors[F.errors.length - 1] : null;
	var timeouts = F.timeouts && F.timeouts.length ? F.timeouts[F.timeouts.length - 1] : null;

	return {
		memoryMB: tonumber(process.memoryUsage().heapUsed),
		cpuUsagePercent: fixednumber(service.usage || 0, 2),
		requestsTotal: request.request || 0,
		pendingRequests: request.pending || 0,
		externalPending: request.external || 0,
		errorCount: F.stats ? (F.stats.error || 0) : 0,
		timeoutCount: response.timeout || 0,
		onlineConnections: performance.online || 0,
		downloadedMBTotal: fixednumber(request.size || 0, 3),
		uploadedMBTotal: fixednumber(response.size || 0, 3),
		lastError: errors ? (errors.date.toJSON() + ' ' + (errors.name ? (errors.name + ' - ') : '') + errors.error) : '',
		lastTimeout: timeouts || '',
		minuteProgress: {
			requests: performance.request || 0,
			files: performance.file || 0,
			websocketMessages: performance.message || 0,
			externalRequests: performance.external || 0,
			mails: performance.mail || 0,
			openFiles: performance.open || 0,
			downloadedMB: fixednumber(performance.download || 0, 3),
			uploadedMB: fixednumber(performance.upload || 0, 3),
			publishMessages: performance.publish || 0,
			subscribeMessages: performance.subscribe || 0,
			callMessages: performance.call || 0,
			dbReads: performance.dbrm || 0,
			dbWrites: performance.dbwm || 0
		}
	};
}

function getendpointmetrics(latest) {
	var output = [];
	var seen = {};

	addendpointmetric(output, seen, aggregateendpointmetric(latest));

	var extracted = extractendpointstats();
	for (var i = 0; i < extracted.length; i++)
		addendpointmetric(output, seen, extracted[i]);

	var active = getactiveendpointmetrics();
	for (var a = 0; a < active.length; a++)
		addendpointmetric(output, seen, active[a]);

	var catalog = getroutecatalog();
	for (var j = 0; j < catalog.length; j++)
		addendpointmetric(output, seen, catalog[j]);

	output.sort(function(a, b) {
		var pressureA = (a.errorsPerMinute || 0) * 100000 + (a.timeoutCount || 0) * 10000 + (a.requestsPerMinute || 0) * 10 + (a.latencyP95MS || a.latencyAvgMS || 0);
		var pressureB = (b.errorsPerMinute || 0) * 100000 + (b.timeoutCount || 0) * 10000 + (b.requestsPerMinute || 0) * 10 + (b.latencyP95MS || b.latencyAvgMS || 0);
		return pressureB - pressureA;
	});

	return output.slice(0, 40);
}

function aggregateendpointmetric(latest) {
	var live = getlivemetrics();
	var totalRequests = live.requestsTotal || (latest ? latest.requests : 0) || 0;
	var requestsPerMinute = latest ? (latest.rm || 0) : ((live.minuteProgress && live.minuteProgress.requests) || 0);
	var errorsTotal = live.errorCount || (latest ? latest.errors : 0) || 0;
	var timeoutCount = live.timeoutCount || (latest ? latest.timeouts : 0) || 0;

	return {
		id: 'ALL *',
		method: 'ALL',
		path: '*',
		requestsPerMinute: requestsPerMinute,
		requestsTotal: totalRequests,
		errorsPerMinute: latest ? (latest.errors || 0) : errorsTotal,
		errorsTotal: errorsTotal,
		timeoutCount: timeoutCount,
		latencyAvgMS: null,
		latencyP50MS: null,
		latencyP95MS: null,
		latencyP99MS: null,
		slowRequests: latest ? (latest.overload || 0) : 0,
		lastStatusCode: null,
		lastError: live.lastError || '',
		source: 'aggregate',
		updatedAt: new Date().toISOString()
	};
}

function installendpointinstrumentation() {
	if (endpointinstrumentationinstalled || typeof(ON) !== 'function')
		return;

	endpointinstrumentationinstalled = true;
	ON('request_begin', monitorrequestbegin);
	ON('request_end', monitorrequestend);
}

function monitorrequestbegin(req) {
	if (!req || isdesktopmonitorrequest(req))
		return;

	req.$totalmonitor_start = Date.now();
}

function monitorrequestend(req, res) {
	if (!req || isdesktopmonitorrequest(req))
		return;

	if (req.$totalmonitor_recorded)
		return;

	req.$totalmonitor_recorded = true;

	var started = req.$totalmonitor_start;
	if (!started)
		return;

	var duration = Math.max(Date.now() - started, 0);
	var route = resolveinstrumentedroute(req);
	var status = resolvestatuscode(req, res);
	var id = route.method + ' ' + route.path;
	var now = new Date();
	var minute = currentminute(now);
	var metric = endpointmetrics[id];

	if (!metric) {
		metric = endpointmetrics[id] = {
			id: id,
			method: route.method,
			path: route.path,
			requestsTotal: 0,
			errorsTotal: 0,
			timeoutCount: 0,
			slowRequests: 0,
			latencies: [],
			history: [],
			minute: minute,
			requestsPerMinute: 0,
			errorsPerMinute: 0,
			lastStatusCode: null,
			lastError: '',
			updatedAt: now.toISOString()
		};
	}

	resetendpointminute(metric, minute);
	metric.requestsTotal++;
	metric.requestsPerMinute++;
	metric.lastStatusCode = status;
	metric.updatedAt = now.toISOString();
	metric.latencies.push(duration);

	if (metric.latencies.length > 300)
		metric.latencies.splice(0, metric.latencies.length - 300);

	if (status >= 400) {
		metric.errorsTotal++;
		metric.errorsPerMinute++;
		metric.lastError = status + ' ' + (req.url || route.path);
	}

	if (status === 408 || req.$total_timeout || req.$total_canceled) {
		metric.timeoutCount++;
	}

	if (duration >= endpointslowthresholdms)
		metric.slowRequests++;

	recordendpointhistory(metric, minute, now, duration, status);
	pruneendpointmetrics();
}

function getactiveendpointmetrics() {
	var ids = Object.keys(endpointmetrics);
	var output = [];

	for (var i = 0; i < ids.length; i++) {
		var metric = endpointmetrics[ids[i]];
		resetendpointminute(metric, currentminute(new Date()));
		var latencies = metric.latencies.slice().sort(function(a, b) { return a - b; });

		output.push({
			id: metric.id,
			method: metric.method,
			path: metric.path,
			requestsPerMinute: metric.requestsPerMinute || 0,
			requestsTotal: metric.requestsTotal || 0,
			errorsPerMinute: metric.errorsPerMinute || 0,
			errorsTotal: metric.errorsTotal || 0,
			timeoutCount: metric.timeoutCount || 0,
			latencyAvgMS: averagelatency(latencies),
			latencyP50MS: percentilelatency(latencies, 50),
			latencyP95MS: percentilelatency(latencies, 95),
			latencyP99MS: percentilelatency(latencies, 99),
			slowRequests: metric.slowRequests || 0,
			lastStatusCode: metric.lastStatusCode,
			lastError: metric.lastError || '',
			history: endpointmetricshistory(metric),
			source: 'active',
			updatedAt: metric.updatedAt
		});
	}

	return output;
}

function recordendpointhistory(metric, minute, now, duration, status) {
	var history = metric.history;
	var bucket = history.length ? history[history.length - 1] : null;

	if (!bucket || bucket.minute !== minute) {
		bucket = {
			minute: minute,
			date: now.toISOString(),
			requests: 0,
			errors: 0,
			timeouts: 0,
			slowRequests: 0,
			latencies: []
		};
		history.push(bucket);
	}

	bucket.requests++;
	bucket.latencies.push(duration);

	if (status >= 400)
		bucket.errors++;

	if (status === 408)
		bucket.timeouts++;

	if (duration >= endpointslowthresholdms)
		bucket.slowRequests++;

	if (bucket.latencies.length > 300)
		bucket.latencies.splice(0, bucket.latencies.length - 300);

	if (history.length > endpointhistorylimit)
		history.splice(0, history.length - endpointhistorylimit);
}

function endpointmetricshistory(metric) {
	var history = metric.history || [];
	var output = [];

	for (var i = 0; i < history.length; i++) {
		var bucket = history[i];
		var latencies = (bucket.latencies || []).slice().sort(function(a, b) { return a - b; });
		output.push({
			date: bucket.date,
			requests: bucket.requests || 0,
			errors: bucket.errors || 0,
			timeouts: bucket.timeouts || 0,
			slowRequests: bucket.slowRequests || 0,
			latencyAvgMS: averagelatency(latencies),
			latencyP95MS: percentilelatency(latencies, 95),
			latencyP99MS: percentilelatency(latencies, 99)
		});
	}

	return output;
}

function resolveinstrumentedroute(req) {
	var method = cleanmethod(req.method || 'ALL');
	var route = req.$total_route || null;
	var path = route && (route.url || route.path) ? (route.url || route.path) : '';

	if (!path && req.uri && req.uri.pathname)
		path = req.uri.pathname;
	if (!path && req.path instanceof Array)
		path = '/' + req.path.join('/');
	if (!path)
		path = req.url || '*';

	return {
		method: method,
		path: cleanpath(path)
	};
}

function resolvestatuscode(req, res) {
	if (res) {
		if (res.statusCode)
			return res.statusCode;
		if (res.options && res.options.code)
			return res.options.code;
	}

	if (req && req.$total_exception && req.$total_exception.status)
		return req.$total_exception.status;

	return 200;
}

function isdesktopmonitorrequest(req) {
	var url = (req.uri && req.uri.pathname) || req.url || '';
	return url.indexOf(desktop_monitor_url) === 0;
}

function resetendpointminute(metric, minute) {
	if (metric.minute === minute)
		return;

	metric.minute = minute;
	metric.requestsPerMinute = 0;
	metric.errorsPerMinute = 0;
}

function pruneendpointmetrics() {
	var ids = Object.keys(endpointmetrics);
	if (ids.length <= endpointmetriclimit)
		return;

	ids.sort(function(a, b) {
		return new Date(endpointmetrics[a].updatedAt).getTime() - new Date(endpointmetrics[b].updatedAt).getTime();
	});

	for (var i = 0; i < ids.length - endpointmetriclimit; i++)
		delete endpointmetrics[ids[i]];
}

function currentminute(date) {
	return date.toISOString().substring(0, 16);
}

function averagelatency(values) {
	if (!values.length)
		return null;
	var sum = 0;
	for (var i = 0; i < values.length; i++)
		sum += values[i];
	return +(sum / values.length).toFixed(2);
}

function percentilelatency(values, percentile) {
	if (!values.length)
		return null;
	var index = Math.ceil((percentile / 100) * values.length) - 1;
	index = Math.max(0, Math.min(index, values.length - 1));
	return +values[index].toFixed(2);
}

function extractendpointstats() {
	var containers = [];

	if (F.stats) {
		containers.push({ source: 'F.stats.routes', value: F.stats.routes });
		containers.push({ source: 'F.stats.route', value: F.stats.route });
		containers.push({ source: 'F.stats.endpoints', value: F.stats.endpoints });
		containers.push({ source: 'F.stats.endpoint', value: F.stats.endpoint });
		containers.push({ source: 'F.stats.urls', value: F.stats.urls });
		containers.push({ source: 'F.stats.url', value: F.stats.url });
		if (F.stats.performance) {
			containers.push({ source: 'F.stats.performance.routes', value: F.stats.performance.routes });
			containers.push({ source: 'F.stats.performance.endpoints', value: F.stats.performance.endpoints });
		}
	}

	var output = [];
	for (var i = 0; i < containers.length; i++)
		normalizeendpointcontainer(containers[i].value, containers[i].source, output);

	return output;
}

function normalizeendpointcontainer(value, source, output) {
	if (!value)
		return;

	if (value instanceof Array) {
		for (var i = 0; i < value.length; i++)
			normalizeendpointitem(value[i], null, source, output);
		return;
	}

	if (typeof(value) === 'object') {
		var keys = Object.keys(value);
		for (var j = 0; j < keys.length; j++)
			normalizeendpointitem(value[keys[j]], keys[j], source, output);
	}
}

function normalizeendpointitem(item, key, source, output) {
	if (!item && !key)
		return;

	if (typeof(item) === 'number')
		item = { requestsPerMinute: item };

	if (!item || typeof(item) !== 'object')
		item = {};

	var parsed = parseendpointkey(key || item.id || item.route || item.url || item.path || item.name || '');
	var method = cleanmethod(item.method || item.type || parsed.method);
	var path = cleanpath(item.path || item.url || item.route || item.name || parsed.path);

	if (!path)
		return;

	output.push({
		id: method + ' ' + path,
		method: method,
		path: path,
		requestsPerMinute: intvalue(item.requestsPerMinute, item.rpm, item.minute, item.requests, item.count),
		requestsTotal: intvalue(item.requestsTotal, item.total, item.requests, item.count),
		errorsPerMinute: intvalue(item.errorsPerMinute, item.epm, item.errorsMinute, item.errors),
		errorsTotal: intvalue(item.errorsTotal, item.errors, item.error),
		timeoutCount: intvalue(item.timeoutCount, item.timeouts, item.timeout),
		latencyAvgMS: optionalnumber(item.latencyAvgMS, item.avgMS, item.averageMS, item.latency, item.avg),
		latencyP50MS: optionalnumber(item.latencyP50MS, item.p50MS, item.p50),
		latencyP95MS: optionalnumber(item.latencyP95MS, item.p95MS, item.p95),
		latencyP99MS: optionalnumber(item.latencyP99MS, item.p99MS, item.p99),
		slowRequests: intvalue(item.slowRequests, item.slow, item.overload),
		lastStatusCode: optionalint(item.lastStatusCode, item.statusCode, item.status),
		lastError: textvalue(item.lastError, item.errorMessage, item.error),
		source: source,
		updatedAt: new Date().toISOString()
	});
}

function getroutecatalog() {
	var containers = [F.routes, F.routes_api, F.routes_web, F.routes_websocket];
	var output = [];

	for (var i = 0; i < containers.length; i++)
		collectroutecatalog(containers[i], output);

	return output;
}

function collectroutecatalog(value, output) {
	if (!value)
		return;

	if (value instanceof Array) {
		for (var i = 0; i < value.length; i++)
			collectroutecatalogitem(value[i], output);
		return;
	}

	if (typeof(value) === 'object') {
		var keys = Object.keys(value);
		for (var j = 0; j < keys.length; j++) {
			collectroutecatalogitem(value[keys[j]], output, keys[j]);
		}
	}
}

function collectroutecatalogitem(route, output, key) {
	if (!route && !key)
		return;

	var parsed = parseendpointkey(key || '');
	var method = cleanmethod((route && (route.method || route.type || route.method_name)) || parsed.method);
	var path = cleanpath((route && (route.url || route.path || route.route || route.name)) || parsed.path);

	if (!path)
		return;

	output.push({
		id: method + ' ' + path,
		method: method,
		path: path,
		requestsPerMinute: 0,
		requestsTotal: 0,
		errorsPerMinute: 0,
		errorsTotal: 0,
		timeoutCount: 0,
		latencyAvgMS: null,
		latencyP50MS: null,
		latencyP95MS: null,
		latencyP99MS: null,
		slowRequests: 0,
		lastStatusCode: null,
		lastError: '',
		source: 'routeCatalog',
		updatedAt: new Date().toISOString()
	});
}

function addendpointmetric(output, seen, metric) {
	if (!metric || !metric.path)
		return;

	var id = metric.id || ((metric.method || '') + ' ' + metric.path);
	if (seen[id])
		return;

	metric.id = id;
	seen[id] = true;
	output.push(metric);
}

function parseendpointkey(key) {
	var text = (key || '').toString().trim();
	var match = text.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|ALL|API|SOCKET|WEBSOCKET)\s+(.+)$/i);
	return {
		method: match ? match[1].toUpperCase() : '',
		path: match ? match[2] : text
	};
}

function cleanmethod(value) {
	var text = (value || '').toString().trim().toUpperCase();
	return text || 'ALL';
}

function cleanpath(value) {
	var text = (value || '').toString().trim();
	if (!text)
		return '';
	return text.length > 180 ? text.substring(0, 177) + '...' : text;
}

function getruntimeinfo(latest) {
	var memory = process.memoryUsage();
	var totalmem = Total.Os.totalmem();
	var freemem = Total.Os.freemem();
	var docker = getdockerinfo();
	var cpus = Total.Os.cpus() || [];
	var cpuUsageByCore = getcpuusagebycore(cpus);
	var loadavg = Total.Os.loadavg ? Total.Os.loadavg() : [];
	var disk = getdiskinfo();
	var network = getnetworkinfo();
	var eventloop = geteventloopinfo();
	var processinfo = getprocessinfo();
	var gc = getgcinfo();

	return {
		node: {
			version: process.version,
			pid: process.pid,
			uptimeSeconds: process.uptime(),
			eventLoop: eventloop,
			process: processinfo,
			gc: gc,
			memory: {
				rssMB: tonumber(memory.rss),
				heapTotalMB: tonumber(memory.heapTotal),
				heapUsedMB: tonumber(memory.heapUsed),
				externalMB: tonumber(memory.external),
				arrayBuffersMB: tonumber(memory.arrayBuffers || 0)
			}
		},
		host: {
			hostname: Total.Os.hostname(),
			type: Total.Os.type ? Total.Os.type() : null,
			platform: process.platform,
			release: Total.Os.release(),
			arch: process.arch,
			endianness: Total.Os.endianness ? Total.Os.endianness() : null,
			uptimeSeconds: Total.Os.uptime ? Total.Os.uptime() : null,
			tempDir: Total.Os.tmpdir ? Total.Os.tmpdir() : null,
			cpuCount: cpus.length,
			cpuModel: cpus.length ? cpus[0].model : null,
			cpuSpeedMHz: cpus.length ? cpus[0].speed : null,
			cpuUsageByCore: cpuUsageByCore,
			loadAverage: loadavg,
			totalMemoryMB: tonumber(totalmem),
			freeMemoryMB: tonumber(freemem),
			usedMemoryMB: tonumber(totalmem - freemem),
			disk: disk,
			network: network
		},
		app: {
			mode: latest && latest.mode ? latest.mode : (CONF.debug ? 'debug' : 'release'),
			version: CONF.version || '1.0.0',
			instanceID: CONF.instance_id || null,
			total: latest && latest.version ? latest.version : {
				node: process.version,
				total: Total.version + '',
				build: null,
				app: CONF.version || '1.0.0'
			}
		},
		docker: docker
	};
}

function loadperformancehooks() {
	try {
		return require('perf_hooks');
	} catch (e) {
		return null;
	}
}

function createeventloopmonitor(hooks) {
	try {
		if (!hooks || !hooks.monitorEventLoopDelay)
			return null;

		var monitor = hooks.monitorEventLoopDelay({ resolution: 20 });
		monitor.enable();
		return monitor;
	} catch (e) {
		return null;
	}
}

function geteventloopinfo() {
	var output = {
		supported: !!eventloopmonitor,
		delayMeanMS: null,
		delayMaxMS: null,
		delayP95MS: null,
		delayP99MS: null
	};

	if (!eventloopmonitor)
		return output;

	try {
		output.delayMeanMS = nanostoms(eventloopmonitor.mean);
		output.delayMaxMS = nanostoms(eventloopmonitor.max);
		output.delayP95MS = typeof(eventloopmonitor.percentile) === 'function' ? nanostoms(eventloopmonitor.percentile(95)) : null;
		output.delayP99MS = typeof(eventloopmonitor.percentile) === 'function' ? nanostoms(eventloopmonitor.percentile(99)) : null;
		eventloopmonitor.reset();
	} catch (e) {
		output.supported = false;
	}

	return output;
}

function getprocessinfo() {
	return {
		activeHandles: typeof(process._getActiveHandles) === 'function' ? process._getActiveHandles().length : null,
		activeRequests: typeof(process._getActiveRequests) === 'function' ? process._getActiveRequests().length : null,
		resourceUsage: getresourceusage()
	};
}

function getresourceusage() {
	if (typeof(process.resourceUsage) !== 'function')
		return null;

	try {
		var usage = process.resourceUsage();
		return {
			userCPUMS: usage.userCPUTime == null ? null : +(usage.userCPUTime / 1000).toFixed(1),
			systemCPUMS: usage.systemCPUTime == null ? null : +(usage.systemCPUTime / 1000).toFixed(1),
			maxRSSMB: usage.maxRSS == null ? null : +(usage.maxRSS / 1024).toFixed(1),
			fsRead: usage.fsRead,
			fsWrite: usage.fsWrite,
			voluntaryContextSwitches: usage.voluntaryContextSwitches,
			involuntaryContextSwitches: usage.involuntaryContextSwitches
		};
	} catch (e) {
		return null;
	}
}

function getgcinfo() {
	if (!performance_hooks || !performance_hooks.performance || typeof(performance_hooks.performance.nodeTiming) !== 'object')
		return null;

	var timing = performance_hooks.performance.nodeTiming;
	var current = {
		gcMajorDurationMS: numberornull(timing.garbageCollectionMajorDuration),
		gcMinorDurationMS: numberornull(timing.garbageCollectionMinorDuration),
		gcIncrementalDurationMS: numberornull(timing.garbageCollectionIncrementalDuration),
		gcWeakCBDurationMS: numberornull(timing.garbageCollectionWeakCBDuration)
	};

	if (!previousgcstats) {
		previousgcstats = current;
		return current;
	}

	var delta = {
		gcMajorDurationMS: deltavalue(previousgcstats.gcMajorDurationMS, current.gcMajorDurationMS),
		gcMinorDurationMS: deltavalue(previousgcstats.gcMinorDurationMS, current.gcMinorDurationMS),
		gcIncrementalDurationMS: deltavalue(previousgcstats.gcIncrementalDurationMS, current.gcIncrementalDurationMS),
		gcWeakCBDurationMS: deltavalue(previousgcstats.gcWeakCBDurationMS, current.gcWeakCBDurationMS)
	};

	previousgcstats = current;
	return delta;
}

function getcpuusagebycore(cpus) {
	if (!cpus.length)
		return [];

	var snapshot = cpus.map(function(cpu) {
		var times = cpu.times || {};

		return {
			user: times.user || 0,
			nice: times.nice || 0,
			sys: times.sys || 0,
			idle: times.idle || 0,
			irq: times.irq || 0
		};
	});

	var output = [];

	if (previouscpusnapshot && previouscpusnapshot.length === snapshot.length) {
		for (var i = 0; i < snapshot.length; i++) {
			var previous = previouscpusnapshot[i];
			var current = snapshot[i];
			var previousTotal = previous.user + previous.nice + previous.sys + previous.idle + previous.irq;
			var currentTotal = current.user + current.nice + current.sys + current.idle + current.irq;
			var totalDelta = currentTotal - previousTotal;
			var idleDelta = current.idle - previous.idle;
			var usage = totalDelta > 0 ? ((totalDelta - idleDelta) / totalDelta) * 100 : 0;

			output.push(+usage.toFixed(1));
		}
	} else {
		output = cpus.map(function() {
			return 0;
		});
	}

	previouscpusnapshot = snapshot;
	return output;
}

function getdockerinfo() {
	var isDocker = Total.Fs.existsSync('/.dockerenv') || filecontains('/proc/1/cgroup', /(docker|containerd|kubepods|podman)/i);
	var info = {
		isDocker: isDocker
	};

	if (!isDocker)
		return info;

	var memoryCurrent = readcgroupnumber([
		'/sys/fs/cgroup/memory.current',
		'/sys/fs/cgroup/memory/memory.usage_in_bytes'
	]);

	var memoryLimit = readcgroupnumber([
		'/sys/fs/cgroup/memory.max',
		'/sys/fs/cgroup/memory/memory.limit_in_bytes'
	]);

	var pidsCurrent = readcgroupnumber([
		'/sys/fs/cgroup/pids.current',
		'/sys/fs/cgroup/pids/pids.current'
	]);

	var pidsLimit = readcgroupnumber([
		'/sys/fs/cgroup/pids.max',
		'/sys/fs/cgroup/pids/pids.max'
	]);

	var cpuStat = readcpustat([
		'/sys/fs/cgroup/cpu.stat',
		'/sys/fs/cgroup/cpu/cpu.stat'
	]);

	info.memoryUsedMB = memoryCurrent == null ? null : tonumber(memoryCurrent);
	info.memoryLimitMB = isfinitecgroup(memoryLimit) ? tonumber(memoryLimit) : null;
	info.memoryUsagePercent = memoryCurrent != null && isfinitecgroup(memoryLimit) ? +(memoryCurrent / memoryLimit * 100).toFixed(1) : null;
	info.pidsCurrent = pidsCurrent;
	info.pidsLimit = isfinitecgroup(pidsLimit) ? pidsLimit : null;
	info.cpu = cpuStat;

	return info;
}

function getdiskinfo() {
	try {
		if (!Total.Fs.statfsSync)
			return null;

		var stat = Total.Fs.statfsSync(PATH.root());
		var blockSize = stat.bsize || stat.frsize || 0;
		var total = blockSize && stat.blocks ? blockSize * stat.blocks : 0;
		var free = blockSize && stat.bavail ? blockSize * stat.bavail : 0;
		var used = total > free ? total - free : 0;

		return {
			path: PATH.root(),
			totalGB: total ? togigabytes(total) : null,
			freeGB: free ? togigabytes(free) : null,
			usedGB: used ? togigabytes(used) : null,
			usedPercent: total ? +((used / total) * 100).toFixed(1) : null
		};
	} catch (e) {
		return null;
	}
}

function getnetworkinfo() {
	try {
		var interfaces = Total.Os.networkInterfaces ? Total.Os.networkInterfaces() : null;
		if (!interfaces)
			return null;

		var names = Object.keys(interfaces);
		var active = [];

		for (var i = 0; i < names.length; i++) {
			var entries = interfaces[names[i]] || [];
			var addresses = [];

			for (var j = 0; j < entries.length; j++) {
				var entry = entries[j];

				if (!entry || entry.internal)
					continue;

				addresses.push({
					address: entry.address || null,
					family: entry.family || null,
					mac: entry.mac || null
				});
			}

			if (addresses.length)
				active.push({
					name: names[i],
					addresses: addresses
				});
		}

		return {
			interfaceCount: active.length,
			interfaces: active
		};
	} catch (e) {
		return null;
	}
}

function readcpustat(paths) {
	var text = readfirst(paths);
	if (!text)
		return null;

	var lines = text.trim().split('\n');
	var output = {};

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		if (!line)
			continue;

		var parts = line.split(/\s+/);
		if (parts.length < 2)
			continue;

		var value = +parts[1];
		output[parts[0]] = isNaN(value) ? parts[1] : value;
	}

	return output;
}

function readcgroupnumber(paths) {
	var text = readfirst(paths);
	if (!text)
		return null;

	text = text.trim();

	if (!text || text === 'max')
		return null;

	var value = +text;
	return isNaN(value) ? null : value;
}

function readfirst(paths) {
	for (var i = 0; i < paths.length; i++) {
		try {
			if (Total.Fs.existsSync(paths[i]))
				return Total.Fs.readFileSync(paths[i], 'utf8');
		} catch (e) {}
	}

	return null;
}

function filecontains(filename, regexp) {
	try {
		if (!Total.Fs.existsSync(filename))
			return false;

		return regexp.test(Total.Fs.readFileSync(filename, 'utf8'));
	} catch (e) {
		return false;
	}
}

function emptySnapshot() {
	return {
		pid: process.pid,
		date: new Date().toISOString(),
		stats: []
	};
}

function tonumber(bytes) {
	return +((bytes || 0) / 1024 / 1024).toFixed(2);
}

function togigabytes(bytes) {
	return +(bytes / 1024 / 1024 / 1024).toFixed(2);
}

function nanostoms(value) {
	return isFinite(value) ? +(value / 1000000).toFixed(2) : null;
}

function numberornull(value) {
	return typeof(value) === 'number' && isFinite(value) ? +value.toFixed(2) : null;
}

function deltavalue(previous, current) {
	if (previous == null || current == null)
		return null;
	return +(current - previous).toFixed(2);
}

function isfinitecgroup(value) {
	return value != null && value > 0 && value < Number.MAX_SAFE_INTEGER;
}

function fixednumber(value, decimals) {
	return +(+value || 0).toFixed(decimals);
}

function firstdefined(args) {
	for (var i = 0; i < args.length; i++) {
		if (args[i] !== undefined && args[i] !== null && args[i] !== '')
			return args[i];
	}
	return null;
}

function intvalue() {
	var value = firstdefined(arguments);
	value = +value;
	return isNaN(value) ? 0 : Math.max(0, Math.round(value));
}

function optionalint() {
	var value = firstdefined(arguments);
	if (value === null)
		return null;
	value = +value;
	return isNaN(value) ? null : Math.round(value);
}

function optionalnumber() {
	var value = firstdefined(arguments);
	if (value === null)
		return null;
	value = +value;
	return isNaN(value) || !isFinite(value) ? null : +value.toFixed(2);
}

function textvalue() {
	var value = firstdefined(arguments);
	return value == null ? '' : (value + '').substring(0, 500);
}
