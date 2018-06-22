# lit-observable

A proof-of-concept for creating custom elements from lit-html templates and
RxJS observables.

# API

## `litObservable(observable, mapStateToProps)(render)`

Returns a custom element that will render into its shadow DOM the result of the
given `render` function. Each time the observable emits a value, the value will
be passed to `mapStateToProps` and the result passed to `render`.

### Example

```js
const countUp$ = Rx.Observable.interval(1000);
const render = ({ count, isEven }) => html`
  <p>Count: ${count} (${isEven ? 'even' : 'odd'})</p>
`;

const CountUpElement = litObservable(
  countUp$,
  n => ({ count: n, isEven: n % 2 === 0 })
)(render);

customElements.define('count-up', CountUpElement);
```

# Demo

```sh
$ yarn
$ yarn start
```
