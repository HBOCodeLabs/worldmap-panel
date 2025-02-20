export default class DataBuilder {
  data: any;

  constructor() {
    this.data = [];
    this.data.thresholds = [];
  }

  withCountryAndValue(countryCode, value, colorValue?) {
    let dataPoint;
    if (countryCode === 'SE') {
      dataPoint = {
        key: 'SE',
        locationName: 'Sweden',
        locationLatitude: 60,
        locationLongitude: 18,
        value: value,
        valueRounded: value,
        colorValue
      };
    } else if (countryCode === 'IE') {
      dataPoint = {
        key: 'IE',
        locationName: 'Ireland',
        locationLatitude: 53,
        locationLongitude: 8,
        value: value,
        valueRounded: value,
        colorValue
      };
    } else if (countryCode === 'US') {
      dataPoint = {
        key: 'US',
        locationName: 'United States',
        locationLatitude: 37,
        locationLongitude: -95,
        value: value,
        valueRounded: value,
        colorValue
      };
    }
    this.data.push(dataPoint);

    return this;
  }

  withThresholdValues(values) {
    this.data.thresholds = values;

    return this;
  }

  build() {
    return this.data;
  }
}
