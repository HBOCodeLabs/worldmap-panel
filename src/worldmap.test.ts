import WorldMap from './worldmap';
import DataBuilder from '../test/data_builder';
import * as _ from 'lodash';

describe('Worldmap', () => {
  let worldMap;
  let ctrl;

  beforeEach(() => {
    setupWorldmapFixture();
  });

  describe('when a Worldmap is created', () => {
    it('should add Leaflet to the map div', () => {
      expect(document.getElementsByClassName('leaflet-container')[0]).not.toBe(null);
    });
  });

  describe('when the data has one point', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .build();
      ctrl.panel.circleMaxSize = '10';
      worldMap.drawCircles();
    });

    it('should draw one circle on the map', () => {
      expect(worldMap.circles.length).toBe(1);
      expect(worldMap.circles[0]._latlng.lat).toBe(60);
      expect(worldMap.circles[0]._latlng.lng).toBe(18);
    });

    it('should create a circle with max circle size', () => {
      expect(worldMap.circles[0].options.radius).toBe(10);
    });

    it('should create a circle popup with the data point value', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1');
    });
  });

  describe('when the data has two points', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .build();
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';
      worldMap.drawCircles();
    });

    it('should draw two circles on the map', () => {
      expect(worldMap.circles.length).toBe(2);
    });

    it('should create a circle with min circle size for smallest value size', () => {
      expect(worldMap.circles[0].options.radius).toBe(2);
    });

    it('should create a circle with max circle size for largest value size', () => {
      expect(worldMap.circles[1].options.radius).toBe(10);
    });

    it('should create two circle popups with the data point values', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1');
      expect(worldMap.circles[1]._popup._content).toBe('Ireland: 2');
    });
  });

  describe('when units option is set', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .build();
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';
      ctrl.panel.unitSingular = 'error';
      ctrl.panel.unitPlural = 'errors';
      worldMap.drawCircles();
    });

    it('should create a circle popup using the singular unit in the label', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1 error');
    });

    it('should create a circle popup using the plural unit in the label', () => {
      expect(worldMap.circles[1]._popup._content).toBe('Ireland: 2 errors');
    });
  });

  describe('when the data has three points', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 3)
        .withThresholdValues([2])
        .build();
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';
      worldMap.drawCircles();
    });

    it('should draw three circles on the map', () => {
      expect(worldMap.circles.length).toBe(3);
    });

    it('should create a circle with min circle size for smallest value size', () => {
      expect(worldMap.circles[0].options.radius).toBe(2);
    });

    it('should create a circle with circle size 6 for mid value size', () => {
      expect(worldMap.circles[1].options.radius).toBe(6);
    });

    it('should create a circle with max circle size for largest value size', () => {
      expect(worldMap.circles[2].options.radius).toBe(10);
    });

    it('should set red color on values under threshold', () => {
      expect(worldMap.circles[0].options.color).toBe('red');
    });

    it('should set blue color on values equal to or over threshold', () => {
      expect(worldMap.circles[1].options.color).toBe('blue');
      expect(worldMap.circles[2].options.color).toBe('blue');
    });

    it('should create three circle popups with the data point values', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 1');
      expect(worldMap.circles[1]._popup._content).toBe('Ireland: 2');
      expect(worldMap.circles[2]._popup._content).toBe('United States: 3');
    });
  });

  describe('when the data has empty values and hideEmpty is true', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', null)
        .withThresholdValues([2])
        .build();
      ctrl.panel.hideEmpty = true;
      worldMap.drawCircles();
    });

    it('should draw three circles on the map', () => {
      expect(worldMap.circles.length).toBe(2);
    });
  });

  describe('when the data has empty values and hideEmpty is true', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 0)
        .withThresholdValues([2])
        .build();
      ctrl.panel.hideZero = true;
      worldMap.drawCircles();
    });

    it('should draw three circles on the map', () => {
      expect(worldMap.circles.length).toBe(2);
    });
  });

  describe('when the data is updated but not locations', () => {
    beforeEach(() => {
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 3)
        .withThresholdValues([2])
        .build();

      worldMap.drawCircles();

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 3)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 1)
        .withThresholdValues([2])
        .build();

      worldMap.drawCircles();
    });

    it('should create three circle popups with updated data', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 3');
      expect(worldMap.circles[1]._popup._content).toBe('Ireland: 2');
      expect(worldMap.circles[2]._popup._content).toBe('United States: 1');
    });

    it('should set red color on values under threshold', () => {
      expect(worldMap.circles[2].options.color).toBe('red');
    });

    it('should set blue color on values equal to or over threshold', () => {
      expect(worldMap.circles[0].options.color).toBe('blue');
      expect(worldMap.circles[1].options.color).toBe('blue');
    });
  });

  describe('when the number of locations changes', () => {
    beforeEach(() => {
      ctrl.panel.circleMinSize = '2';
      ctrl.panel.circleMaxSize = '10';

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1)
        .withCountryAndValue('IE', 2)
        .withCountryAndValue('US', 3)
        .withThresholdValues([2])
        .build();

      worldMap.drawCircles();

      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 2)
        .withThresholdValues([2])
        .build();

      worldMap.drawCircles();
    });

    it('should create one circle popups with updated data', () => {
      expect(worldMap.circles[0]._popup._content).toBe('Sweden: 2');
    });

    it('should set blue color on values equal to or over threshold', () => {
      expect(worldMap.circles[0].options.color).toBe('blue');
    });
  });

  describe('when one threshold is set', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2]).build();
      worldMap.createLegend();
    });

    it('should create a legend with two legend values', () => {
      expect(worldMap.legend).toBeDefined();
      expect(worldMap.legend._div.outerHTML).toBe(
        '<div class="info legend leaflet-control">' +
        '<div class="legend-item">' +
        '<i style="background:red"></i> &lt; 2</div><div class="legend-item"><i style="background:blue"></i> 2+</div>' +
        '</div>'
      );
    });
  });

  describe('when legend removed', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2]).build();
      worldMap.createLegend();
      worldMap.removeLegend();
    });

    it('should remove the legend from the worldmap', () => {
      expect(worldMap.legend).toBe(null);
    });
  });

  describe('when two thresholds are set', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2, 4]).build();
      worldMap.createLegend();
    });

    it('should create a legend with three legend values', () => {
      expect(worldMap.legend).toBeDefined();
      expect(worldMap.legend._div.outerHTML).toBe(
        '<div class="info legend leaflet-control"><div class="legend-item">' +
        '<i style="background:red"></i> &lt; 2</div><div class="legend-item"><i style="background:blue"></i> 2–4</div>' +
        '<div class="legend-item"><i style="background:green"></i> 4+</div></div>'
      );
    });
  });

  describe('when three thresholds are set', () => {
    beforeEach(() => {
      ctrl.data = new DataBuilder().withThresholdValues([2, 4, 6]).build();
      worldMap.createLegend();
    });

    it('should create a legend with four legend values', () => {
      expect(worldMap.legend).toBeDefined();
      expect(worldMap.legend._div.outerHTML).toBe(
        '<div class="info legend leaflet-control"><div class="legend-item">' +
        '<i style="background:red"></i> &lt; 2</div><div class="legend-item"><i style="background:blue"></i> 2–4</div>' +
        '<div class="legend-item"><i style="background:green"></i> 4–6</div>' +
        '<div class="legend-item"><i style="background:undefined"></i> 6+</div></div>'
      );
    });
  });

  describe('when a second metric is set to the color', () => {
    const lowVal = 7;
    const avgVal = 50;
    const highVal = 99;
    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1, highVal)
        .withCountryAndValue('IE', 2, avgVal)
        .withCountryAndValue('US', 1, lowVal)
        .withThresholdValues([33,66])
        .build();
      worldMap.drawCircles();
    });

    it('should create circle popups with the second metrics there', () => {
      expect(worldMap.circles[0]._popup._content).toBe(`Sweden: 1<br>${highVal}`);
      expect(worldMap.circles[1]._popup._content).toBe(`Ireland: 2<br>${avgVal}`);
      expect(worldMap.circles[2]._popup._content).toBe(`United States: 1<br>${lowVal}`);
    });

    it('should set the right colors using the second metric', () => {
      expect(worldMap.circles[0].options.color).toBe('green');
      expect(worldMap.circles[1].options.color).toBe('blue');
      expect(worldMap.circles[2].options.color).toBe('red');
    });
  });

  describe('when a second metric is set to the color with labels', () => {
    const lowVal = 7;
    const avgVal = 50;
    const highVal = 99;
    const label = 'Metric';
    const unit = '%';

    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', 1, highVal)
        .withCountryAndValue('IE', 2, avgVal)
        .withCountryAndValue('US', 1, lowVal)
        .build();
        ctrl.panel.colorLabel = label;
        ctrl.panel.colorUnit = unit;
      worldMap.drawCircles();
    });

    it('should create circle popups with the second metrics there', () => {
      expect(worldMap.circles[0]._popup._content).toBe(`Sweden: 1<br>${label}: ${highVal}${unit}`);
      expect(worldMap.circles[1]._popup._content).toBe(`Ireland: 2<br>${label}: ${avgVal}${unit}`);
      expect(worldMap.circles[2]._popup._content).toBe(`United States: 1<br>${label}: ${lowVal}${unit}`);
    });
  });

  afterEach(() => {
    const fixture: HTMLElement = document.getElementById('fixture')!;
    document.body.removeChild(fixture);
  });

  function setupWorldmapFixture() {
    const fixture = '<div id="fixture" class="mapcontainer"></div>';
    document.body.insertAdjacentHTML('afterbegin', fixture);

    ctrl = {
      panel: {
        mapCenterLatitude: 0,
        mapCenterLongitude: 0,
        initialZoom: 1,
        colors: ['red', 'blue', 'green'],
        replaceVariables: (interpolation: string) => {}
      },
      tileServer: 'CartoDB Positron',
    };
    worldMap = new WorldMap(ctrl, document.getElementsByClassName('mapcontainer')[0]);
    worldMap.createMap();
  }

  describe('when apply log is set', () => {
    const LOW = 1;
    const HIGH = 300000;
    const MID = 100;

    const minCircleSize = 1;
    const maxCircleSize = 11;
    const midCircleSize = 4.651553264913736;
    

    beforeEach(() => {
      ctrl.data = new DataBuilder()
        .withCountryAndValue('SE', LOW)
        .withCountryAndValue('IE', MID)
        .withCountryAndValue('US', HIGH)
        .withThresholdValues([2])
        .build();
      ctrl.panel.circleMinSize = minCircleSize;
      ctrl.panel.circleMaxSize = maxCircleSize;
      ctrl.panel.isLogScale = true;
      worldMap.drawCircles();
    });

    it('should draw three circles on the map', () => {
      expect(worldMap.circles.length).toBe(3);
    });

    it('should create a circle with min circle size for smallest value size', () => {
      expect(worldMap.circles[0].options.radius).toBe(minCircleSize);
    });

    // log is used to highlight the smaller parts when there's a big deviant
    it('should create a circle with intermediary circle size for mid value size', () => {
      expect(worldMap.circles[1].options.radius).toBe(midCircleSize);
    });

    it('should create a circle with max circle size for largest value size', () => {
      expect(worldMap.circles[2].options.radius).toBe(maxCircleSize);
    });

    it('should create circle popups with the second metrics there', () => {
      expect(worldMap.circles[0]._popup._content).toBe(`Sweden: ${LOW}`);
      expect(worldMap.circles[1]._popup._content).toBe(`Ireland: ${MID}`);
      expect(worldMap.circles[2]._popup._content).toBe(`United States: ${HIGH}`);
    });
  });

  describe('when variables have M or K', () => {
    beforeEach(() => {
      setupWorldmapFixture();
    })

    const getValidData = (): Array < [string, {
      providedInput: string,
      expectedOutput: string
    }] > => {
        return [
            ['no shortcuts', {
                providedInput: '1000',
                expectedOutput: '1000'
            }],
            ['only text', {
                providedInput: 'Something',
                expectedOutput: 'Something'
            }],
            ['one K shortcut', {
                providedInput: '1k',
                expectedOutput: '1000'
            }],
            ['one m shortcut', {
                providedInput: '1m',
                expectedOutput: '1000000'
            }],
            ['uppercase shortcuts', {
                providedInput: '1K',
                expectedOutput: '1000'
            }],
            ['mixed shortcuts', {
                providedInput: '1Km',
                expectedOutput: '1000000000'
            }],
        ]
    }

    test.each(getValidData())(
      'Should parse variables when it have %s', (record: { providedInput: string, expectedOutput: string }) : void => {
        // Act
        const actual = worldMap.replaceThousandsAndMillions(record.providedInput);

        // Assert
        expect(actual).toEqual(record.providedInput);
      }
    )
  });
});
