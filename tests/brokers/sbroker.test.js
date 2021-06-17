import { findImplementation } from '../../src';
import * as sbroker from '../../src/brokers/sbroker';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  allSamples,
} from './__mocks__/sbroker';

console.error = jest.fn();

describe('Broker: sbroker', () => {
  describe('Check all documents', () => {
    it('Can the document be parsed with sbroker', () => {
      allSamples.forEach(pages => {
        expect(sbroker.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    it('Can identify a implementation from the document as sbroker', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(sbroker);
      });
    });
  });

  describe('Buy', () => {
    it('Can parse United internet 2021', () => {
      const result = sbroker.parsePages(buySamples[0]);

      expect(result.activities).toEqual([
        {
          broker: 'sbroker',
          type: 'Buy',
          date: '2021-02-15',
          datetime: '2021-02-15T09:25:00.000Z',
          isin: 'DE0005089031',
          company: 'United Internet AG Namens-Aktien o.N.',
          shares: 78,
          price: 38.39,
          amount: 2994.42,
          fee: 13.46 + 0.6,
          tax: 0,
        },
      ]);
    });

    it('can parse Deka 2020', () => {
      const result = sbroker.parsePages(buySamples[1]);

      expect(result.activities).toEqual([
        {
          broker: 'sbroker',
          type: 'Buy',
          date: '2020-12-21',
          datetime: '2020-12-21T08:06:00.000Z',
          isin: 'DE000ETFL490',
          company: 'Deka Euroz.Rendi.Pl.1-10 U.ETF Inhaber-Anteile',
          shares: 3.034,
          price: 99.658,
          amount: 302.36,
          fee: 0,
          tax: 0,
        },
      ]);
    });
  });

  describe('Sell', () => {
    it('can parse Evonik 2021', () => {
      const result = sbroker.parsePages(sellSamples[0]);

      expect(result.activities).toEqual([
        {
          broker: 'sbroker',
          type: 'Sell',
          date: '2021-01-21',
          datetime: '2021-01-21T11:56:00.000Z',
          isin: 'DE000EVNK013',
          company: 'Evonik Industries AG Namens-Aktien o.N.',
          shares: 249.0,
          price: 27.43,
          amount: 6830.07,
          fee: 23.05,
          tax: 59.03 + 3.24,
        },
      ]);
    });
  });

  describe('Dividend', () => {
    it('Can parse dividend for Realty Income', () => {
      const activities = sbroker.parsePages(dividendsSamples[0]).activities;

      expect(activities).toEqual([
        {
          broker: 'sbroker',
          type: 'Dividend',
          date: '2021-02-16',
          datetime: '2021-02-16T' + activities[0].datetime.substring(11),
          isin: 'US7561091049',
          company: 'Realty Income Corp. Registered Shares DL 1',
          shares: 60,
          price: 0.193,
          amount: 11.58,
          fee: 0,
          tax: 2.97,
          foreignCurrency: 'USD',
          fxRate: 1.21485,
        },
      ]);
    });
  });
});
