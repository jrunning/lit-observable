import { html } from 'lit-html/lib/lit-extended';
import { repeat } from 'lit-html/lib/repeat';
import { merge, Subject } from 'rxjs';
import { debounceTime, scan, tap } from 'rxjs/operators';

import { litObservable } from '..';

const log = tag => (...args) => console.log(tag, ...args);
const tapLog = tap(log('tap'));

const loaded$ = new Subject();
const enrichments$ = new Subject();

// combine both into one observable
const combined$ = merge(loaded$, enrichments$)
  // merge enrichments with accounts
  .pipe(
    scan((accts, items) => {
      for (let item of items) {
        // look for existing in accts
        const idx = accts.findIndex(ex => item.id === ex.id);
        if (idx === -1) {
          // add to accts
          accts = accts.concat(item);
          continue;
        }

        const existing = accts[idx];
        accts = accts.slice();

        // if existing is older, update its balance
        if (existing.fetchedTime < item.fetchedTime) {
          // existing.fetchedTime = item.fetchedTime;
          // existing.balance = item.balance;
          accts[idx] = Object.assign({}, existing, item);
        } else if (item.name) {
          // if existing is newer, and incoming has a name, update existing name
          accts[idx] = Object.assign({}, existing, { name: item.name });
        }
      }
      return accts;
    }, []),
    // enrichment events can be rapid, debounce so we don't overwhelm the browser
    debounceTime(500),
    tapLog
  );

const Account = ({id, balance, name}) => html`
  <tr>
    <td>${id}</td>
    <td>${name}</td>
    <td>${balance}</td>
  </tr>
`;

const AccountList = (items = []) => {
  if (items.length > 0) {
    return html`<table>
      <thead>
        <th>id</th>
        <th>name</th>
        <th>balance</th>
      </thead>
      <tbody>
        ${repeat(items, i => i.id, Account)}
      </tbody>
    </table>`;
  }
  return html`<p>No accounts</p>`;
}

const ACCOUNTS = [
  {id: 1, name: 'foo', balance: 1.00, fetchedTime: 2},
  {id: 2, name: 'bar', balance: 3.00, fetchedTime: 2},
];

const ENRICHMENT = {id: 1, fetchedTime: 3, balance: 4.00};

const AccountsApp = ({ accounts }) => html`
  <button type="button"
    on-click=${() => loaded$.next(ACCOUNTS)}>
    Load accounts
  </button>
  <button type="button"
    on-click=${() => enrichments$.next([ENRICHMENT])}>
    Add enrichment
  </button>
  ${AccountList(accounts)}
`;

customElements.define('accounts-app',
  litObservable(
    combined$,
    state => ({ accounts: state }),
  )(AccountsApp));
