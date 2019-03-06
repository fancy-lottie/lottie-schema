import {
  Map,
  List,
} from 'immutable';

// import LayerColor from './layers/color';
import layerImage from './layers/image';
import assetImage from './assets/image';

export default class LottieSchema {
  constructor(options) {
    const defaultConfig = {
      v: '5.4.4',
      fr: 25,
      ip: 0,
      op: 750,
      w: 1024,
      h: 350,
      nm: '空',
      ddd: 0,
    };
    this.lottieJson = Map({
      assets: List(),
      layers: List(),
      markers: List(),
      ...defaultConfig,
      ...options,
    });
  }

  getJson() {
    return JSON.stringify(this.lottieJson);
  }
  getObj() {
    return this.lottieJson.toJS();
  }

  getVersion() {
    return this.lottieJson.get('v');
  }

  getSize() {
    return {
      ip: this.lottieJson.get('ip'),
      op: this.lottieJson.get('op'),
      width: this.lottieJson.get('w'),
      height: this.lottieJson.get('h'),
    }
  }

  setSize({
    width,
    height
  }) {
    if (width) {
      this.lottieJson = this.lottieJson.set('w', width);
    }
    if (height) {
      this.lottieJson = this.lottieJson.set('h', height);
    }
  }
  /**
   * 两部分 assets 和 layers 通过 id 和 refId 关联起来, 讲 图片layer push 到 layers 最后
   * 图片锚点: ks.a [ 图片宽度/2, 图片高度/2, 0]
   * 图片缩放: ks.s [ 横向缩放, 纵向缩放, 100 ]
   * 图片位移: ks.p [x, y, 100] 位移移动的位置是 图片锚点 相对于 画布的 x,y
   * 要判断图片的大小和画布大小, 以 画布包含住 背景图片为目的, 实现 contain
   */
  addBgImage({
    url,
    width,
    height,
  }) {
    const imageIdx = this.checkBgImageExist()
    if (imageIdx) {
      this.lottieJson = this.lottieJson
        .set('assets', this.lottieJson.get('assets').delete(imageIdx.bgAssetIdx))
        .set('layers', this.lottieJson.get('layers').delete(imageIdx.bgLayerIdx))
    }
    const {
      width: canvasWidth,
      height: canvasHeight,
      ip,
      op,
    } = this.getSize();
    const layers = this.lottieJson.get('layers')
    const assets = this.lottieJson.get('assets')
    const imageAsset = assetImage.set('p', url)
      .set('w', width)
      .set('h', height)
      .set('id', 'bgImage')
    const wScale = width < canvasWidth ? 100 : (canvasWidth / width).toFixed(2)
    const hScale = height < canvasHeight ? 100 : (canvasHeight / height).toFixed(2)
    const imageLayer = layerImage.set('refId', 'bgImage')
      .set('ln', 'bgImage')
      .set('cl', 'handlehook')
      .set('nm', '背景图片')
      .set('ip', ip)
      .set('op', op)
      .setIn(['ks', 'a', 'k'], [width / 2, height / 2, 0])
      .setIn(['ks', 's', 'k'], [wScale, hScale, 0])
      .setIn(['ks', 'p', 'k'], [canvasWidth / 2, canvasHeight / 2, 0])
    this.lottieJson = this.lottieJson
      .set('assets', assets.push(imageAsset))
      .set('layers', layers.push(imageLayer))
  }

  checkBgImageExist() {
    const layers = this.lottieJson.get('layers')
    const assets = this.lottieJson.get('assets')
    const bgLayer = layers.last()
    if (!bgLayer || !assets.size) {
      return false;
    }
    const bgAssetIdx = assets.findIndex((value, index, array) => {
      return value.get('id') === 'bgImage';
    })
    const bgLayerIdx = layers.findIndex((value, index, array) => {
      return value.get('refId') === 'bgImage';
    });
    if (!Number.isInteger(bgAssetIdx) || !Number.isInteger(bgLayerIdx)) {
      return false;
    }
    return {
      bgAssetIdx,
      bgLayerIdx,
    }
  }
  /**
   * type: bgColor bgImage
   * data: color; url, base64, width, height
   */
  changeBgImage({
    size,
    position,
    url,
  }) {
    const {
      width,
      height,
    } = size || {};
    const {
      x,
      y,
    } = position || {};
    const imageIdx = this.checkBgImageExist()
    if (!imageIdx) {
      return;
    }
    const {
      bgAssetIdx,
      bgLayerIdx,
    } = imageIdx;
    let layers = this.lottieJson.get('layers').get(bgLayerIdx)
    let assets = this.lottieJson.get('assets').get(bgAssetIdx)
    const imgWidth = assets.get('w')
    const imgHeight = assets.get('h')
    // 图片缩放
    if ((width || height) && (width !== imgWidth || height !== imgHeight)) {
      const wScale = width ? width > imgWidth ? (imgWidth / width).toFixed(2) : (width / imgWidth).toFixed(2) : 100
      const hScale = height ? height > imgHeight ? (imgHeight / height).toFixed(2) : (height / imgHeight).toFixed(2) : 100
      layers = layers.setIn(['ks', 's', 'k'], [wScale, hScale, 0])
    }
    // 图片位移
    if (x || y) {
      const [_x, _y, _z] = layers.getIn(['ks', 'p', 'k'])
      layers = layers.setIn(['ks', 'p', 'k'], [!x ? _x : x, !y ? _y : y, 0])
    }
    // 图片资源替换的情况,在外围调用
    this.lottieJson = this.lottieJson.set('layers', layers)
  }
  /* addBgColor(color) {
    const {
      width,
      height,
      ip,
      op,
    } = this.getSize();
    const layers = this.lottieJson.get('layers')
    const colorLayer = LayerColor.set('sc', color)
      .set('nm', '背景颜色:' + color)
      .set('sw', width)
      .set('sh', height)
      .set('ip', ip)
      .set('op', op)
      .set('cl', 'handlehook')
      .set('ln', 'bgColor')
      .setIn(['ks', 'p', 'k'], [width / 2, height / 2, 0])
      .setIn(['ks', 'a', 'k'], [width / 2, height / 2, 0])
    this.lottieJson = this.lottieJson.set('layers', layers.push(colorLayer));
  }

  delBgLayer() {
    this.lottieJson = this.lottieJson.set('layers', this.lottieJson.get('layers').pop())
  } */

}