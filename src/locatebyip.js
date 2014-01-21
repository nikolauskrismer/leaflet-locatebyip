/*
 * Provides L.Map with convenient shortcuts for using ip based geolocation features.
 */
L.IpProvider = {};
L.IpProvider.None = null;
L.IpProvider.FreeGeoIp = {
	url: 'http://freegeoip.net/json/',
	cbParam: 'callback',
	buildLocationObject: function (data) {
		if (!data) {
			return null;
		}

		return {
			coords: {
				accuracy: 10000,
				latitude: data.latitude,
				longitude: data.longitude
			},
			timestamp: new Date().getTime()
		};
	}
};
L.IpProvider.GeoPlugin = {
	url: 'http://www.geoplugin.net/json.gp',
	cbParam: 'jsoncallback',
	buildLocationObject: function (data) {
		if (!data) {
			return null;
		}

		return {
			coords: {
				accuracy: 10000,
				/* jshint ignore:start */
				latitude: data.geoplugin_latitude,
				longitude: data.geoplugin_longitude
				/* jshint ignore:end */
			},
			timestamp: new Date().getTime()
		};
	}
};
L.IpProvider.Wikimedia = {
	url: 'http://geoiplookup.wikimedia.org/',
	cbParam: '',
	buildLocationObject: function () {
		var data = window.Geo,
			result = {
				coords: {
					accuracy: 10000,
					latitude: data.lat,
					longitude: data.lon
				},
				timestamp: new Date().getTime()
			};

		delete window.Geo;
		return result;
	}
};

L.IpLocator = L.Class.extend({

	locateByIp: function (source, responseCallback, errorCallback) {
		var handlerFn = L.bind(function (data) {
			this._handleIpResponse(source, data, responseCallback, errorCallback);
		}, this);

		if (source.cbParam === undefined || source.cbParam === null || source.cbParam === '') {
			this._loadScript(source.url, handlerFn);
			return;
		}

		window.cbObject = {};
		window.cbObject.fn = handlerFn;
		this._loadScript(source.url + '?' + source.cbParam + '= window.cbObject.fn');
	},

	_handleIpResponse: function (source, data, responseCallback, errorCallback) {
		window.cbObject = null;
		delete window.cbObject;

		var pos = source.buildLocationObject(data);
		if (pos === null) {
			if (errorCallback) { errorCallback('Could not get location.'); }
		} else if (responseCallback) {
			responseCallback(pos);
		}
	},

	_loadScript: function (url, callback, type) {
		var script = document.createElement('script');
		script.type = (type === undefined) ? 'text/javascript' : type;

		if (typeof callback === 'function') {
			if (script.readyState) {
				script.onreadystatechange = function () {
					if (script.readyState === 'loaded' || script.readyState === 'complete') {
						script.onreadystatechange = null;
						callback();
					}
				};
			} else {
				script.onload = function () { callback(); };
			}
		}

		script.src = url;
		document.getElementsByTagName('head')[0].appendChild(script);
	}
});

L.Map.include({
	_defaultLocateOptions: {
		ipProvider: L.IpProvider.Wikimedia,
		timeout: 10000,
		watch: false
		// setView: false
		// maxZoom: <Number>
		// maximumAge: 0
		// enableHighAccuracy: false
	},

	locate: function (/*Object*/ options) {
		options = this._locateOptions = L.extend(this._defaultLocateOptions, options);

		if (!navigator.geolocation && !options.ipProvider) {
			this._handleGeolocationError({
				code: 0,
				message: 'Geolocation not supported.'
			});
			return this;
		}

		var onResponse = L.bind(this._handleGeolocationResponse, this),
			onError = L.bind((options.ipProvider) ? this._fallbackToIp : this._handleGeolocationError, this);

		if (options.watch) {
			this._locationWatchId =
					navigator.geolocation.watchPosition(onResponse, onError, options);
		} else {
			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		}

		return this;
	},

	_fallbackToIp: function (errMsg) {
		if (!this._locateOptions.ipProvider) {
			this._handleGeolocationError(errMsg);
			return;
		}

		var onResponse = L.bind(this._handleGeolocationResponse, this),
			onError = L.bind(this._handleGeolocationError, this);

		(new L.IpLocator()).locateByIp(this._locateOptions.ipProvider, onResponse, onError);
	}

});
