# leaflet-locatebyip


Adds ip based location search to leaflet

## Usage

### Minimal set up:

* add the javascript files

Afterwards map.locate will fallback to an IP-address based location search.

### Possible options

The IP based location can be configured with an ipProvider option.

```javascript
L.Map('my-map-div', {
	ipProvider: L.IpProvider.Wikimedia // default option
});

```

```javascript
L.Map('my-map-div', {
	ipProvider: L.IpProvider.FreeGeoIp
});

```

```javascript
L.Map('my-map-div', {
	ipProvider: L.IpProvider.GeoPlugin
});

```

```javascript
L.Map('my-map-div', {
	ipProvider: L.IpProvider.None // turn off IP based location
});

```

### Static usage

For some scenarious it is useful to perform an IP based location search without a map object.
This can be done by calling the IpLocator object directly.

When you want to get the user's location by ip before drawing the map (so that one can set the center of the map to the user location), one could do the following:
```javascript
function locateAndDraw(mapOptions) {
    var fnSuccess = function(location) { onLocationSuccess(location); },
    	fnError = function(message) { onLocationError(message); },
    	locator = new L.IpLocator();

    locator.locateByIp(L.IpProvider.Wikimedia, fnSuccess, fnError);
}

function onLocationSuccess(location) {
    if (!location || !location.coords) {
    	// Invalid geoLocation... no coordinates returned!
    	return;
    }

    // GeoLocation found. It will be used as center

	var map = L.Map('my-map-div', {
		center: [location.coords.latitude, location.coords.longitude]
	});
}

function onLocationError(message) {
	// Could not get GeoLocation.. using default center (0, 0)
	var map = L.Map('my-map-div', {
		center: [0, 0]
	});
}

```
