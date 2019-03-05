import {
  Map
} from 'immutable';

export default class LottieSchema {
  constructor() {
    this.LottieJson = Map({
      v: '5.4.4',
      fr: 25,
      ip: 0,
      op: 750,
      w: 1024,
      h: 350,
      nm: '空',
      ddd: 0,
      assets: [],
      layers: [],
      markers: [],
    });
  }

  /**
   * getJson
   */
  getJson() {
    return JSON.stringify(this.LottieJson);
  }
  /**
   * getWidth
   */
  getVersion() {
    return this.LottieJson.get('v');
  }
  /**
   * getWidth
   */
  getWidth() {
    return this.LottieJson.get('w');
  }
  /**
   * setWidth
   */
  setWidth(width) {
    this.LottieJson = this.LottieJson.set('w', width);
  }
  /**
   * getHeight
   */
  getHeight() {
    return this.LottieJson.get('h');
  }
  /**
   * setHeight
   */
  setHeight(height) {
    this.LottieJson = this.LottieJson.set('h', height);
  }
}