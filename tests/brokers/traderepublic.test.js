import { findImplementation } from '@/index';
import * as traderepublic from '../../src/brokers/traderepublic';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
  depotStatement,
  options,
  ignoredSamples,
} from './__mocks__/traderepublic';

describe('Broker: Trade Republic', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with Trade Republic', () => {
      allSamples.forEach(pages => {
        expect(traderepublic.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Trade Republic', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(traderepublic);
      });
    });
  });

  describe('Validate buys', () => {
    test('Map a limit order correctly', () => {
      const activities = traderepublic.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-02-24',
        datetime: '2020-02-24T10:28:00.000Z',
        isin: 'US88160R1014',
        company: 'Tesla Inc.',
        shares: 3,
        price: 768.1,
        amount: 2304.3,
        fee: 1,
        tax: 0,
      });
    });

    test('Map a market order correctly', () => {
      const activities = traderepublic.parsePages(buySamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2019-11-29',
        datetime: '2019-11-29T11:08:00.000Z',
        isin: 'GB00B03MLX29',
        company: 'Royal Dutch Shell',
        shares: 382,
        price: 26.14,
        amount: 9985.48,
        fee: 1,
        tax: 0,
      });
    });

    test('Map a limit order with financial transaction tax correctly', () => {
      const activities = traderepublic.parsePages(buySamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-06-09',
        datetime: '2020-06-09T11:36:00.000Z',
        isin: 'FR0000031122',
        company: 'Air France-KLM S.A.',
        shares: 100,
        price: 5.632,
        amount: 563.2,
        fee: 1,
        tax: 1.69,
      });
    });

    test('Map a market order without explicit ISIN correctly', () => {
      const activities = traderepublic.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2019-07-19',
        datetime: '2019-07-19T12:32:00.000Z',
        isin: 'DE000SHL1006',
        company: 'Siemens Healthineers AG',
        shares: 14,
        price: 35.7,
        amount: 499.8,
        fee: 1,
        tax: 0,
      });
    });

    test('Map a saving plan order correctly', () => {
      const activities = traderepublic.parsePages(buySamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-01-16',
        datetime: '2020-01-16T' + activities[0].datetime.substring(11),
        isin: 'IE00B1YZSC51',
        company: 'iShsII-Core MSCI Europe U.ETF',
        shares: 1.3404,
        price: 26.111608475082065,
        amount: 35.0,
        fee: 0,
        tax: 0,
      });
    });

    test('Parse a prefered buy: 2021_tui_preferred_buy.json', () => {
      const activities = traderepublic.parsePages(buySamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2021-01-26',
        datetime: '2021-01-26T' + activities[0].datetime.substring(11),
        isin: 'DE000TUAG000',
        company: 'TUI AG',
        shares: 75,
        price: 1.07,
        amount: 80.25,
        fee: 5,
        tax: 0,
      });
    });
  });

  describe('Validate sells', () => {
    test('Map a limit sell order correctly: Tesla', () => {
      const activities = traderepublic.parsePages(sellSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 2550,
        broker: 'traderepublic',
        company: 'Tesla Inc.',
        date: '2020-02-04',
        datetime: '2020-02-04T14:52:00.000Z',
        fee: 1,
        isin: 'US88160R1014',
        price: 850.0,
        shares: 3,
        tax: 36.47,
        type: 'Sell',
      });
    });

    test('Map a limit sell order correctly: Stryker', () => {
      const activities = traderepublic.parsePages(sellSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 16723.08,
        broker: 'traderepublic',
        company: 'Stryker Corp.',
        date: '2020-07-21',
        datetime: '2020-07-21T08:24:00.000Z',
        fee: 1,
        isin: 'US8636671013',
        price: 168.92,
        shares: 99,
        tax: 52.97,
        type: 'Sell',
      });
    });

    test('Map a limit sell order with tax returns correctly: Workgroup', () => {
      const activities = traderepublic.parsePages(sellSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 1005.0,
        broker: 'traderepublic',
        company: 'Workhorse Group Inc.',
        date: '2020-10-02',
        datetime: '2020-10-02T07:04:00.000Z',
        fee: 1,
        isin: 'US98138J2069',
        price: 20.1,
        shares: 50,
        tax: -6.93,
        type: 'Sell',
      });
    });

    test('Parse the tax amount right with the changed label for gain tax: 2021_IE00B53SZB19', () => {
      const activities = traderepublic.parsePages(sellSamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 523.69,
        broker: 'traderepublic',
        company: 'iShsVII-NASDAQ 100 UCITS ETF',
        date: '2021-06-01',
        datetime: '2021-06-01T14:18:00.000Z',
        fee: 0,
        isin: 'IE00B53SZB19',
        price: 628.6040091225543,
        shares: 0.8331,
        tax: 2.57,
        type: 'Sell',
      });
    });
  });

  describe('Validate dividends', () => {
    test('Should map the pdf data correctly for: Royal Dutch Shell', () => {
      const activities = traderepublic.parsePages(dividendSamples[0])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'GB00B03MLX29',
        company: 'Royal Dutch Shell',
        date: '2020-03-23',
        datetime: '2020-03-23T' + activities[0].datetime.substring(11),
        shares: 382,
        amount: 160.17257314553456,
        price: 0.41929992970035224,
        fee: 0,
        tax: 41.96499384432018,
        fxRate: 1.120916,
        foreignCurrency: 'USD',
      });
    });

    test('Should map the pdf data correctly for: iSh.ST.Eur.Sel.Div.30 U.ETF DE', () => {
      const activities = traderepublic.parsePages(dividendSamples[1])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 11.87,
        broker: 'traderepublic',
        company: 'iSh.ST.Eur.Sel.Div.30 U.ETF DE',
        date: '2020-07-15',
        datetime: '2020-07-15T' + activities[0].datetime.substring(11),
        fee: 0,
        isin: 'DE0002635299',
        price: 0.2699973159491759,
        shares: 43.9634,
        tax: 2.2,
        type: 'Dividend',
      });
    });

    test('Should map the pdf data correctly for: iSh.EO ST.Sel.Div.30 U.ETF DE', () => {
      const activities = traderepublic.parsePages(dividendSamples[2])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 10.23,
        broker: 'traderepublic',
        company: 'iSh.EO ST.Sel.Div.30 U.ETF DE',
        date: '2020-07-15',
        datetime: '2020-07-15T' + activities[0].datetime.substring(11),
        fee: 0,
        isin: 'DE0002635281',
        price: 0.23434708108454821,
        shares: 43.6532,
        tax: 1.89,
        type: 'Dividend',
      });
    });

    test('Should map the pdf data correctly for: iShsII-Dev.Mkts Prop.Yld U.ETF', () => {
      const activities = traderepublic.parsePages(dividendSamples[3])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'IE00B1FZS350',
        company: 'iShsII-Dev.Mkts Prop.Yld U.ETF',
        date: '2020-02-26',
        datetime: '2020-02-26T' + activities[0].datetime.substring(11),
        shares: 141,
        amount: 24.328812621090506,
        price: 0.172544770362344,
        fee: 0,
        tax: 6.81,
        fxRate: 1.0839,
        foreignCurrency: 'USD',
      });
    });

    test('Should map the pdf data correctly for: Gazprom with third party expenses and withholding tax', () => {
      const activities = traderepublic.parsePages(dividendSamples[4])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US3682872078',
        company: 'Gazprom PJSC',
        date: '2020-08-18',
        datetime: '2020-08-18T' + activities[0].datetime.substring(11),
        shares: 45,
        amount: 15.65422529277951,
        price: 0.347871673172878,
        tax: 2.350661386805965,
        fee: 0.7582778667116017,
        fxRate: 1.1869,
        foreignCurrency: 'USD',
      });
    });

    test('Should map the pdf data correctly for: Realty Income Corp with other withholding tax format', () => {
      const activities = traderepublic.parsePages(dividendSamples[5])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US7561091049',
        company: 'Realty Income Corp.',
        date: '2020-09-15',
        datetime: '2020-09-15T' + activities[0].datetime.substring(11),
        amount: 0.9842685286447379,
        shares: 5,
        price: 0.1968537057289476,
        tax: 0.15142592748380584,
        fee: 0,
        fxRate: 1.1887,
        foreignCurrency: 'USD',
      });
    });

    test('Should map the pdf data correctly for: Unilever with other withholding tax format', () => {
      const activities = traderepublic.parsePages(dividendSamples[6])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 2.05,
        broker: 'traderepublic',
        company: 'Unilever N.V.',
        date: '2020-09-09',
        datetime: '2020-09-09T' + activities[0].datetime.substring(11),
        fee: 0,
        isin: 'NL0000388619',
        price: 0.41,
        shares: 5,
        tax: 0.31,
        type: 'Dividend',
      });
    });

    test('New Dividend Date Format starting in 2020: 2020_walgreens_boots_alliance', () => {
      const activities = traderepublic.parsePages(dividendSamples[7])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US9314271084',
        company: 'Walgreens Boots Alliance Inc.',
        date: '2020-12-11',
        datetime: '2020-12-11T' + activities[0].datetime.substring(11),
        shares: 1,
        amount: 0.3867357854027812,
        price: 0.3867357854027812,
        tax: 0.05759894676211635,
        fee: 0,
        fxRate: 1.2153,
        foreignCurrency: 'USD',
      });
    });

    test('New Dividend Date Format starting in 2020: 2020_exxon_mobile_corp', () => {
      const activities = traderepublic.parsePages(dividendSamples[8])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US30231G1022',
        company: 'Exxon Mobil Corp.',
        date: '2020-12-10',
        datetime: '2020-12-10T' + activities[0].datetime.substring(11),
        amount: 3.5870371897418982,
        price: 0.7174074379483797,
        shares: 5,
        tax: 0.5359940628349963,
        fee: 0,
        foreignCurrency: 'USD',
        fxRate: 1.2127,
      });
    });

    test('Should map the pdf data correctly for: 2020_schlumberger', () => {
      const activities = traderepublic.parsePages(dividendSamples[9])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'AN8068571086',
        company: 'Schlumberger N.V. (Ltd.)',
        date: '2020-10-08',
        datetime: '2020-10-08T' + activities[0].datetime.substring(11),
        amount: 13.767686181479284,
        price: 0.10590527831907141,
        shares: 130,
        tax: 3.64,
        fee: 0,
        foreignCurrency: 'USD',
        fxRate: 1.1803,
      });
    });

    test('Should map the pdf data correctly for: 2021_reinvest_main_street_capital', () => {
      const activities = traderepublic.parsePages(dividendSamples[10])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US56035L1044',
        company: 'Main Street Capital Corp.',
        date: '2021-01-15',
        datetime: '2021-01-15T' + activities[0].datetime.substring(11),
        amount: 2.527262433228578,
        price: 0.16848416221523854,
        shares: 15,
        tax: 0.37744828548219017,
        fee: 0,
        foreignCurrency: 'USD',
        fxRate: 1.21871,
      });
    });

    it('Should map the pdf data correctly for: 2021_realty_income', () => {
      const activities = traderepublic.parsePages(dividendSamples[11])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US7561091049',
        company: 'Realty Income Corp.',
        date: '2021-06-15',
        datetime: '2021-06-15T' + activities[0].datetime.substring(11),
        amount: 5.41 / 1.2167,
        price: 0.19332406616614434, // 0.235 / 1.2167
        shares: 23,
        tax: 0.44 + 0.03 + 0.81 / 1.2167,
        fee: 0,
        foreignCurrency: 'USD',
        fxRate: 1.2167,
      });
    });
  });

  describe('Validate depotStatements', () => {
    test('Map a empty depot statement correctly', () => {
      const activities = traderepublic.parsePages(depotStatement[0]).activities;
      expect(activities.length).toEqual(0);
    });

    test('Map a quarter depot statement with two positions correctly', () => {
      const activities = traderepublic.parsePages(depotStatement[1]).activities;

      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        amount: 132.96,
        broker: 'traderepublic',
        company: 'Royal Dutch Shell',
        date: '2020-06-30',
        datetime: '2020-06-30T' + activities[0].datetime.substring(11),
        fee: 0,
        isin: 'GB00B03MLX29',
        price: 13.296,
        shares: 10,
        tax: 0,
        type: 'TransferIn',
      });
      expect(activities[1]).toEqual({
        amount: 210.79,
        broker: 'traderepublic',
        company: 'Gazprom PJSC',
        date: '2020-06-30',
        datetime: '2020-06-30T' + activities[1].datetime.substring(11),
        fee: 0,
        isin: 'US3682872078',
        price: 4.684222222222222,
        shares: 45,
        tax: 0,
        type: 'TransferIn',
      });
    });

    test('Should map the pdf data correctly for: two_pages', () => {
      const activities = traderepublic.parsePages(depotStatement[2]).activities;
      expect(activities.length).toEqual(16);

      expect(activities[10]).toEqual({
        amount: 366.12,
        broker: 'traderepublic',
        company: 'VISA Inc.',
        date: '2020-03-31',
        datetime: '2020-03-31T' + activities[10].datetime.substring(11),
        fee: 0,
        isin: 'US92826C8394',
        price: 183.06,
        shares: 2,
        tax: 0,
        type: 'TransferIn',
      });

      expect(activities[11]).toEqual({
        amount: 391,
        broker: 'traderepublic',
        company: 'Zoom Video',
        date: '2020-03-31',
        datetime: '2020-03-31T' + activities[11].datetime.substring(11),
        fee: 0,
        isin: 'US98980L1017',
        price: 130.33333333333334,
        shares: 3,
        tax: 0,
        type: 'TransferIn',
      });
    });

    test('Should map the pdf data correctly for: 2020_year_end_statement', () => {
      const activities = traderepublic.parsePages(depotStatement[3]).activities;
      expect(activities.length).toEqual(56);

      expect(activities[2]).toEqual({
        amount: 234.8,
        broker: 'traderepublic',
        company: 'Manganese X Energy',
        date: '2020-12-30',
        datetime: '2020-12-30T' + activities[2].datetime.substring(11),
        fee: 0,
        isin: 'CA5626781028',
        price: 0.2348,
        shares: 1000,
        tax: 0,
        type: 'TransferIn',
      });

      expect(activities[3]).toEqual({
        amount: 80,
        broker: 'traderepublic',
        company: 'Standard Lithium Ltd.',
        date: '2020-12-30',
        datetime: '2020-12-30T' + activities[3].datetime.substring(11),
        fee: 0,
        isin: 'CA8536061010',
        price: 1.309009750486379,
        shares: 61.1149,
        tax: 0,
        type: 'TransferIn',
      });

      expect(activities[7]).toEqual({
        amount: 149.96,
        broker: 'traderepublic',
        company: 'VARTA AG',
        date: '2020-12-30',
        datetime: '2020-12-30T' + activities[7].datetime.substring(11),
        fee: 0,
        isin: 'DE000A0TGJ55',
        price: 112.58258258258259,
        shares: 1.332,
        tax: 0,
        type: 'TransferIn',
      });

      expect(activities[54]).toEqual({
        amount: 3200,
        broker: 'traderepublic',
        company: 'iShsIII-Core MSCI World',
        date: '2020-12-30',
        datetime: '2020-12-30T' + activities[54].datetime.substring(11),
        fee: 0,
        isin: 'IE00B4L5Y983',
        price: 54.997181394453534,
        shares: 58.1848,
        tax: 0,
        type: 'TransferIn',
      });
    });

    test('Should parse depot statement: 2020_depotStatement_single_etf', () => {
      const activities = traderepublic.parsePages(depotStatement[4]).activities;
      expect(activities.length).toEqual(1);

      expect(activities[0]).toEqual({
        type: 'TransferIn',
        broker: 'traderepublic',
        company: 'iShsV-S&P 500 Inf.Te.',
        date: '2020-06-30',
        datetime: '2020-06-30T' + activities[0].datetime.substring(11),
        isin: 'IE00B3WJKG14',
        amount: 100,
        price: 11.243408551736545,
        shares: 8.8941,
        tax: 0,
        fee: 0,
      });
    });
  });

  describe('Validate options', () => {
    test('Can parse a repayment of an unused call 2021_call_apple_tilgung', () => {
      const activities = traderepublic.parsePages(options[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Sell',
        isin: 'DE000TT3CJX8',
        company: 'HSBC Trinkaus & Burkhardt AG Call 13.01.21 Apple 130',
        date: '2021-01-20',
        datetime: '2021-01-20T' + activities[0].datetime.substring(11),
        shares: 5,
        amount: 1.47,
        price: 0.294,
        fee: 0,
        tax: 0,
      });
    });

    test('Parse a prefered buy: 2021_turbo_varta_knockout_repayment.json', () => {
      const activities = traderepublic.parsePages(options[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Sell',
        date: '2021-02-05',
        datetime: '2021-02-05T' + activities[0].datetime.substring(11),
        isin: 'DE000TT5RSM5',
        company: 'HSBC Trinkaus & Burkhardt AG TurboC O.End Varta',
        shares: 500,
        price: 0.001,
        amount: 0.5,
        fee: 0,
        tax: -200.08,
      });
    });
  });

  describe('Validate all ignored statements', () => {
    test('All ignored statements return status 7 and no activities', () => {
      ignoredSamples.forEach(pages => {
        const result = traderepublic.parsePages(pages);
        expect(result.status).toEqual(7);
        expect(result.activities.length).toEqual(0);
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
