/* eslint-disable fp-jxl/no-unused-expression, fp-jxl/no-nil */
import '@babel/register';
import { add, subtract } from './index';

describe('Test', () => {
  test('should add two numbers', () => {
    const actual = add(5)(5);

    expect(actual).toBe(10);
  });

  test('should subtract two numbers', () => {
    const actual = subtract(5)(2);

    expect(actual).toBe(3);
  });
});
