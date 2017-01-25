var path = require('path');

function readManifest(fs, search, callback) {
	if(search.length==0) {
		callback();
	} else {
		var dir = search.shift();
		var file = path.join(dir, 'manifest.json');
		fs.readFile(file, function(err, data) {
			if(err) {
				readManifest(fs, search, callback);
			} else {
				var obj;
				try {
					obj = JSON.parse(data.toString('utf-8'));
					console.log("OBJ = " + obj);
				} catch(e) {
					console.log('ERROR: unable to parse manifest.json at ' + file);
					obj = undefined;
				}
				callback(dir, obj);
			}
		})
	}
}

function addMetaAssets(fs, dir, appinfo, props, assets, callback) {
	if(props.length===0) {
		callback();
	} else {
		var prop = props.shift();
		if(appinfo[prop]) {
			var file = path.join(dir, appinfo[prop]);
			fs.readFile(file, function(err, data) {
				if(err) {
					console.log('Unable to read/emit appinfo asset: ' + file);
				} else {
					appinfo[prop] = appinfo[prop].replace(/\.\.(\/)?/g, "_$1");
					assets[appinfo[prop]] = {
						size: function() { return data.length; },
						source: function() { return data; },
						updateHash: function(hash) { return hash.update(data); },
						map: function() { return null; }
					}
				}
				addMetaAssets(fs, dir, appinfo, props, assets, callback);
			});
		} else {
			addMetaAssets(fs, dir, appinfo, props, assets, callback);
		}
	}
}

function ManifestPlugin(options) {
	this.options = options || {};
}

module.exports = ManifestPlugin;
ManifestPlugin.prototype.apply = function(compiler) {
	var scanDirs = ['.'];
	if(this.options.path) {
		scanDirs.unshift(this.options.path)
	}

	compiler.plugin('emit', function(compilation, callback) {
		var fs = compilation.inputFileSystem;

		readManifest(fs, scanDirs.slice(0), function(dir, appinfo) {
			if(!appinfo) {
				callback();
			} else {
				console.log("Test___1");
			}
		});
	});
	compiler.plugin('compilation', function(compilation) {
		compilation.plugin('html-webpack-plugin-before-html-generation', function(params, callback) {
			var fs = compilation.inputFileSystem;
			readManifest(fs, scanDirs.slice(0), function(dir, appinfo) {
				if(appinfo) {
					console.log("XXX = " + appinfo);
				}
				callback();
			});
		});
	});
};
