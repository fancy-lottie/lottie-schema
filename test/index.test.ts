import LottieSchema from '../src/index'
// import * as fs from 'fs'
const data1 = require('./点赞动画3.json')
// tslint:disable-next-line:no-console
const log = obj => console.log(JSON.stringify(obj))



it('改变size', () => {
  const lottieSchema = new LottieSchema({
    w: 300,
    h: 300,
  })
  lottieSchema.setSize({
    width: 233,
    height: 322,
  })
  expect(lottieSchema.getSize()).toEqual({
    width: 233,
    height: 322,
  })
  // log(lottieSchema.getSize())
  // expect(lottieSchema.getSize()).toEqual( {"ip":0,"op":750,"width":300,"height":300})
})

it('changeBgImage', () => {
  const lottieSchema = new LottieSchema({
    w: 300,
    h: 300,
  })
  lottieSchema.addBgImage({
    url: 'https://gw.alipayobjects.com/zos/antfincdn/I9Bu85KAaq/750x300.png',
    width: 750,
    height: 300,
  })
  lottieSchema.changeBgImage({
    scale: 233,
    position: {
      x: 100,
      y: 150,
    },
  })
  log(lottieSchema.getObj())
})

it('addPrecomp', () => {
  const { ip, op, fr } = data1;
  const lottieSchema = new LottieSchema({
    ip, op, fr
  })
  // lottieSchema.addBgImage({
  //   url: 'https://gw.alipayobjects.com/zos/antfincdn/I9Bu85KAaq/750x300.png',
  //   width: 750,
  //   height: 300,
  // })
  lottieSchema.addPrecomp(data1)
  // fs.writeFileSync('./test/res1.json', lottieSchema.getJSON())
})
