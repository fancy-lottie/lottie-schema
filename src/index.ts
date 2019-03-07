import { Map, List, fromJS } from 'immutable'

// import LayerColor from './layers/color';
import layerImage from './layers/image'
import layerPrecomp from './layers/precomp'
import assetImage from './assets/image'

export default class LottieSchema {
  private lottieJSON: any
  constructor(options?: any) {
    const defaultOptions = {
      v: '5.4.4',
      fr: 25,
      ip: 0,
      op: 750,
      w: 1024,
      h: 350,
      nm: '初始化空层',
      ddd: 0,
    }
    this.lottieJSON = Map({
      assets: List(),
      layers: List(),
      markers: List(),
      ...defaultOptions,
      ...options,
    })
  }

  public getJSON() {
    return JSON.stringify(this.lottieJSON)
  }

  public getObj() {
    return this.lottieJSON.toJS()
  }

  public getVersion() {
    return this.lottieJSON.get('v')
  }

  public getSize() {
    return {
      ip: this.lottieJSON.get('ip'),
      op: this.lottieJSON.get('op'),
      width: this.lottieJSON.get('w'),
      height: this.lottieJSON.get('h'),
    }
  }

  public setSize({ width, height }: { width: string; height: string }) {
    if (width) {
      this.lottieJSON = this.lottieJSON.set('w', width)
    }
    if (height) {
      this.lottieJSON = this.lottieJSON.set('h', height)
    }
  }
  /**
   * delBgImage
   */
  public delBgImage() {
    const imageIdx = this.checkBgImageExist()
    if (imageIdx) {
      this.lottieJSON = this.lottieJSON
        .set('assets', this.lottieJSON.get('assets').delete(imageIdx.assetIdx))
        .set('layers', this.lottieJSON.get('layers').delete(imageIdx.layerIdx))
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
    this.delBgImage()
    // 获取画布属性
    const { width: canvasWidth, height: canvasHeight, ip, op } = this.getSize()
    const layers = this.lottieJSON.get('layers')
    const assets = this.lottieJSON.get('assets')
    // 设置背景图片宽高Url属性
    const imageAsset = assetImage
      .set('p', url)
      .set('w', width)
      .set('h', height)
      .set('id', 'bgImage')
    // 目标是 cover 包含适配, 以最大缩放为准
    const wScale = Number.parseFloat(((canvasWidth / width) * 100).toFixed(3))
    const hScale = Number.parseFloat(((canvasHeight / height) * 100).toFixed(3))
    const scale = wScale < hScale ? hScale : wScale
    const imageLayer = layerImage
      .set('refId', 'bgImage')
      .set('ind', layers.count() + 1)
      .set('ln', 'bgImage')
      .set('cl', 'handlehook')
      .set('nm', '背景图片')
      .set('ip', ip)
      .set('op', op)
      .setIn(['ks', 'a', 'k'], [width / 2, height / 2, 0])
      .setIn(['ks', 's', 'k'], [scale, scale, 0])
      .setIn(['ks', 'p', 'k'], [canvasWidth / 2, canvasHeight / 2, 0])
    this.lottieJSON = this.lottieJSON
      .set('assets', assets.push(imageAsset))
      .set('layers', layers.push(imageLayer))
  }

  public checkBgImageExist() {
    const layers = this.lottieJSON.get('layers')
    const assets = this.lottieJSON.get('assets')
    const bgLayer = layers.last()
    if (!bgLayer || !assets.size) {
      return false
    }
    const assetIdx = assets.findIndex((value: any) => {
      return value.get('id') === 'bgImage'
    })
    const layerIdx = layers.findIndex((value: any) => {
      return value.get('refId') === 'bgImage'
    })
    if (!Number.isInteger(assetIdx) || !Number.isInteger(layerIdx)) {
      return false
    }
    return {
      assetIdx,
      layerIdx,
    }
  }

  public changeBgImage({ scale, position = {} }: { scale: number; position?: any }) {
    // const { width, height } = size;
    const { x, y } = position
    const imageIdx = this.checkBgImageExist()
    if (!imageIdx) {
      return
    }
    const { layerIdx } = imageIdx
    this.changeLayersProp({ layerIdx, scale, x, y })
  }

  /**
   * changeLayersProp
   */
  public changeLayersProp({ layerIdx, scale, x, y }) {
    let layers = this.lottieJSON.get('layers').get(layerIdx)
    // 图片缩放
    if (scale) {
      layers = layers.setIn(['ks', 's', 'k'], [scale, scale, 0])
    }
    // 图片位移
    if (x || y) {
      const [xx, yy] = layers.getIn(['ks', 'p', 'k'])
      layers = layers.setIn(['ks', 'p', 'k'], [!x ? xx : x, !y ? yy : y, 0])
    }
    // 图片资源替换的情况,在外围调用
    this.lottieJSON = this.lottieJSON.set(
      'layers',
      this.lottieJSON.get('layers').set(layerIdx, layers)
    )
  }

  public isLottieJSON(jsonObj) {
    if (
      typeof jsonObj.fr === 'number' &&
      typeof jsonObj.ip === 'number' &&
      typeof jsonObj.op === 'number' &&
      typeof jsonObj.w === 'number' &&
      typeof jsonObj.h === 'number' &&
      typeof jsonObj.v === 'string' &&
      Array.isArray(jsonObj.assets) &&
      Array.isArray(jsonObj.layers)
    ) {
      return true
    }

    return false
  }

  /**
   * addPrecomp 合并 lottie 到 当前lottie文件当中
   * 入参 要合并的obj 做fromJS处理
   * 取出 fr ip op w h nm , layers
   * 与 this.lottieJSON 的 基础属性做对比 一致的情况下进行下一步
   * 新建 asset 空Map: precompAsset { id, layers}  确定一个随机id 并塞入 layers
   * 新建 layer: layerPrecomp 设置 refId
   * 将 asset layer unshift 进入 asserts 和 layers
   */
  public addPrecomp(jsonObj) {
    // 检测 jsonObj 合法性
    if (!this.isLottieJSON(jsonObj)) {
      return
    }
    const precomp = fromJS(jsonObj)
    // 检查基础属性是否一致
    const { fr: pfr, ip: pip, op: pop, w: width, h: height } = precomp.toJS()
    const { fr, ip, op, w: canvasWidth, h: canvasHeight } = this.lottieJSON.toJS()
    if (!fr === pfr && op === pop && ip === pip) {
      return
    }
    const asset = fromJS({
      id: 'mainPrecomp',
      layers: precomp.get('layers'),
    })
    // 目标是 contain 包含适配, 以最小缩放为准
    const wScale = Number.parseFloat(((canvasWidth / width) * 100).toFixed(3))
    const hScale = Number.parseFloat(((canvasHeight / height) * 100).toFixed(3))
    const scale = wScale > hScale ? hScale : wScale
    const layers = this.lottieJSON.get('layers')
    const layer = layerPrecomp
      .set('refId', 'mainPrecomp')
      .set('ind', layers.count() + 1)
      .set('ln', 'precomp')
      .set('cl', 'handlehook')
      // .setIn(['ks', 'a', 'k'], [width / 2, height / 2, 0])
      .setIn(['ks', 's', 'k'], [scale, scale, 0])
      .setIn(['ks', 'p', 'k'], [canvasWidth / 2, canvasHeight / 2, 0])

    this.lottieJSON = this.lottieJSON
      .set('assets', this.lottieJSON.get('assets').unshift(asset))
      .set('layers', this.lottieJSON.get('layers').unshift(layer))
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
