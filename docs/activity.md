Each created activity was validated through `validateActivity` before being returned from `getActivities`.
When an activity is invalid, `validateActivity` will return undefined instead of the activity.
Fields with an undefined value should not be added to the activity object, an activity with undefined fields is invalid.

| Field           | Description                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| broker          | The name of the broker which creates the statement.                                                                                                                                                                                                                    |
| type            | The type of the activity. Supported values are: `Buy`, `Sell` and `Dividend`.                                                                                                                                                                                          |
| date            | The activity date from the statement. Will be obsolete soon.                                                                                                                                                                                                           |
| datetime        | The datetime of the activity, parsed fromt he document. Only activities are supported, newer than 1990-01-01 and older than tomorrow. Must be in extended ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) and in timezone UTC. Please use the `createActivityDateTime` function. |
| isin            | The security ISIN when present. Must be present, when `wkn` is undefined.                                                                                                                                                                                              |
| wkn             | The security WKN (German) when present. Must be present, when `isin` is undefined.                                                                                                                                                                                     |
| company         | The security name.                                                                                                                                                                                                                                                     |
| shares          | The number of shares concerning this activity.                                                                                                                                                                                                                         |
| price           | The price of one share. `price * shares === amount` must match.                                                                                                                                                                                                        |
| amount          | The total amount concerning this activity. Learn more about whether to use the ([gross or net amount](amount.md)).                                                                                                                                                     |
| fee             | The total fee amount. When no fees applied set the field to `0`.                                                                                                                                                                                                       |
| tax             | The total tax amount. When no tax applied set the field to `0`. The withholding tax must be added here.                                                                                                                                                                |
| fxRate          | The exchange rate used for currency conversion. Only use when a conversion was applied.                                                                                                                                                                                |
| foreignCurrency | The foreign currency from which the currency was converted to the activity base currency. Use an [ISO 4217 code](https://en.wikipedia.org/wiki/ISO_4217#Active_codes), for example `USD`.                                                                              |