import { Map, List } from 'immutable';

// import LayerColor from './layers/color';
import layerImage from './layers/image';
import assetImage from './assets/image';

export default class LottieSchema {
  private lottieJSON: any;
  constructor(options?: any) {
    const defaultConfig = {
      v: '5.4.4',
      fr: 25,
      ip: 0,
      op: 750,
      w: 1024,
      h: 350,
      nm: '初始化空层',
      ddd: 0,
    };
    this.lottieJSON = Map({
      assets: List(),
      layers: List(),
      markers: List(),
      ...defaultConfig,
      ...options,
    });
  }

  public getJSON() {
    return JSON.stringify(this.lottieJSON);
  }
  public getObj() {
    return this.lottieJSON.toJS();
  }

  public getVersion() {
    return this.lottieJSON.get('v');
  }

  public getSize() {
    return {
      ip: this.lottieJSON.get('ip'),
      op: this.lottieJSON.get('op'),
      width: this.lottieJSON.get('w'),
      height: this.lottieJSON.get('h'),
    };
  }

  public setSize({ width, height }: { width: string; height: string }) {
    if (width) {
      this.lottieJSON = this.lottieJSON.set('w', width);
    }
    if (height) {
      this.lottieJSON = this.lottieJSON.set('h', height);
    }
  }
  /**
   * delBgImage
   */
  public delBgImage() {
    const imageIdx = this.checkBgImageExist();
    if (imageIdx) {
      this.lottieJSON = this.lottieJSON
        .set('assets', this.lottieJSON.get('assets').delete(imageIdx.bgAssetIdx))
        .set('layers', this.lottieJSON.get('layers').delete(imageIdx.bgLayerIdx));
    }
  }
  /**
   * 两部分 assets 和 layers 通过 id 和 refId 关联起来, 讲 图片layer push 到 layers 最后
   * 图片锚点: ks.a [ 图片宽度/2, 图片高度/2, 0]
   * 图片缩放: ks.s [ 横向缩放, 纵向缩放, 100 ]
   * 图片位移: ks.p [x, y, 100] 位移移动的位置是 图片锚点 相对于 画布的 x,y
   * 要判断图片的大小和画布大小, 以 画布包含住 背景图片为目的, 实现 contain
   */
  public addBgImage({ url, width, height }: { url: string; width: number; height: number }) {
    this.delBgImage();
    // 获取画布属性
    const { width: canvasWidth, height: canvasHeight, ip, op } = this.getSize();
    const layers = this.lottieJSON.get('layers');
    const assets = this.lottieJSON.get('assets');
    // 设置背景图片宽高Url属性
    const imageAsset = assetImage
      .set('p', url)
      .set('w', width)
      .set('h', height)
      .set('id', 'bgImage');
    // 目标是 contain 包含适配, 以最小缩放为准
    const wScale = Number.parseFloat(((canvasWidth / width) * 100).toFixed(3))
    const hScale = Number.parseFloat(((canvasHeight / height) * 100).toFixed(3))
    const scale = wScale > hScale ? hScale : wScale;
    const imageLayer = layerImage
      .set('refId', 'bgImage')
      .set('ln', 'bgImage')
      .set('cl', 'handlehook')
      .set('nm', '背景图片')
      .set('ip', ip)
      .set('op', op)
      .setIn(['ks', 'a', 'k'], [width / 2, height / 2, 0])
      .setIn(['ks', 's', 'k'], [scale, scale, 0])
      .setIn(['ks', 'p', 'k'], [canvasWidth / 2, canvasHeight / 2, 0]);
    this.lottieJSON = this.lottieJSON
      .set('assets', assets.push(imageAsset))
      .set('layers', layers.push(imageLayer));
  }

  public checkBgImageExist() {
    const layers = this.lottieJSON.get('layers');
    const assets = this.lottieJSON.get('assets');
    const bgLayer = layers.last();
    if (!bgLayer || !assets.size) {
      return false;
    }
    const bgAssetIdx = assets.findIndex((value: any) => {
      return value.get('id') === 'bgImage';
    });
    const bgLayerIdx = layers.findIndex((value: any) => {
      return value.get('refId') === 'bgImage';
    });
    if (!Number.isInteger(bgAssetIdx) || !Number.isInteger(bgLayerIdx)) {
      return false;
    }
    return {
      bgAssetIdx,
      bgLayerIdx,
    };
  }

  public changeBgImage({ scale, position = {} }: { scale: number; position?: any }) {
    // const { width, height } = size;
    const { x, y } = position;
    const imageIdx = this.checkBgImageExist();
    if (!imageIdx) {
      return;
    }
    const { bgLayerIdx } = imageIdx;
    let layers = this.lottieJSON.get('layers').get(bgLayerIdx);
    // 图片缩放
    if (scale) {
      layers = layers.setIn(['ks', 's', 'k'], [scale, scale, 0]);
    }
    // 图片位移
    if (x || y) {
      const [xx, yy] = layers.getIn(['ks', 'p', 'k']);
      layers = layers.setIn(['ks', 'p', 'k'], [!x ? xx : x, !y ? yy : y, 0]);
    }
    // 图片资源替换的情况,在外围调用
    this.lottieJSON = this.lottieJSON.set(
      'layers',
      this.lottieJSON.get('layers').set(bgLayerIdx, layers)
    );
  }

  /* addBgColor(color) {
    const {
      width,
      height,
      ip,
      op,
    } = this.getSize();
    const layers = this.lottieJSON.get('layers')
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
    this.lottieJSON = this.lottieJSON.set('layers', layers.push(colorLayer));
  }

  delBgLayer() {
    this.lottieJSON = this.lottieJSON.set('layers', this.lottieJSON.get('layers').pop())
  } */
}
