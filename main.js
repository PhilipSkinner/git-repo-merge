#!/usr/bin/env node

const
	argParser 		= require("./lib/argParser")(),
	path			= require("path"),
	childProcess 	= require("child_process");

const args = argParser.fetch();

const merge = (include, target) => {
	const absInclude = path.join(process.cwd(), include);
	const absTarget = path.join(process.cwd(), target);

	return execCommand('git', ['log', '--no-decorate', '--oneline'], absInclude).then((log) => {
		const messages = log.split('\n');
		const hashes = [];

		for (var i = 0; i < messages.length; i++) {
			const parts = messages[i].split(' ');
			if (parts[0] !== '') {
				hashes.push({
					hash : parts[0],
					message : parts.slice(1).join(' ')
				});
			}
		}

		const doNext = () => {
			if (hashes.length === 0) {
				return Promise.resolve();
			}

			const nextHash = hashes.pop();
			console.log("Applying", nextHash);
			return applyCommit(nextHash.hash, nextHash.message, absInclude, target).then(doNext);
		};

		return doNext();
	});
};

const execCommand = (command, args, cwd, stdin) => {
	return new Promise((resolve, reject) => {
		const proc = childProcess.spawn(command, args, {
			cwd : cwd
		});

		if (stdin) {
			proc.stdin.end(stdin);
		}

		var ret = '';
		proc.stdout.on('data', (data) => {
			ret += data.toString();
		});

		proc.stderr.on('data', (data) => {
			console.error(data.toString());
		});

		proc.on('close', (code) => {
			if (code !== 0) {
				console.log(command, args, cwd);
				console.log(ret);
				return reject(new Error("None zero error code returned"));
			}

			return resolve(ret);
		});
	});
};

const applyCommit = (hash, message, source, target) => {
	let normalizedPath = path.normalize(target);

	if (normalizedPath === '.') {
		normalizedPath = '';
	}

	return execCommand('git', [
		`--git-dir=${source}/.git`,
		'format-patch',
		'-k',
		'-1',
		'--stdout',
		hash
	]).then((patch) => {
		return execCommand('git', [
			'apply',
			'-3',
			'--apply',
			'--directory',
			normalizedPath
		], process.cwd(), patch);
	}).then(() => {
		return execCommand('git', [
			'commit',
			'--allow-empty',
			'-a',
			'-m',
			message
		]);
	});
}

if (args.merge) {
	//carry our merge command
	const include = args.include;
	const target = args.target;

	console.log(`Merging ${include} into ${target}...`);
	merge(
		include,
		target
	)
		.then(() => {
			console.log("Merge complete!");
		})
		.catch((err) => {
			console.error("Error!", err);
		});
}