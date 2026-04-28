// Total.js bridge module for the TotalMonitor native app.
// Default route prefix: /$desktop/{what}

const desktop_token = CONF.desktop_token || '';
const desktop_url = normalizeDesktopURL(CONF.desktop_url || '/$desktop/');
const desktop_bridge_version = '1.2.0';

exports.install = function() {
	ROUTE('GET ' + desktop_url + 'monitor_init', monitor_init);
	ROUTE('GET ' + desktop_url + 'monitor', monitor_endpoint);
	ROUTE('GET ' + desktop_url + 'monitor_live', monitor_live_endpoint);
};

var previouscpusnapshot = null;
var Total = Total || F;
if (!F.is5)	$ = this;

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
	var filename = process.mainModule.filename + '.json';

	Total.Fs.readFile(filename, 'utf8', function(err, response) {
		var snapshot = parsesnapshot(response);
		var payload = buildmonitorpayload(snapshot, err, Date.now() - started, filename);
		$.json(payload);
	});
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
		bridge: desktop_bridge_version,
		pid: snapshot.pid || process.pid,
		date: snapshot.date || new Date().toISOString(),
		stats: stats,
		current: latest,
		liveMetrics: getlivemetrics(),
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
		bridge: desktop_bridge_version,
		pid: process.pid,
		date: new Date().toISOString(),
		stats: [],
		current: null,
		liveMetrics: getlivemetrics(),
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

	return {
		node: {
			version: process.version,
			pid: process.pid,
			uptimeSeconds: process.uptime(),
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

function isfinitecgroup(value) {
	return value != null && value > 0 && value < Number.MAX_SAFE_INTEGER;
}

function fixednumber(value, decimals) {
	return +(+value || 0).toFixed(decimals);
}
