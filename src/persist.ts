import ls from 'store2';

const keypPrefix = 'persist';

function getKey(key: string, { prefix, className }: { prefix?: string; className?: string }) {
  return `${prefix ?? keypPrefix}_${className ? className + '_' : ''}${key}`;
}

export interface Consturctor {
  className?: string;
  new (...args: any[]): any;
}

export interface PersistParams {
  prefix?: string;
}

export function Persist<
  T extends {
    persists?: string[];
    formats?: Record<string, (persistInitialState: T) => T>;
    [key: string]: any;
  },
>(params?: PersistParams) {
  return (BaseClass: Consturctor): typeof BaseClass => {
    const { prefix } = params ?? {};
    const DerivedClass = class extends BaseClass {
      persists: string[] =  [];
      constructor(initialState: T) {
        let persistInitialState = {
          ...initialState,
        };
        initialState.persists?.forEach(key => {
          let value = ls.get(getKey(key, {
            prefix,
            className: BaseClass.className,
          }));
          if (Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2)) {
            value = new Map(value);
          }
          persistInitialState = Object.assign(persistInitialState, {
            [key]: value ?? initialState[key],
          });
          // persistInitialState[key] = value ?? initialState[key];
        });
        Object.keys(initialState.formats ?? {}).forEach(key => {
          persistInitialState = Object.assign(persistInitialState, {
            [key]: initialState.formats?.[key](persistInitialState),
          });
          // persistInitialState[key] = initialState.formats[key](persistInitialState);
        });
        super(persistInitialState);
        this.persists = initialState.persists ?? [];
      }
      setState(state: Partial<T> | ((draft: T) => void)) {
        const newState = super.setState(state);
        Object.keys(newState).forEach(key => {
          if (this.persists.includes(key)) {
            let value = newState[key];
            if (value instanceof Map) {
              value = [...newState[key]];
            }
            ls.set(getKey(key, {
              prefix,
              className: BaseClass.className,
            }), value);
          }
        });
      }
    };
    return DerivedClass;
  }
}

export function persist<T>(targetClassPrototype: T & { persists?: string[] }, attrname: string) {
  if (targetClassPrototype.persists) {
    targetClassPrototype.persists.push(attrname)
  } else {
    targetClassPrototype.persists = [attrname];
  }
}

export function format<T extends Record<string, any> & { persists?: string[]; formats?: Record<string, (persistInitialState: T) => T[keyof T]> }>(cb: (persistInitialState: T) => T[keyof T]) {
  return (targetClassPrototype: T, attrname: string) => {
    if (targetClassPrototype.formats) {
      targetClassPrototype.formats[attrname] = cb;
    } else {
      targetClassPrototype.formats = {
        [attrname]: cb,
      };
    }
  };
}
