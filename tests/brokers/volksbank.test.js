import { findImplementation } from '../../src';
import * as volksbank from '../../src/brokers/volksbank';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
} from './__mocks__/volksbank';

describe('Broker: volksbank', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    it('Can the document parsed with volksbank', () => {
      allSamples.forEach(pages => {
        expect(volksbank.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    it('Can identify a implementation from the document as volksbank', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(volksbank);
      });
    });
  });

  describe('Validate buys', () => {
    it('parses a buy for Walt Disney', () => {
      const activities = volksbank.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'volksbank',
        type: 'Buy',
        date: '2020-05-19',
        datetime: '2020-05-19T08:00:35.000Z',
        isin: 'US2546871060',
        company: 'WALT DISNEY CO., THE REGISTERED SHARES DL -,01',
        shares: 47,
        price: 107.2,
        currency: 'EUR',
        fxRate: 1,
        amount: 5038.4,
        fee: 12.6 + 0.1,
        tax: 0,
      });
    });
  });

  describe('Validate sells', () => {
    it('parses a sell for SSE', () => {
      const activities = volksbank.parsePages(sellSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'volksbank',
        type: 'Sell',
        date: '2020-12-23',
        datetime: '2020-12-23T08:04:31.000Z',
        isin: 'GB0007908733',
        company: 'SSE PLC SHS LS-,50',
        shares: 317,
        price: 16.34,
        currency: 'EUR',
        fxRate: 1,
        amount: 5179.78,
        fee: 13.05,
        tax: 47.1 + 2.59,
      });
    });
  });

  describe('Validate dividends', () => {
    it('Can the etf dividend be parsed from the document', () => {
      const activities = volksbank.parsePages(dividendSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'volksbank',
        type: 'Dividend',
        date: '2020-12-08',
        datetime: '2020-12-08T' + activities[0].datetime.substring(11),
        isin: 'US4781601046',
        company: 'JOHNSON & JOHNSON  SHARES REGISTERED SHARES DL 1',
        shares: 80,
        price: 1.01,
        currency: 'USD',
        fxRate: 1.2152,
        amount: 80.8,
        fee: 0,
        tax: 20.646248,
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
