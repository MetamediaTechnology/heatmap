# heatmap-longo-map

This is a plugin of heatmap.js for adding heatmap layer on longdo map. For more information on heatmap.js, see:[heatmap.js](https://github.com/pa7/heatmap.js/blob/master/README.md)

## where the plugins is located

[plugins/longdomap-heatmap/longdomap-heatmap.js](https://github.com/MetamediaTechnology/heatmap-longdo-map/tree/master/plugins/longdomap-heatmap)

## how to use

### 1. Load longdo API & heatmap.js before the plugin is loaded.

```html
<script src="https://api.longdo.com/map/?key=[Your own key]]"></script>
<script src="heatmap.js"></script>
<script src="longdomap-heatmap.js"></script>
```

### 2. Prepare data points.

```javascript
var testData = {max: 10,data:[
	  	{lat:60.087195,lon:84.767761,value:8},
	  	{lat:41.804724,lon:-104.021301,value:4},]};
```

### 3. Prepare configuration.

```javascript
var cfg = {
	  	'radius': 25,
	  	"maxOpacity": .5,
	  	"scaleRadius": true,
	  	"useLocalExtrema": true
	  };
```

### 4. Instantiate HeatmapOverlay with config below & set data.

```javascript
heatmapLayer = new HeatmapOverlay(cfg);
heatmapLayer.setData(testData);
```

### 5. Add to longdo map.

```javascript
map.Layers.add(heatmapLayer);
```

## Demos

see what is in [example/longdomap-heatmap folder](https://github.com/MetamediaTechnology/heatmap-longdo-map/tree/master/examples/longdomap-heatmap)

## data points syntax

Data points have to be defined in JSON format such as:

```javascript
var testData = {max: 10,data:[
	  	{lat:60.087195,lon:84.767761,value:8,radius:20},
	  	{lat:41.804724,lon:-104.021301,value:4},]};
```

'radius' field is optional. The default radius is 2. If scaleRadius in config is true, it will be manipulated. 

## configuration

configurable values are as the same as ones of original heatmap.js. However, you cannot use container option.

* backgroundColor
* gradient
* maxOpacity
* minOpacity
* blur
* radius
* scaleRadius
* useLocalExtrema
* ...

For more information, see: [heatmap.js](https://www.patrick-wied.at/static/heatmapjs/)