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
        longdo.Layer.call(this,'test',{
            type: longdo.LayerType.Custom,
            url: function(){return this.getURL();}});      
    };
    
    // HeatmapOverlay.prototype = new longdo.Layer('test', {
    //     type: longdo.LayerType.Custom,
    //     url: function(){}
    // });
    
    HeatmapOverlay.prototype.initialize = function(map, cfg){
        this.cfg = cfg;
        this._data = [];
        this._max = 1;
        this._min = 0;
        this._map = map;
        var width = map.placeholder().offsetWidth;
        var height = map.placeholder().offsetHeight;
        this.cfg.container = document.createElement('div');
        this._el = this.cfg.container;
        this._el.style.cssText = 'width:' + width + 'px;height:'+height+'px;';
        this._heatmap = h337.create(this.cfg);
        
        

        var instance = this;
        this._map.Event.bind('ready', function (){instance.ManualOnAdd();instance._draw();});
    };
    HeatmapOverlay.prototype.getURL = function (projection, tile, zoom){
        return '';
    };


    

    HeatmapOverlay.prototype.ManualOnAdd = function (){
        this._width = this._map.placeholder().offsetWidth;
        this._height = this._map.placeholder().offsetHeight;
        this._el.style.width = this._width + 'px';
        this._el.style.height = this._height + 'px';
        this._el.style.position = 'absolute';
        // this._map.Event.bind('drop', this._reset);
        // this._map.Event.bind('zoomRange', this._reset);
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
            
            localMax = Math.max(value, localMax);
            localMin = Math.min(value, localMin);
            //possibly cause problem
            //cal screen pos
            //TODO
            var calp = this._ConvertLatLonToScreenPos({lat:lat,lon:lon});
            var lenlen = calp.length;
            while(lenlen--){
                var point = {y: calp[lenlen].y, x: calp[lenlen].x, value: value};
                radius = entry.radius ? entry.radius * radiusMultiplier : (this.cfg.radius || 2) * radiusMultiplier;
                point.radius = radius;
                points.push(point);
            }
        }
        if(this.cfg.useLocalExtrema){
            generatedData.max = localMax;
            generatedData.min = localMin;
        }
        generatedData.data = points;
        this._heatmap._renderer.setDimensions(this._width, this._height);
        this._heatmap.setData(generatedData);
    };

    HeatmapOverlay.prototype._reset = function (){
        if(this._width !== map.placeholder().style.offsetWidth || this._height !== map.placeholder().style.height)
        this._width = map.placeholder().style.offsetWidth;
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
            var entry = PointsData[len];
            d.push({lat: entry.lat, lon: entry.lon, value: entry.value});
        }
        this._data = d;
        this._draw();
    };
    HeatmapOverlay.prototype._ConvertLatLonToScreenPos = function(latlon){
        var bounds = this._map.bound();
        var points = [];
        if(!latlon)latlon = this._map.location();
        var LT = [bounds.minLon, bounds.maxLat];
        var RB = [bounds.maxLon, bounds.minLat];
        var scalex = (RB[0] - LT[0]) / this._width;
        var scaley = (RB[1] - LT[1]) / this._height;
        while(latlon.lon+360 <= RB[0]){
            latlon.lon+=360;
        }
        while(latlon.lon >= LT[0]){
            points.push({x: Math.round((latlon.lon - LT[0]) / scalex)});
            latlon.lon-=360;
        }
        //TODO: calculated y-pos is little incorrect
        var len = points.length;
        while(len--){
            points[len].y = Math.round((latlon.lat - LT[1]) / scaley);
        }
        return points;
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