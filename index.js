import { render } from 'lit-html/lib/lit-extended';

export function litObservable(observable, mapStateToProps = s => s) {
  return base => {
    let baseClass;
    if (base.prototype instanceof HTMLElement) {
      baseClass = base;
    } else {
      baseClass = class extends HTMLElement {
        render(props) {
          return base(props);
        }
      }
    }

    return class extends baseClass {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        if (mapStateToProps) {
          this.mapStateToProps = mapStateToProps;
        }
        this._update = this._update.bind(this);
      }

      connectedCallback() {
        if (super.connectedCallback) {
          super.connectedCallback();
        }
        this._subscriber = observable.subscribe(this._update);
        this._invalidate();
      }

      disconnectedCallback() {
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
        this._subscriber.unsubscribe();
      }

      mapStateToProps(state) {
        if (super.mapStateToProps) {
          return super.mapStateToProps(state);
        }
        return state;
      }

      _invalidate() {
        render(this.render(this), this.shadowRoot);
      }

      _update(state) {
        const nextProps = this.mapStateToProps(state);
        let changed = false;
        for (let [prop, val] of Object.entries(nextProps)) {
          if (val !== this[prop]) {
            this[prop] = val;
            changed = true;
          }
        }

        if (changed) {
          this._invalidate();
        }
      }
    };
  };
}
