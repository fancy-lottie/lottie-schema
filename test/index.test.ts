import LottieSchema from '../src/index';
// tslint:disable-next-line:no-console
const log = obj => console.log(JSON.stringify(obj))

it('改变size', () => {
  const lottieSchema = new LottieSchema();
  lottieSchema.setSize({
    width: '233',
    height: '322',
  })
  // expect(lottieSchema.getSize()).toEqual({
  //   width: '233',
  //   height: '322',
  // })
  log(lottieSchema.getSize())

});



it('changeBgImage', () => {
  const lottieSchema = new LottieSchema();
  lottieSchema.addBgImage({
    url: 'https://gw.alipayobjects.com/zos/antfincdn/I9Bu85KAaq/750x300.png',
    width: 750,
    height: 300,
  })
  // lottieSchema.addBgImage({
  //   url: 'https://gw.alipayobjects.com/zos/antfincdn/I9Bu85KAaq/750x300.png',
  //   width: 800,
  //   height: 400,
  // })
  // lottieSchema.changeBg({
  //   type: 'bgColor',
  //   data: {
  //     color: '#0ae'
  //   }
  // })
  lottieSchema.changeBgImage({
    size: {
      width: 500,
      height: 150,
    },
    position: {
      x: 100,
      y: 150,
    }
  })
  log(lottieSchema.getObj())
});
