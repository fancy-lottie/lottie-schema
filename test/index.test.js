import LottieSchema from '../src/index';

const lottieSchema = new LottieSchema();

it('改变宽度', () => {
  lottieSchema.setWidth('233')
  expect(lottieSchema.getWidth()).toBe('233')
});


it('改变高度', () => {
  lottieSchema.setHeight('233')
  expect(lottieSchema.getHeight()).toBe('233')
});