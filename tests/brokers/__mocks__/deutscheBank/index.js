export const buySamples = [];

export const sellSamples = [];

export const dividendSamples = [
  require('./dividends/2020_agnc_invest.json'),
  require('./dividends/2020_johnson_johnson.json'),
  require('./dividends/2021-05-07-medistim.json'),
  require('./dividends/2021-05-10-allianz.json'),
  require('./dividends/2021-05-06-x-trackers-euro-stoxx-50.json'),
  require('./dividends/2021-02-22-ibb-kupon.json'),
  require('./dividends/2021-03-09-johnson-and-johnson.json'),
  require('./dividends/2021-03-08-novartis.json'),
  require('./dividends/2021-01-01-automatic-data.json'),
];

export const depotStatusSamples = [
  require('./depotStatus/2021_depot_status_standard.json'),
  require('./depotStatus/2021_depot_status_with_prices.json'),
];

export const transactionLogSamples = [
  require('./transactionLog/2020_buy_dividend_transaction_log.json'),
  require('./transactionLog/2019_sell_transaction_log.json'),
];

export const ignoredSamples = [
  require('./ignored/2020_unparsable_buy_operation.json'),
  require('./ignored/2020_unparsable_sell_operation.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  depotStatusSamples
);
