import { html } from 'lit-html/lib/lit-extended';
import { repeat } from 'lit-html/lib/repeat';
import { fromEvent, merge } from 'rxjs';
import { debounceTime, map, scan } from 'rxjs/operators';

import { litObservable } from '..';

// observable for 'loaded' event
const loadedObservable = fromEvent(document, 'loaded-accounts')
  .pipe(map(i => i.detail.accounts));

// enrichments
const enrichmentsObservable = fromEvent(document, 'enrichment')
  .pipe(map(i => [i.detail.enrichment]));

// combine both into one observable
const combined = merge(loadedObservable, enrichmentsObservable)
  // merge enrichments with accounts
  .pipe(
    scan((sum, items) => {
      for (let i of items) {
        // look for existing in sum
        const idx = sum.findIndex(ex => i.id === ex.id);

        if (idx === -1) {
          // add to sum
          sum = sum.concat(i);
          continue;
        }

        const existing = sum[idx];
        sum = sum.slice();

        // if existing is older, update it's balance
        if (existing.fetchedTime < i.fetchedTime) {
          // existing.fetchedTime = i.fetchedTime;
          // existing.balance = i.balance;
          sum[idx] = Object.assign({}, existing, i);
        } else if (i.name) {
          // if existing is newer, and incoming has a name, update existing name
          sum[idx] = Object.assign({}, existing, { name: i.name });
        }
      }
      return sum;
    }, []),
    // enrichment events can be rapid, debounce so we don't overwhelm the browser
    debounceTime(500)
  );

const Account = ({id, balance, name}) => html`
  <li>id:${id} name:${name} balance:${balance}</li>
`;

const AccountList = (items = []) => items.length === 0 ?
  html`<p>No accounts</p>` :
  html`
    <ul>
      ${repeat(items, i => i.id, Account)}
    </ul>
  `;

function dispatchLoadedAccounts() {
  document.dispatchEvent(new CustomEvent('loaded-accounts', {
    detail: {
      accounts: [
        {id:1, name:'foo', balance:1.00, fetchedTime:2},
        {id:2, name:'bar', balance:3.00, fetchedTime:2},
      ]
    }
  }));
}

function dispatchEnrichment() {
  document.dispatchEvent(new CustomEvent('enrichment', {
    detail: {
      enrichment: {id:1, fetchedTime:3, balance: 4.00}
    }
  }));
}

const AccountsApp = ({ accounts }) => html`
  <button type="button"
    on-click=${dispatchLoadedAccounts}>load accounts</button>
  <button type="button"
    on-click=${dispatchEnrichment}>add enrichment</button>
  ${AccountList(accounts)}
`;

customElements.define('accounts-app',
  litObservable(
    combined,
    s => ({ accounts: s }),
  )(AccountsApp));
