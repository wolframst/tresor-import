import { parseData } from '../../src/brokers/cortalconsors';

const stockBuy1 = require('./__mocks__/cortalconsors/stock_buy1.json');
const stockSell1 = require('./__mocks__/cortalconsors/stock_sell1.json');
const stockDividend1 = require('./__mocks__/cortalconsors/stock_dividend1.json');

describe('Cortal Consors broker', () => {
  let consoleErrorSpy;

  describe('Stock Buy', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockBuy1);

      expect(activity).toEqual({
        broker: 'cortalconsors',
        type: 'Buy',
        date: '2014-03-07',
        isin: 'DE0008404005',
        company: 'ALLIANZ SE VNA O.N.',
        shares: 23,
        price: 124.9,
        amount: 2872.7,
        fee: 6.9,
        tax: 0,
      });
    });
  });

  describe('Stock Sell', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockSell1);

      expect(activity).toEqual({
        broker: 'cortalconsors',
        type: 'Sell',
        date: '2014-12-05',
        isin: 'DE0008404005',
        company: 'ALLIANZ SE VNA O.N.',
        shares: 23,
        price: 138.15521739130435,
        amount: 3177.57,
        fee: 4.95,
        tax: 73.26 + 4.02,
      });
    });
  });

  describe('Stock Dividend', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockDividend1);

      expect(activity).toEqual({
        broker: 'cortalconsors',
        type: 'Dividend',
        date: '2014-05-07',
        wkn: '840400',
        isin: undefined,
        company: 'Allianz SE',
        shares: 23,
        price: 3.902173913043478,
        amount: 89.75,
        fee: 0,
        tax: 30.48 + 1.67,
      });
    });
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
