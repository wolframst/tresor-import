import { findImplementation } from '@/index';
import {
  allSamples,
  dividendSamples,
  depotStatusSamples,
  ignoredSamples,
  transactionLogSamples,
} from './__mocks__/deutscheBank';
import { deutschebank } from '../../src/brokers';

describe('Broker: Deutsche Bank', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can parse all valid Deutsche Bank Samples', () => {
      allSamples.forEach(pages => {
        expect(deutschebank.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Samples can be parsed by Deutsche Bank only!', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(deutschebank);
      });
    });
  });

  describe('Validate Dividend', () => {
    test('Can the transactions be parsed from: 2020_agnc_invest.json', () => {
      const result = deutschebank.parsePages(dividendSamples[0]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2020-01-14',
        datetime: '2020-01-14T' + result.activities[0].datetime.substr(11),
        isin: 'US00123Q1040',
        wkn: 'A2AR58',
        company: 'AGNC INVESTMENT CORP.RG.SH. DL -,001',
        shares: 60,
        price: 0.1435,
        amount: 8.61,
        fee: 0,
        tax: 1.29,
        foreignCurrency: 'USD',
        fxRate: 1.1144,
      });
    });

    test('Can the transactions be parsed from: 2020_johnson_johnson.json', () => {
      const result = deutschebank.parsePages(dividendSamples[1]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2020-12-10',
        datetime: '2020-12-10T' + result.activities[0].datetime.substr(11),
        isin: 'US4781601046',
        wkn: '853260',
        company: 'JOHNSON & JOHNSON REGISTERED SHARES DL 1',
        shares: 3.2495,
        price: 0.830897061086321,
        amount: 2.7,
        fee: 0,
        tax: 0.69,
        foreignCurrency: 'USD',
        fxRate: 1.2161,
      });
    });

    it('Correctly detects exchange rate from medistim in NOK', () => {
      const result = deutschebank.parsePages(dividendSamples[2]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2021-05-11',
        datetime: '2021-05-11T' + result.activities[0].datetime.substr(11),
        isin: 'NO0010159684',
        wkn: 'A0D9B1',
        company: 'MEDISTIM ASA NAVNE-AKSJER NK -,25',
        shares: 430,
        price: 0.2978372093023256, // 128.07 / 430,
        amount: 128.07,
        fee: 0,
        tax: 65.8, // 32.02 + 32.02 + 1.76,
        foreignCurrency: 'NOK',
        fxRate: 10.0723,
      });
    });

    it('Correctly detects dividend for allianz in EUR', () => {
      const result = deutschebank.parsePages(dividendSamples[3]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2021-05-10',
        datetime: '2021-05-10T' + result.activities[0].datetime.substr(11),
        isin: 'DE0008404005',
        wkn: '840400',
        company: 'ALLIANZ SE VINK.NAMENS-AKTIEN O.N.',
        shares: 42,
        price: 403.2 / 42, // 403.20 / 42,
        amount: 403.2,
        fee: 0,
        tax: 106.34, // 100.8 + 5.54
      });
    });

    it('Correctly detects dividend for XTRACKERS EURO STOXX 50 in EUR', () => {
      const result = deutschebank.parsePages(dividendSamples[4]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2021-05-06',
        datetime: '2021-05-06T' + result.activities[0].datetime.substr(11),
        isin: 'LU0274211217',
        wkn: 'DBX1EU',
        company: 'XTRACKERS EURO STOXX 50 INH.ANT . 1D O.N.',
        shares: 205,
        price: 0.7386829268292683,
        amount: 151.43,
        fee: 0,
        tax: 27.95, // 26.5 + 1.45
      });
    });

    it('Correctly detects kupon for IBB bond in AUD', () => {
      const result = deutschebank.parsePages(dividendSamples[5]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2021-02-24',
        datetime: '2021-02-24T' + result.activities[0].datetime.substr(11),
        isin: 'AU3CB0198034',
        wkn: 'A1G803',
        company: '5% EUROPEAN INVESTMENT BANK MTN.12 22.F/A 08.22',
        shares: 1,
        price: 193.94,
        amount: 193.94,
        fee: 0,
        tax: 51.15, // 48.49 + 2.66
        foreignCurrency: 'AUD',
        fxRate: 1.5469,
      });
    });

    it('Correctly detects two-page dividend for Johnson and Johnson in USD', () => {
      const result = deutschebank.parsePages(dividendSamples[6]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2021-03-11',
        datetime: '2021-03-11T' + result.activities[0].datetime.substr(11),
        isin: 'US4781601046',
        wkn: '853260',
        company: 'JOHNSON & JOHNSON REGISTERED SHARES DL 1',
        shares: 250,
        price: 0.84484, // 1.01 / 1.1955
        amount: 211.21,
        fee: 0,
        tax: 53.97, // 31.69 + 21.12 + 1.16
        foreignCurrency: 'USD',
        fxRate: 1.1955,
      });
    });

    it('Correctly detects two-page dividend for Novartis in CHF', () => {
      const result = deutschebank.parsePages(dividendSamples[7]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2021-03-08',
        datetime: '2021-03-08T' + result.activities[0].datetime.substr(11),
        isin: 'CH0012005267',
        wkn: '904278',
        company: 'NOVARTIS AG NAMENS-AKTIEN SF 0,50',
        shares: 71,
        price: 3 / 1.1138, // 1.01 / 1.1955
        amount: 213 / 1.1138,
        fee: 0,
        tax: (74.55 + 21.3 + 1.17) / 1.1138,
        foreignCurrency: 'CHF',
        fxRate: 1.1138,
      });
    });

    it('Correctly detects two-page dividend for Automatic Data Processing in USD', () => {
      const result = deutschebank.parsePages(dividendSamples[8]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2021-01-06',
        datetime: '2021-01-06T' + result.activities[0].datetime.substr(11),
        isin: 'US0530151036',
        wkn: '850347',
        company: 'AUTOMATIC DATA PROCESSING INC.RG.SH. DL -,10',
        shares: 942,
        price: 0.7534076433121019, // 709.71 / 942,
        amount: 709.71,
        fee: 0,
        tax: 185.91, // 106.46 + 69.4 + 3.81 + 6.24,
        foreignCurrency: 'USD',
        fxRate: 1.2344,
      });
    });
  });

  describe('Validate Depot Status', () => {
    test('Can the TransferIns be parsed from: 2021_depot_status_standard.json', () => {
      const result = deutschebank.parsePages(depotStatusSamples[0]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(5);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'TransferIn',
        date: '2021-01-03',
        datetime: '2021-01-03T12:33:00.000Z',
        wkn: '984811',
        company: 'DWS TOP DIVIDENDE INHABER-ANTEILE LD',
        shares: 3.2861,
        price: 115.35,
        amount: 379.05,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[4]).toEqual({
        broker: 'deutschebank',
        type: 'TransferIn',
        date: '2021-01-03',
        datetime: '2021-01-03T12:33:00.000Z',
        wkn: 'A0RPWJ',
        company: 'ISHSIII-MSCI EM USD(ACC) FUNDS',
        shares: 13.2059,
        price: 34.85558,
        amount: 460.3,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the TransferIns be parsed from: 2021_sepot_status_with_prices.json', () => {
      const result = deutschebank.parsePages(depotStatusSamples[1]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(3);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'TransferIn',
        date: '2021-02-06',
        datetime: '2021-02-06T16:25:00.000Z',
        wkn: 'A1XB5U',
        company: 'X(IE)-MSCI WORLD 1C FUNDS',
        shares: 15.902,
        price: 60.62319,
        amount: 1097.48,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[1]).toEqual({
        broker: 'deutschebank',
        type: 'TransferIn',
        date: '2021-02-06',
        datetime: '2021-02-06T16:25:00.000Z',
        wkn: 'A0F5UF',
        company: 'ISHARE.NASDAQ-100 UCITS ETF DE',
        shares: 1.3843,
        price: 102.94734,
        amount: 152.16,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate TransactionLog', () => {
    test('Can the Transaction Logs be parsed from: 2020_buy_dividend_transaction_log.json', () => {
      const result = deutschebank.parsePages(transactionLogSamples[0]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(21);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Buy',
        date: '2020-12-23',
        datetime: '2020-12-23T' + result.activities[0].datetime.substr(11),
        wkn: 'A0F5UF',
        company: 'ISHARE.NASDAQ-100 UCITS ETF DE INHABER-ANT.',
        shares: 0.485,
        price: 101.76,
        amount: 50.02,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the Transaction Logs be parsed from: 2019_sell_transaction_log.json', () => {
      const result = deutschebank.parsePages(transactionLogSamples[1]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(3);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Sell',
        date: '2019-04-08',
        datetime: '2019-04-08T' + result.activities[0].datetime.substr(11),
        wkn: 'DBX1MW',
        company: 'XTRACKERS MSCI WORLD SWAP INH.ANT.1C O.N.',
        shares: 14,
        price: 54.31,
        amount: 738.94,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[1]).toEqual({
        broker: 'deutschebank',
        type: 'Sell',
        date: '2019-04-08',
        datetime: '2019-04-08T' + result.activities[1].datetime.substr(11),
        wkn: 'DBX1ET',
        company: 'XTRACKERS EURO STOXX 50 INH.ANT. 1C O.N.',
        shares: 14,
        price: 49.34,
        amount: 669.36,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Check unsupported files from Deutsche Bank', () => {
    test('Every unsupported file is marked as such with status code 7', () => {
      ignoredSamples.forEach(sample => {
        expect(deutschebank.parsePages(sample).status).toEqual(7);
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
