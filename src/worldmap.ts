import { DataPoint } from 'dataPoint';
import * as _ from 'lodash';
import * as L from './libs/leaflet';
import WorldmapCtrl from './worldmap_ctrl';

const tileServers = {
  'CartoDB Positron': {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
  },
  'CartoDB Dark': {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
  },
};

export default class WorldMap {
  ctrl: WorldmapCtrl;
  mapContainer: any;
  circles: any[];
  map: any;
  legend: any;
  circlesLayer: any;
  highestValue: number = 0;
  lowestValue: number = Number.MAX_VALUE;
  valueRange: number;

  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.circles = [];
  }

  createMap() {
    const mapCenter = (<any>window).L.latLng(
      parseFloat(this.ctrl.panel.mapCenterLatitude),
      parseFloat(this.ctrl.panel.mapCenterLongitude)
    );
    this.map = L.map(this.mapContainer, {
      worldCopyJump: true,
      preferCanvas: true,
      center: mapCenter,
      zoom: parseInt(this.ctrl.panel.initialZoom, 10) || 1,
    });
    this.setMouseWheelZoom();

    const selectedTileServer = tileServers[this.ctrl.tileServer];
    (<any>window).L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution,
    }).addTo(this.map);
  }

  createLegend() {
    this.legend = (<any>window).L.control({ position: 'bottomleft' });
    this.legend.onAdd = () => {
      this.legend._div = (<any>window).L.DomUtil.create('div', 'info legend');
      this.legend.update();
      return this.legend._div;
    };

    this.legend.update = () => {
      const thresholds = this.ctrl.data.thresholds;
      let legendHtml = '';
      legendHtml +=
        '<div class="legend-item"><i style="background:' +
        this.ctrl.panel.colors[0] +
        '"></i> ' +
        '&lt; ' +
        thresholds[0] +
        '</div>';
      for (let index = 0; index < thresholds.length; index += 1) {
        legendHtml +=
          '<div class="legend-item"><i style="background:' +
          this.ctrl.panel.colors[index + 1] +
          '"></i> ' +
          thresholds[index] +
          (thresholds[index + 1] ? '&ndash;' + thresholds[index + 1] + '</div>' : '+');
      }
      this.legend._div.innerHTML = legendHtml;
    };
    this.legend.addTo(this.map);
  }

  needToRedrawCircles(data) {
    if (this.circles.length === 0 && data.length > 0) {
      return true;
    }

    if (this.circles.length !== data.length) {
      return true;
    }

    const locations = _.map(_.map(this.circles, 'options'), 'location').sort();
    const dataPoints = _.map(data, 'key').sort();
    return !_.isEqual(locations, dataPoints);
  }

  // Determines if the log scale is applied and chooses which value to use
  // Used when calculating circle sizes
  getValue(value: number): number {
    if (this.ctrl.panel.isLogScale) {
      value = Math.log(value);
    }
    return value
  }

  setSizes(data: DataPoint[]) {
    const sizes = data.map(dataPoint => this.getValue(dataPoint.value));
    this.lowestValue = Math.min(...sizes);
    this.highestValue = Math.max(...sizes);
    this.valueRange = this.highestValue - this.lowestValue;
  }

  filterEmptyAndZeroValues(data) {
    const minValue = this.ctrl.panel.minValue || parseInt(this.ctrl.panel.replaceVariables('$minDisplayValue'));
    const maxValue = this.ctrl.panel.maxValue || parseInt(this.ctrl.panel.replaceVariables('$maxDisplayValue'));
    return _.filter(data, o => {
      return !(this.ctrl.panel.hideEmpty && _.isNil(o.value)) 
          && !(this.ctrl.panel.hideZero && o.value === 0)
          && ([undefined, NaN, 0, ''].includes(minValue) || o.value >= minValue)
          && ([undefined, NaN, ''].includes(maxValue) || o.value <= maxValue)
    });
  }

  clearCircles() {
    if (this.circlesLayer) {
      this.circlesLayer.clearLayers();
      this.removeCircles();
      this.circles = [];
    }
  }

  drawCircles() {
    const data = this.filterEmptyAndZeroValues(this.ctrl.data);
    if (this.needToRedrawCircles(data)) {
      this.clearCircles();
      this.createCircles(data);
    } else {
      this.updateCircles(data);
    }
  }

  createCircles(data) {
    const circles: any[] = [];
    this.setSizes(data);
    data.forEach(dataPoint => {
      if (!dataPoint.locationName) {
        return;
      }
      circles.push(this.createCircle(dataPoint));
    });
    this.circlesLayer = this.addCircles(circles);
    this.circles = circles;
  }

  updateCircles(data) {
    this.setSizes(data);
    data.forEach(dataPoint => {
      if (!dataPoint.locationName) {
        return;
      }

      const circle = _.find(this.circles, cir => {
        return cir.options.location === dataPoint.key;
      });

      if (circle) {
        const colorValue = dataPoint.colorValue !== undefined ? dataPoint.colorValue : dataPoint.value;
        const color = this.getColor(colorValue);
        circle.setRadius(this.calcCircleSize(this.getValue(dataPoint.value) || 0));
        circle.setStyle({
          color,
          fillColor: color,
          fillOpacity: 0.5,
          location: dataPoint.key,
        });
        circle.unbindPopup();
        this.createPopup(circle, dataPoint.locationName, dataPoint.valueRounded, dataPoint.colorValue);
      }
    });
  }

  createCircle(dataPoint) {
    const colorValue = dataPoint.colorValue !== undefined ? dataPoint.colorValue : dataPoint.value;
    const color = this.getColor(colorValue);
    const circle = (<any>window).L.circleMarker([dataPoint.locationLatitude, dataPoint.locationLongitude], {
      radius: this.calcCircleSize(this.getValue(dataPoint.value) || 0),
      color,
      fillColor: color,
      fillOpacity: 0.5,
      location: dataPoint.key,
    });

    this.createPopup(circle, dataPoint.locationName, dataPoint.valueRounded, dataPoint.colorValue);
    return circle;
  }

  calcCircleSize(dataPointValue) {
    const circleMinSize = parseInt(this.ctrl.panel.circleMinSize, 10) || 2;
    const circleMaxSize = parseInt(this.ctrl.panel.circleMaxSize, 10) || 30;

    if (this.valueRange === 0) {
      return circleMaxSize;
    }

    const dataFactor = (dataPointValue - this.lowestValue) / this.valueRange;
    const circleSizeRange = circleMaxSize - circleMinSize;

    return circleSizeRange * dataFactor + circleMinSize;
  }

  createPopup(circle, locationName, value, colorValue) {
    const unit = value && value === 1 ? this.ctrl.panel.unitSingular : this.ctrl.panel.unitPlural;
    const firstLine = `${this.ctrl.panel.hideLocationName ? "" : locationName + ": "}`+`${value} ${(unit || '')}`.trim();
    const secondLine = colorValue !== undefined ? `${(this.ctrl.panel.colorLabel !== undefined ? this.ctrl.panel.colorLabel + ': ':'') + (colorValue || '0')  + (this.ctrl.panel.colorUnit || '')}`.trim(): '';
    const label = `${firstLine}${secondLine !== '' ? '<br>' + secondLine : ''}`;
    circle.bindPopup(label, {
      offset: (<any>window).L.point(0, -2),
      className: 'worldmap-popup',
      closeButton: this.ctrl.panel.stickyLabels,
    });

    circle.on('mouseover', function onMouseOver(evt) {
      const layer = evt.target;
      layer.bringToFront();
      this.openPopup();
    });

    if (!this.ctrl.panel.stickyLabels) {
      circle.on('mouseout', function onMouseOut() {
        circle.closePopup();
      });
    }
  }

  getColor(value) {
    for (let index = this.ctrl.data.thresholds.length; index > 0; index -= 1) {
      if (value >= this.ctrl.data.thresholds[index - 1]) {
        return this.ctrl.panel.colors[index];
      }
    }
    return _.first(this.ctrl.panel.colors);
  }

  resize() {
    this.map.invalidateSize();
  }

  panToMapCenter() {
    this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]);
    this.ctrl.mapCenterMoved = false;
  }

  removeLegend() {
    this.legend.remove(this.map);
    this.legend = null;
  }

  setMouseWheelZoom() {
    if (!this.ctrl.panel.mouseWheelZoom) {
      this.map.scrollWheelZoom.disable();
    } else {
      this.map.scrollWheelZoom.enable();
    }
  }

  addCircles(circles) {
    return (<any>window).L.layerGroup(circles).addTo(this.map);
  }

  removeCircles() {
    this.map.removeLayer(this.circlesLayer);
  }

  setZoom(zoomFactor) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

  remove() {
    this.circles = [];
    if (this.circlesLayer) {
      this.removeCircles();
    }
    if (this.legend) {
      this.removeLegend();
    }
    this.map.remove();
  }
}
