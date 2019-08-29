//
//
//
;(function (name, context, factory){
    if (typeof module !== 'undefined' && module.exports){
        module.exports = factory(require('heatmap.js'));
    }else if (typeof define === "function" && define.amd){
        define(['heatmap.js'], factory);
    }else {
        if (typeof window.h337 === 'undefined'){
            throw new Error('heatmap.js must be loaded before the longdomap heatmap plugin');
        }
        if(typeof longdo.Layer === 'undefined'){
            throw new Error('longdo API must be loaded before the longdomap heatmap plugin');
        }
        context[name] = factory(window.h337, window.longdo);
    }
})("HeatmapOverlay", this, function (h337){
    'use strict';

    var HeatmapOverlay = function(map, cfg){
        this.initialize(map, cfg);
        /*
        this.url = function (projection, tile, zoom){
            console.log(this._heatmap.getDataURL());
            return this._heatmap.getDataURL();
        };*/
    };
    
    HeatmapOverlay.prototype = new longdo.Layer('test', {
        type: longdo.LayerType.Custom  ,
        url: 'https://dummyimage.com/256x256/000/fff'
    });

    HeatmapOverlay.prototype.initialize = function(map, cfg){
        this.cfg = cfg;
        this._data = [];
        this._max = 1;
        this._min = 0;
        this.cfg.container = document.createElement('div');
        this._el = this.cfg.container;
        this._heatmap = h337.create(this.cfg);
        this._map = map;
        var width = map.placeholder().style.width;
        var height = map.placeholder().style.height;
        this._el.style.cssText = 'width:' + width + 'px;height:'+height+'px;';
    }


    

    HeatmapOverlay.prototype.ManualOnAdd = function (){
        this._width = map.placeholder().style.width;
        this._height = map.placeholder().style.height;
        this.cfg.container.style.width = map.placeholder().style.width + 'px';
        this.cfg.container.style.height = map.placeholder().style.height + 'px';
        this.cfg.container.stle.position = 'absolute';
        map.Events.add('drop', this._reset);
        map.Events.add('zoomRange', this._reset);
    };
    HeatmapOverlay.prototype._draw = function (){
        if(!this._map)return;
        //reposition the layer
        var rect = this._el.getBoundingClientRect();
        this._el.style[HeatmapOverlay.CSS_TRANSFORM] = 'translate(' +
        -Math.round(rect.left + window.scrollX) + 'px,' +
        -Math.round(rect.top + window.scrollY) + 'px)';
        /*
        this.cfg.container.style[HeatmapOverlay.CSS_TRANSFORM] =  'translate(' +
        -Math.round(point.x) + 'px,' +
        -Math.round(point.y) + 'px)';
        */
        this._update();
    };
    HeatmapOverlay.prototype._update = function (){
        var bounds = this._map.bound(), zoom = this._map.zoom(),scale;
        var generatedData = {max:this._max,
                            min: this._min, data:[]};
        scale = 2 << zoom;

        if(this._data.length == 0){
            if(this._heatmap)this._heatmap.setData(generatedData);
            return;
        }

        var points = [];
        var radiusMultiplier = this.cfg.scaleRadius ? scale : 1;
        var localMax = 0, localMin = 0;
        var len = this._data.length;
        while(len--){
            var entry = this._data[len];
            var lat = entry.lat, lon = entry.lon, value = entry.value,radius;
            
            //Inside check
            if(!(lat <= bounds.maxlat && lat >= bounds.minlat 
                && lon <= bounds.maxlon && lon >= bounds.minlon))continue;
            
            localMax = Math.max(value, localMax);
            localMin = Math.min(value, localMin);
            //possibly cause problem
            //cal screen pos
            var point = {y: Math.round(lat - bounds.minlat), x: Math.round(lon - bounds.minlon)};
            radius = entry.radius ? entry.radius * radiusMultiplier : (this.cfg.radius || 2) * radiusMultiplier;
            point.radius = radius;
            points.push(point);
        }
        if(this.cfg.useLocalExtrema){
            generatedData.max = localMax;
            generatedData.min = localMin;
        }
        generatedData.data = points;
        this._heatmap.setData(generatedData);
    };

    HeatmapOverlay.prototype._reset = function (){
        if(this._width !== map.placeholder().style.width || this._height !== map.placeholder().style.height)
        this._width = map.placeholder().style.width;
        this._height = map.placeholder().style.height;
        this._el.style.width = this._width+'px';
        this._el.style.height = this._height + 
        'px';
        this._heatmap._renderer.setDimensions(this._width, this._height);
        this._draw();
    };


    HeatmapOverlay.prototype.setData = function (data){
        this._max = data.max || this._max;
        this._min = data.min || this._min;

        var PointsData = data.data, len = PointsData.length, d = [];

        while (len--){
            var entry = data[len];
            d.push({lat: entry['lat'], lon: entry['lon'], valie: entry['value']});
        }
        this._data = d;
        this._draw();
    };

    HeatmapOverlay.CSS_TRANSFORM = (function() {
        var div = document.createElement('div');
        var props = [
          'transform',
          'WebkitTransform',
          'MozTransform',
          'OTransform',
          'msTransform'
        ];
    
        for (var i = 0; i < props.length; i++) {
          var prop = props[i];
          if (div.style[prop] !== undefined) {
            return prop;
          }
        }
        return props[0];
      })();

    return HeatmapOverlay;
});