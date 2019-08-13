// import { Map, List, fromJS } from 'immutable'
import update from 'immutability-helper'
// import { get, set } from 'lodash-es'
const { get, set } = require('lodash');
// import * as get from 'lodash.get'
// import LayerColor from './layers/color';
import layerImage from './layers/image'
import layerPrecomp from './layers/precomp'
import assetImage from './assets/image'

interface ILottieJSONAsset {
  id: string;
  u?: string;
  p?: string;
  e?: number;
  layers?: ILottieJSONLayer[];
}

interface ILottieJSONLayer {
  ty: number;
  nm: string;
  ks: any;
  ao: number;
  ddd: number;
  ind: number;
  ip: number;
  op: number;
  refId?: string;
}


interface ILottieJSON {
  // 版本
  v: string;
  // 帧率
  fr: number;
  // 起始关键帧
  ip: number;
  // 结束关键帧
  op: number;
  // 宽度
  w: number;
  // 高度
  h: number;
  // 合成名称
  nm: string;
  // 3d
  ddd: number;
  // 资源信息
  assets: ILottieJSONAsset[];
  // 图层信息
  layers: ILottieJSONLayer[];
  markers: ILottieJSONLayer[];
}

interface ISchemaOption {
  fonts?: boolean;
}

export default class LottieSchema {
  private lottieJSON: ILottieJSON
  private options: ISchemaOption
  public createLayerSize: number
  constructor(lottieObj?: any, options: ISchemaOption = {}) {
    const defaultLottieObj: ILottieJSON = {
      v: '5.5.5',
      fr: 25,
      ip: 0,
      op: 750,
      w: 1024,
      h: 350,
      nm: '犸良合成lottie',
      ddd: 0,
      assets: [],
      layers: [],
      markers: [],
    }
    const defaultOptions: ISchemaOption = {
      fonts: true, // 默认输出 fonts 可 关闭
    }
    this.lottieJSON = {
      ...defaultLottieObj,
      ...lottieObj,
    }
    this.createLayerSize = 0
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  public getJSON() {
    return JSON.stringify(this.lottieJSON)
  }

  public getObj() {
    return this.lottieJSON
  }

  public getVersion() {
    return this.lottieJSON.v
  }

  public getSize() {
    return {
      width: this.lottieJSON.w,
      height: this.lottieJSON.h,
    }
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
    // 加一个 assets id 的处理, 添加一个后缀
    const time = new Date().valueOf()
    const timeSuffix = time + '_'
    const timePrefix = '_' + time
    const layerId = 'microLottie' + timePrefix
    const formatJSON = JSON.stringify(jsonObj)
      .replace(/"id":"image_/g, '"id":"image_' + timeSuffix)
      .replace(/"refId":"image_/g, '"refId":"image_' + timeSuffix)
      .replace(/"id":"comp_/g, '"id":"comp_' + timeSuffix)
      .replace(/"refId":"comp_/g, '"refId":"comp_' + timeSuffix)
    const precomp = JSON.parse(formatJSON)
    // 检查基础属性是否一致
    const pfr = precomp.fr
    const pip = precomp.ip
    const pop = precomp.op
    const width = precomp.w
    const height = precomp.h
    const fr = this.lottieJSON.fr
    const ip = this.lottieJSON.ip
    const op = this.lottieJSON.op
    const canvasWidth = this.lottieJSON.w
    const canvasHeight = this.lottieJSON.h
    // 动效的 动画属性 覆盖 原本空白模板的动画属性
    if (fr !== pfr || op !== pop || ip !== pip) {
      console.warn('fr, pfr, op, pop, ip, pip', fr, pfr, op, pop, ip, pip)
      this.lottieJSON.fr = pfr
      this.lottieJSON.ip = pip
      this.lottieJSON.op = pop
      // return
    }
    // 将 layer 转换 为 asset
    const asset = {
      id: layerId,
      layers: precomp.layers,
    }
    // 迁移 微动效 中的 assets
    const assets = precomp.assets
    assets.push(asset)
    // 迁移 微动效 中的 fonts
    const fontsList = get(precomp, 'fonts.list', null)
    // const fontsList = precomp.hasIn(['fonts', 'list']) ? precomp.getIn(['fonts', 'list']) : []
    // 目标是 contain 包含适配, 以最小缩放为准
    const wScale = Number.parseFloat(((canvasWidth / width) * 100).toFixed(3))
    const hScale = Number.parseFloat(((canvasHeight / height) * 100).toFixed(3))
    const scale = wScale > hScale ? hScale : wScale
    this.createLayerSize += 1
    const layer = update(layerPrecomp, {
      refId: { $set: layerId },
      ind: { $set: this.createLayerSize },
      nm: { $set: 'precomp' + timePrefix },
      w: { $set: Number(width) },
      h: { $set: Number(height) },
      op: { $set: pop },
      ip: { $set: pip },
      ks: {
        a: {
          k: { $set: [width / 2, height / 2, 0] } // 锚点 是相对于本身的
        },
        s: {
          k: { $set: [scale, scale, 0] }
        },
        p: {
          k: { $set: [canvasWidth / 2, canvasHeight / 2, 0] } // 位置是相对于画布的
        },
      },
    })
    this.lottieJSON.assets = this.lottieJSON.assets.concat(assets)
    this.lottieJSON.layers.unshift(layer)
    if (fontsList && this.options.fonts) {
      set(this.lottieJSON, 'fonts.list', get(this.lottieJSON, 'fonts.list', []).concat(fontsList))
    }
  }

  /**
   * delPrecomp 删除微动效
   * 查找 assets 里面 refId
   */
  public delPrecomp(nm: string) {
    const layerIdx = this.getIdxByNm(nm)
    const layerId = 'microLottie' + '_' + nm.split('_')[1]
    const assetIdx = this.lottieJSON.assets.findIndex(value => value.id === layerId)
    if (assetIdx > -1) {
      this.lottieJSON.assets.splice(assetIdx, 1)
    }
    if (layerIdx > -1) {
      this.lottieJSON.layers.splice(layerIdx, 1)
      this.createLayerSize -= 1
    }
  }

  public checkBgImageExist() {
    const layers = this.lottieJSON.layers
    const assets = this.lottieJSON.assets
    const bgLayer = layers[layers.length - 1]
    if (!bgLayer || assets.length === 0) {
      return false
    }
    const assetIdx = assets.findIndex((value: any) => {
      return value.id === 'bgImage'
    })
    const layerIdx = layers.findIndex((value: any) => {
      return value.refId === 'bgImage'
    })
    if (assetIdx === -1 || layerIdx === -1) {
      return false
    }
    if (!Number.isInteger(assetIdx) || !Number.isInteger(layerIdx)) {
      return false
    }
    return {
      assetIdx,
      layerIdx,
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
    const { w: canvasWidth, h: canvasHeight, ip, op } = this.lottieJSON
    // const layers = this.lottieJSON.layers
    // const assets = this.lottieJSON.assets
    // 设置背景图片宽高Url属性
    const imageAsset = update(assetImage, {
      p: { $set: url },
      w: { $set: width },
      h: { $set: height },
      id: { $set: 'bgImage' },
    })
    // 目标是 cover 包含适配, 以最大缩放为准
    const wScale = Number.parseFloat(((canvasWidth / width) * 100).toFixed(3))
    const hScale = Number.parseFloat(((canvasHeight / height) * 100).toFixed(3))
    const scale = wScale < hScale ? hScale : wScale
    this.createLayerSize += 1
    const imageLayer = update(layerImage, {
      refId: { $set: 'bgImage' },
      ind: { $set: this.createLayerSize },
      // cl: { $set: 'bgImage handlehook' },
      nm: { $set: '背景图片' },
      ip: { $set: ip },
      op: { $set: op },
      ks: {
        a: {
          k: { $set: [width / 2, height / 2, 0] }
        },
        s: {
          k: { $set: [scale, scale, 0] }
        },
        p: {
          k: { $set: [canvasWidth / 2, canvasHeight / 2, 0] }
        }
      },
    })
    this.lottieJSON.assets.push(imageAsset)
    this.lottieJSON.layers.push(imageLayer)
  }

  public setSize({ width, height }: { width: number; height: number }) {
    if (width) {
      this.lottieJSON.w = width
    }
    if (height) {
      this.lottieJSON.h = height
    }
  }

  /**
   * delBgImage
   */
  public delBgImage() {
    const imageIdx = this.checkBgImageExist()
    if (imageIdx) {
      this.createLayerSize -= 1
      this.lottieJSON = update(this.lottieJSON, {
        assets: {
          $splice: [[imageIdx.assetIdx, 1]]
        },
        layers: {
          $splice: [[imageIdx.layerIdx, 1]]
        }
      })
    }
  }

  public changeBgImage({ scale, position = {} }: { scale: number; position?: any }) {
    // const { width, height } = size;
    const { x, y } = position
    const imageIdx = this.checkBgImageExist()
    if (!imageIdx) {
      return
    }
    // const { layerIdx } = imageIdx
    this.changeLayersProp({ nm: '背景图片', scale, x, y })
  }

  /**
   * getIdxByNm
   */
  public getIdxByNm(nm) {
    return this.lottieJSON.layers.findIndex(value => value.nm === nm)
  }

  /**
   * changeLayersProp
   */
  public changeLayersProp({ nm, scale, x, y }) {
    const layerIdx = this.getIdxByNm(nm)
    if (layerIdx === -1) {
      return
    }
    const layers = this.lottieJSON.layers[layerIdx]
    // 图片缩放
    if (scale) {
      layers.ks.s.k = [scale, scale, 0]
    }
    // 图片位移
    if (x || y) {
      const [xx, yy] = layers.ks.p.k
      layers.ks.p.k = [!x ? xx : x, !y ? yy : y, 0]
    }
    // 图片资源替换的情况,在外围调用
    this.lottieJSON.layers[layerIdx] = layers
  }

  /**
   * getLayerProps
   */
  public getLayerProps() {
    const layers = this.lottieJSON.layers
    return layers
      .map(layer => ({
        nm: layer.nm,
        s: layer.ks.s.k[0],
        x: layer.ks.p.k[0],
        y: layer.ks.p.k[1],
      }))
  }
}
