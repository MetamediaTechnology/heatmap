;(function (name, context, factory){
    if (typeof module !== 'undefined' && module.exports){
        module.exports = factory(require('heatmap.js'));
    }else if (typeof define === "function" && define.amd){
        define(['heatmap.js'], factory);
    }else {
        if (typeof window.h337 === 'undefined'){
            throw new Error('heatmap.js must be loaded before the longdomap heatmap plugin');
        }
        if(typeof longdo === 'undefined'){
            throw new Error('longdo API must be loaded before the longdomap heatmap plugin');
        }
        context[name] = factory(window.h337, window.longdo);
    }
})("HeatmapOverlay", this, function (h337){
    'use strict';

    var HeatmapOverlay = function(map, cfg){
        this.initialize(map, cfg);
        var instance = this;
        map.Layers.add(new longdo.Layer('test',{
            type: longdo.LayerType.Custom,
            url: function(projection,map,zoom){
                return instance.getURL(projection, map, zoom);
            }
        }));    
    };
    
    HeatmapOverlay.prototype.initialize = function(map, cfg){
        this.cfg = cfg;
        this._data = [];
        this._max = 1;
        this._min = 0;
        this._map = map;
        this.tileNumSqrt = 2 << (map.zoom()-1);
        this.tileResSqrt = 64;
        this.cfg.container = document.createElement('div');
        this.cfg.container.style.cssText = 'width:' + this.tileResSqrt + 'px;height:' + this.tileResSqrt + 'px';
        this.cfg.width = this.cfg.height = this.tileResSqrt;
        this._heatmap = h337.create(this.cfg);
    };
    HeatmapOverlay.prototype.getURL = function (projection, tile, zoom){
        if(projection != longdo.Projections.EPSG3857)return '';
        this.tileNumSqrt = 2 << (zoom-1);
        var len = this._data.length;
        var generatedData = {data:[],max:this._max,min:this._min};
        var Alloutside = false;
        if(this._data.length == 0){
            if(this._heatmap)this._heatmap.setData(generatedData);
            return '';
        }
        var localMax = 0, localMin = 0;
        while(len--){
            var entry = this._data[len];
            var inctile = this._getTileIncludeLatlon(entry);
            var scale = 2 << (zoom - 1);
            var radiusMultiplier = this.cfg.scaleRadius ? scale : 1;
            var radius = entry.radius ? entry.radius * radiusMultiplier : (this.cfg.radius || 2) * radiusMultiplier;
            var distance = radius / this.tileResSqrt;
            if(Math.abs(inctile.u - tile.u) <= Math.ceil(1+distance) && Math.abs(inctile.v - tile.v) <= Math.ceil(1+distance)){
                var elon = 360 / this.tileNumSqrt;
                var offsetlon =  entry.lon +  180 - tile.u * elon;
                
                var elat = 180/(this.tileNumSqrt);
                var offsetlat = 90 - this._lat2y(entry.lat)/2- elat*tile.v;

                var x = Math.round(offsetlon*(this.tileResSqrt/elon));
                var y = Math.round(offsetlat*(this.tileResSqrt/elat));
                Alloutside = x < 0 || x > this.tileResSqrt || y < 0 || y > this.tileResSqrt;

                generatedData.data.push({x: x, y: y, value: entry.value, radius: radius});
            }
            localMax = Math.max(entry.value, localMax);
            localMin = Math.min(entry.value, localMin);   
        }
        if(this.cfg.useLocalExtrema){
            generatedData.max = localMax;
            generatedData.min = localMin;
        }
        //If all points are outside of the tile...
        if(Alloutside){
            generatedData.data.push({x:1,y:1,value: -Number.EPSILON,radius:0});
            //note: inserting dummy point to avoid rendering bug
        }
        // uncomment below if 'canvas height is 0' error occurs
        //this._heatmap._renderer.setDimensions(this.tileResSqrt, this.tileResSqrt);
        this._heatmap.setData(generatedData);
        return this._heatmap.getDataURL();
    };
    HeatmapOverlay.prototype.setData = function (data){
        this._max = data.max || this._max;
        this._min = data.min || this._min;
        this._data = [];
        var data = data.data, len = data.length;
        while (len--){
            var entry = data[len];
            this._data.push({lat: entry.lat, lon: entry.lon, value: entry.value});
        }
    };
    HeatmapOverlay.prototype._getTileIncludeLatlon = function (latlon){
        var tx = latlon.lon + 180;
        var ex = 360 / this.tileNumSqrt;
        var y = 180 - this._lat2y(latlon.lat);
        var ey = 360 / this.tileNumSqrt;
        return {u:Math.floor(tx/ex),v:Math.floor(y/ey)};
    };

    /*
    Adapted from https://wiki.openstreetmap.org/wiki/Mercator
    */
    HeatmapOverlay.prototype._y2lat = function (y) { return (Math.atan(Math.exp(y / (180 / Math.PI))) / (Math.PI / 4) - 1) * 90; };
    HeatmapOverlay.prototype._lat2y = function (lat) { return Math.log(Math.tan((lat / 90 + 1) * (Math.PI / 4) )) * (180 / Math.PI); };
 
    return HeatmapOverlay;
});