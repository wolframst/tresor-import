import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';
// This broker also handles scalable capital

const volksbankIdentificationString = 'Volksbank';

const isPageTypeBuy = content =>
  content.some(line => line.includes('Wertpapier Abrechnung Kauf'));

const isPageTypeSell = content =>
  content.some(line => line.includes('Wertpapier Abrechnung Verkauf'));

const isPageTypeDividend = content =>
  content.some(line => line.includes('Dividendengutschrift'));

const findOrderDate = content => {
  const dateTime =
    content[findLineNumberByContent(content, 'Schlusstag/-Zeit') + 1];
  return dateTime ? dateTime.substring(0, 10) : undefined;
};

const findOrderTime = content => {
  const dateTime =
    content[findLineNumberByContent(content, 'Schlusstag/-Zeit') + 1];
  return dateTime ? dateTime.substring(11) : undefined;
};

const findPayDate = content => {
  return content[findLineNumberByContent(content, 'Zahlbarkeitstag') + 1];
};

const findByStartingTerm = (content, term) => {
  const ix = content.findIndex(line => line.startsWith(term));
  return ix > -1
    ? content[content.findIndex(line => line.startsWith(term))].substring(
        term.length
      )
    : undefined;
};

const findLineNumberByContent = (content, term, contains = true) =>
  content.findIndex(line => (contains ? line.includes(term) : line === term));

const findLineNumberByContentStartsWith = (content, term) =>
  content.findIndex(line => line.startsWith(term));

const findISIN = content => {
  return content[findLineNumberByContent(content, 'ISIN') + 5];
};

const findCompany = (content, isDividend) => {
  let startLineNumber;
  let endLineNumber;
  startLineNumber =
    findLineNumberByContent(content, 'Wertpapierbezeichnung') + 4;
  endLineNumber = isDividend
    ? findLineNumberByContent(content, 'Zahlbarkeitstag') - 2
    : findLineNumberByContent(content, 'Handels-/Ausführungsplatz') - 3;

  return startLineNumber + 1 <= endLineNumber
    ? content[startLineNumber] + ' ' + content[startLineNumber + 1]
    : content[startLineNumber];
};

const findShares = content => {
  const lots = findByStartingTerm(content, 'Stück ');
  return parseGermanNum(lots);
};

const findAmount = (content, isDividend) => {
  if (isDividend) {
    return parseGermanNum(
      content[content.lastIndexOf('Dividendengutschrift') + 1]
    );
  }
  return parseGermanNum(content[content.indexOf('Kurswert') + 1]);
};

const findPricePerShare = (content, isDividend) => {
  const lineNumber = isDividend
    ? findLineNumberByContent(content, 'Dividende pro Stück') + 1
    : findLineNumberByContent(content, 'Ausführungskurs') + 1;

  const pricePerShareValue = content[lineNumber];
  const pricePerShare = isDividend
    ? pricePerShareValue.trim()
    : pricePerShareValue.split(' ')[0].trim();

  return parseGermanNum(pricePerShare);
};

const findCurrency = (content, isDividend) => {
  const lineNumber = isDividend
    ? findLineNumberByContent(content, 'Dividende pro Stück') + 1
    : findLineNumberByContent(content, 'Ausführungskurs') + 1;
  const pricePerShareValue = content[lineNumber];

  return isDividend
    ? content[lineNumber + 1]
    : pricePerShareValue.split(' ')[1].trim();
};

const findExchangeRate = (content, currency) => {
  // Find the value of "EUR / USD 1,1869" by searching for "EUR/USD"
  const searchTerm = 'EUR / ' + currency;
  const exchangeRateValue = findByStartingTerm(content, searchTerm);

  return exchangeRateValue ? Big(parseGermanNum(exchangeRateValue)) : Big(1);
};

const findFee = content => {
  var totalFee = Big(0);

  const commission =
    findLineNumberByContent(content, 'Provision') !== -1
      ? content[findLineNumberByContent(content, 'Provision') + 2]
      : undefined;

  if (commission) {
    totalFee = totalFee.plus(parseGermanNum(commission.split(' ')[0].trim()));
  }

  const transferFee =
    findLineNumberByContent(content, 'Übertragungs-/Liefergebühr') !== -1
      ? content[
          findLineNumberByContent(content, 'Übertragungs-/Liefergebühr') + 1
        ]
      : undefined;

  if (transferFee) {
    totalFee = totalFee.plus(parseGermanNum(transferFee.split(' ')[0].trim()));
  }

  return +totalFee;
};

const findTax = content => {
  var totalTax = Big(0);

  const lineWithTax = findLineNumberByContentStartsWith(
    content,
    'Kapitalertragsteuer '
  );
  if (lineWithTax > -1) {
    totalTax = totalTax.plus(
      Big(parseGermanNum(content[lineWithTax + 1].split(' ')[0]))
    );
  }

  const lineWithChurchTax = findLineNumberByContentStartsWith(
    content,
    'Kirchensteuer'
  );
  if (lineWithChurchTax > -1) {
    totalTax = totalTax.plus(
      Big(parseGermanNum(content[lineWithChurchTax + 1].split(' ')[0]))
    );
  }

  const lineWithSolidarityTax = findLineNumberByContentStartsWith(
    content,
    'Solidaritätszuschlag'
  );
  if (lineWithSolidarityTax > -1) {
    totalTax = totalTax.plus(
      Big(parseGermanNum(content[lineWithSolidarityTax + 1].split(' ')[0]))
    );
  }

  const lineWithWithholdingTax = findLineNumberByContent(
    content,
    'Einbehaltene Quellensteuer'
  );
  if (lineWithWithholdingTax > -1) {
    totalTax = totalTax.plus(
      Big(parseGermanNum(content[lineWithWithholdingTax + 1].split(' ')[0]))
    );
  }

  return totalTax;
};

const canParsePage = content =>
  isPageTypeBuy(content) ||
  isPageTypeSell(content) ||
  isPageTypeDividend(content);

const isVolksbank = content => {
  if (content.length < 4) return false;
  for (let i = 0; i < 4; i++) {
    if (content[i].includes(volksbankIdentificationString)) return true;
  }
  return false;
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    isVolksbank(firstPageContent) &&
    canParsePage(firstPageContent)
  );
};

const parsePage = content => {
  let type,
    date,
    time,
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
    currency,
    fxRate;

  if (
    !isPageTypeBuy(content) &&
    !isPageTypeSell(content) &&
    !isPageTypeDividend(content)
  ) {
    console.error('Unknown page type for Volksbank');
    return undefined;
  }

  const isDividend = isPageTypeDividend(content);

  isin = findISIN(content);
  company = findCompany(content, isDividend);
  shares = findShares(content);
  currency = findCurrency(content, isDividend);
  fxRate = findExchangeRate(content, currency);
  tax = findTax(content).times(fxRate);
  amount = findAmount(content, isDividend);
  price = findPricePerShare(content, isDividend);
  fee = isDividend ? 0 : findFee(content);

  if (isPageTypeBuy(content)) {
    type = 'Buy';
    date = findOrderDate(content);
    time = findOrderTime(content);
  }
  if (isPageTypeSell(content)) {
    type = 'Sell';
    date = findOrderDate(content);
    time = findOrderTime(content);
  }
  if (isPageTypeDividend(content)) {
    type = 'Dividend';
    date = findPayDate(content);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  return validateActivity({
    broker: 'volksbank',
    type,
    date: parsedDate,
    datetime: parsedDateTime,
    isin,
    company,
    shares,
    price,
    currency,
    fxRate: +fxRate,
    amount,
    fee,
    tax: +tax,
  });
};

export const parsePages = contents => {
  let activities = [];
  const content = contents.flat();

  if (canParsePage(content)) {
    activities.push(parsePage(content));
  }

  return {
    activities,
    status: 0,
  };
};
