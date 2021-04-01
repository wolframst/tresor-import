import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
  findFirstSearchtermIndexInArray,
} from '@/helper';
import { findFirstRegexIndexInArray } from '../helper';

export const sbrokerIdentificationString = 'S Broker AG';

export const findISIN = text => {
  return text[text.indexOf('ISIN') + 1];
};

export const findCompany = text => {
  let company = text[text.findIndex(t => t.includes('ISIN')) - 1];
  if (company === 'Gattungsbezeichnung') {
    company = text[text.findIndex(t => t.includes('ISIN')) - 2];
  }
  if (company) return company;
};

export const findDateBuySell = text => {
  const lineNumber = text.findIndex(t => t.includes('Handelstag'));

  let date;
  if (text[lineNumber + 1].split('.').length === 3) {
    date = text[lineNumber + 1];
  } else if (text[lineNumber - 1].split('.').length === 3) {
    date = text[lineNumber - 1];
  } else {
    throw { text: 'Unknown date' };
  }
  return date;
};

export const findDateDividend = text => {
  return text[text.findIndex(t => t.includes('Zahltag')) + 1];
};

const findOrderTime = content => {
  // Extract the time after the line with Handelszeit which contains "17:33"
  const searchTerm = 'Handelszeit';
  const lineNumber = content.findIndex(t => t.includes(searchTerm));

  if (lineNumber < 0) {
    return undefined;
  }

  const lineContentFormatNew = content[lineNumber + 1].trim();
  if (timeRegex(false).test(lineContentFormatNew)) {
    return lineContentFormatNew;
  }

  const lineContentFormatOld = content[lineNumber - 1].trim();
  if (timeRegex(false).test(lineContentFormatOld)) {
    return lineContentFormatOld;
  }

  return undefined;
};

export const findShares = textArr => {
  const sharesLine = textArr[textArr.findIndex(t => t.includes('STK'))];
  return parseGermanNum(sharesLine.split(' ')[1]);
};

export const findPrice = (text, fxRate = undefined) => {
  const priceLine = text[text.findIndex(t => t.includes('Kurs')) + 1];
  const price = parseGermanNum(priceLine.split(' ')[1]);

  return fxRate === undefined ? price : +Big(price).div(fxRate);
};

export const findAmount = (text, fxRate = undefined) => {
  let amountIdx = text.findIndex(t => t.includes('Kurswert'));
  if (amountIdx < 0) {
    amountIdx = text.findIndex(t => t.includes('Bezugspreis'));
  }
  let amount = parseGermanNum(text[amountIdx + 2]);
  return fxRate === undefined ? amount : +Big(amount).div(fxRate);
};

export const findFee = (content, fxRate = undefined) => {
  let fee = Big(0);
  const potentialFees = [
    'Orderentgelt',
    'Fremde Spesen',
    'Börsengebühr',
    'Fremdspesen',
    'Handelsplatzgebühr',
    'Orderprovision',
    'Provision',
    'Maklercourtage',
    'Fremde Spesen Xontro',
    'Gebühr',
  ];
  potentialFees.forEach(feeString => {
    const feeIdx = content.indexOf(feeString);
    if (feeIdx >= 0) {
      fee = fee.plus(Big(parseGermanNum(content[feeIdx + 2])));
    }
  });
  return fxRate === undefined ? +fee : +fee.div(fxRate);
};

const findTax = text => {
  let totalTax = Big(0);
  let lastTaxIndex = getLastTaxIx(text);

  if (lastTaxIndex === undefined) {
    totalTax = totalTax.plus(getSellTax(text));
  }

  while (lastTaxIndex !== undefined) {
    const lineParsedAmount = Math.abs(parseGermanNum(text[lastTaxIndex + 2]));
    totalTax = totalTax.plus(Big(lineParsedAmount));
    lastTaxIndex += 3;

    if (
      !text[lastTaxIndex].startsWith('einbehaltene ') &&
      !text[lastTaxIndex].startsWith('einbehaltener ')
    ) {
      break;
    }
  }
  const sourceTaxIndex = text.findIndex(t => t.includes('davon anrechenbare'));
  if (sourceTaxIndex > -1) {
    totalTax = totalTax.plus(parseGermanNum(text[sourceTaxIndex + 2]));
  }

  totalTax = totalTax.plus(getWithholdingTax(text));

  return +totalTax;
};

const getLastTaxIx = text => {
  let taxLineNumber = text.findIndex(t => t.startsWith('einbehaltene '));
  if (taxLineNumber > 0) return taxLineNumber;

  taxLineNumber = text.findIndex(t => t.startsWith('einbehaltener '));
  if (taxLineNumber > 0) return taxLineNumber;

  return undefined;
};

const getSellTax = text => {
  let tax = Big(0);
  const taxLineNumber = text.findIndex(t =>
    t.startsWith('Kapitalertragsteuer')
  );
  if (taxLineNumber >= 0) {
    tax = tax.plus(parseGermanNum(text[taxLineNumber + 2]));
  }

  const solidarityTaxLineNumber = text.findIndex(t =>
    t.startsWith('Solidaritätszuschlag')
  );
  if (solidarityTaxLineNumber >= 0) {
    tax = tax.plus(parseGermanNum(text[solidarityTaxLineNumber + 2]));
  }
  return tax;
};

const getWithholdingTax = text => {
  const withholdingTaxFondInputIdx = text.indexOf(
    'anrechenbare Quellensteuer Fondseingangsseite'
  );
  if (withholdingTaxFondInputIdx < 0) return 0;
  return parseGermanNum(text[withholdingTaxFondInputIdx + 2]);
};

const findGrossPayout = (text, tax) => {
  const netPayoutIdx = text.findIndex(t =>
    t.includes('Betrag zu Ihren Gunsten')
  );
  if (netPayoutIdx >= 0) {
    return +Big(parseGermanNum(text[netPayoutIdx + 2])).plus(tax);
  }
  const reinvestIdx = text.indexOf('Thesaurierung brutto');
  if (reinvestIdx >= 0) {
    return parseGermanNum(text[reinvestIdx + 2]);
  }
  const foreignDividend = text.indexOf('ausländische Dividende');
  if (foreignDividend >= 0) {
    return parseGermanNum(text[foreignDividend + 2]);
  }
};

const findForeignInformation = pdfPage => {
  const foreignCurrencyIdx = pdfPage.indexOf('Devisenkurs') + 1;
  if (foreignCurrencyIdx > 0) {
    const fxRate = parseGermanNum(pdfPage[foreignCurrencyIdx].split(/\s+/)[1]);
    const foreignCurrency = pdfPage[foreignCurrencyIdx]
      .split(/\s+/)[0]
      .split(/\//)[1];
    return [foreignCurrency, fxRate];
  }
  return [undefined, undefined];
};

export const canParseDocument = (pages, extension) => {
  const allPagesFlat = pages.flat();

  return (
    extension === 'pdf' &&
    allPagesFlat.some(line => line.includes(sbrokerIdentificationString))
  );
};

export const isBuy = content =>
  content.some(line => line.includes('Wir haben für Sie gekauft'));

export const isSell = content =>
  content.some(line => line.includes('Wir haben für Sie verkauft'));

export const isDividend = content =>
  content.some(line => line.includes('Erträgnisgutschrift')) ||
  content.some(line => line.includes('Dividendengutschrift'));

const isAccountStatement = content =>
  content.some(line => line.toLowerCase().startsWith('kontoauszug nr. '));

const canParsePage = content =>
  isBuy(content) || isSell(content) || isDividend(content);

const isOverviewPage = content =>
  content.some(line => line.includes('Depotübersicht Wertpapiere'));

const detectedButIgnoredDocument = content => {
  return (
    // When the document contains one of the following lines, we want to ignore these document.
    content.some(
      line =>
        line.includes('Kostenausweis') ||
        line === 'Storno - Erträgnisgutschrift' ||
        line.startsWith('Stornierung und ')
    )
  );
};

const parseOverview = content => {
  let activities = [];

  for (
    let tableStartLine = content.findIndex(line =>
      line.includes('Aktueller Wert')
    );
    tableStartLine < content.length;
    tableStartLine += 16
  ) {
    const shares = content[tableStartLine + 1].trim();
    if (shares === '/') {
      // The last two lines don't contains securities and are marked with /. We can leave the loop here.
      break;
    }

    const [parsedDate, parsedDateTime] = createActivityDateTime(
      content[tableStartLine + 5],
      content[tableStartLine + 6],
      'dd.MM.yyyy',
      'dd.MM.yyyy HH:mm:ss'
    );

    const activity = validateActivity(
      {
        broker: 'sbroker',
        type: 'TransferIn',
        date: parsedDate,
        datetime: parsedDateTime,
        wkn: content[tableStartLine + 3].split('/')[0].trim(),
        isin: content[tableStartLine + 3].split('/')[1].trim(),
        company: content[tableStartLine + 2],
        shares: parseGermanNum(shares),
        price: parseGermanNum(content[tableStartLine + 9].split(' ')[0]),
        amount: parseGermanNum(content[tableStartLine + 10].split(' ')[0]),
        fee: 0,
        tax: 0,
      },
      true
    );

    if (activity === undefined) {
      continue;
    }

    activities.push(activity);
  }

  return activities;
};

const parseAccountStatement = pdfPages => {
  const searchTerms = [
    'Wertpapierkauf',
    'Wertpapierverkauf',
    'Zinsen/Dividenden',
  ];
  const yearLine = pdfPages[
    pdfPages.findIndex(line =>
      line.toLowerCase().startsWith('kontoauszug nr. ')
    )
  ].split('.');
  const year = yearLine[yearLine.length - 1];
  let idx = findFirstSearchtermIndexInArray(pdfPages, searchTerms);
  let activities = [];
  while (idx >= 0) {
    const isinIdx = findFirstRegexIndexInArray(
      pdfPages,
      /^ISIN: [A-Z]{2}[0-9A-Z]{9}[0-9]$/,
      idx
    );
    const sharesIdx = findFirstRegexIndexInArray(pdfPages, /^STK: [1-9]+/, idx);
    const companyIdx = pdfPages[idx + 1].startsWith('ABR: ')
      ? idx + 4
      : idx + 1;
    let activity = {
      broker: 'sbroker',
      company: pdfPages[companyIdx],
      isin: pdfPages[isinIdx].split(/\s+/)[1],
      shares: parseGermanNum(pdfPages[sharesIdx].split(/\s+/)[1]),
      amount: Math.abs(parseGermanNum(pdfPages[idx - 1])),
      tax: 0,
      fee: 0,
    };
    activity.price = +Big(activity.amount).div(activity.shares);
    [activity.date, activity.datetime] = createActivityDateTime(
      pdfPages[idx - 3] + year
    );

    switch (pdfPages[idx]) {
      case searchTerms[0]:
        activity.type = 'Buy';
        break;
      case searchTerms[1]:
        activity.type = 'Sell';
        break;
      case searchTerms[2]:
        activity.type = 'Dividend';
        break;
    }
    activity = validateActivity(activity);
    if (activity !== undefined) {
      activities.push(activity);
      idx = findFirstSearchtermIndexInArray(pdfPages, searchTerms, idx + 1);
    } else {
      return undefined;
    }
  }
  return activities;
};

const parseSingleTransaction = pdfPage => {
  let activity = {
    broker: 'sbroker',
    isin: findISIN(pdfPage),
    company: findCompany(pdfPage),
    shares: findShares(pdfPage),
  };
  const [foreignCurrency, fxRate] = findForeignInformation(pdfPage);
  if (foreignCurrency !== undefined && fxRate !== undefined) {
    activity.foreignCurrency = foreignCurrency;
    activity.fxRate = fxRate;
  }

  if (isBuy(pdfPage)) {
    activity.type = 'Buy';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateBuySell(pdfPage),
      findOrderTime(pdfPage)
    );
    activity.amount = findAmount(pdfPage, activity.fxRate);
    activity.fee = findFee(pdfPage, activity.fxRate);
    activity.tax = 0.0;
    activity.price = findPrice(pdfPage, activity.fxRate);
  } else if (isSell(pdfPage)) {
    activity.type = 'Sell';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateBuySell(pdfPage),
      findOrderTime(pdfPage)
    );
    activity.amount = findAmount(pdfPage, activity.fxRate);
    activity.fee = findFee(pdfPage, activity.fxRate);
    activity.tax = findTax(pdfPage);
    activity.price = findPrice(pdfPage, activity.fxRate);
  } else if (isDividend(pdfPage)) {
    activity.type = 'Dividend';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateDividend(pdfPage),
      undefined
    );
    activity.fee = 0;
    activity.tax = findTax(pdfPage);
    activity.amount = findGrossPayout(pdfPage, activity.tax);
    activity.price = +Big(activity.amount).div(activity.shares);
  }
  return validateActivity(activity);
};

export const parsePages = pdfPages => {
  let activities = [];
  if (detectedButIgnoredDocument(pdfPages[0])) {
    // We know this type and we don't want to support it.
    return {
      activities,
      status: 7,
    };
  }

  const allPagesFlat = pdfPages.flat();
  if (isAccountStatement(allPagesFlat)) {
    activities = parseAccountStatement(allPagesFlat);
  } else if (isOverviewPage(allPagesFlat)) {
    activities = parseOverview(allPagesFlat);
  } else {
    for (let content of pdfPages) {
      if (canParsePage(content)) {
        activities.push(parseSingleTransaction(content));
      }
    }
  }

  // No valid activities were found
  if (activities.length === 0) {
    return {
      activities,
      status: 5,
    };
  }

  return {
    activities,
    status: activities === undefined ? 3 : 0,
  };
};
