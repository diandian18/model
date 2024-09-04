import { BehaviorSubject, pairwise } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { produce, immerable } from 'immer';
import Events from '@zhangsai/events';
import type { Observable } from 'rxjs';

const assignImmerly = produce((base, target) => {
  return { ...base, ...target };
});

export class State<T> extends Events {
  protected _state$: BehaviorSubject<T>;
  constructor(initialState: T) {
    super();
    this._state$ = new BehaviorSubject(initialState);
  }
  watch = (key: keyof T, reaction: (newState: T[keyof T], oldState: T[keyof T]) => void) => {
    this._state$
      .pipe(
        distinctUntilChanged((prev, curr) => {
          return prev[key] === curr[key];
        }),
        pairwise(),
      )
      .subscribe(([oldState, newState]) => {
        reaction(newState[key], oldState[key]);
      });
  };
  get state() {
    return this._getState();
  }
  _getState(): T {
    return this._state$.value;
  }
  _selectState<V>(selectFn: ((state: T) => V)): Observable<V> {
    return this._state$.pipe(map(selectFn), distinctUntilChanged());
  }
  _getModelState<S, K extends keyof S>(model: Model<S>, key: K): {
    state: S[K];
    state$: Observable<S[K]>;
  };
  _getModelState<M, S, K extends keyof S>(model: Model<S>, key: K, format?: (v: S[K]) => M): {
    state: M;
    state$: Observable<M>;
  };
  _getModelState<M, S, K extends keyof S>(model: Model<S>, key: K, format?: (v: S[K]) => M) {
    if (format) {
      const state = format(model._getState()[key]);
      const state$ = model._selectState(_state => format(_state[key]));
      return {
        state,
        state$,
      };
    } else {
      return {
        state: model._getState()[key],
        state$: model._selectState(_state => _state[key]),
      };
    }
  }
  protected setState(state: Partial<T> | ((draft: T) => void)) {
    const oldState = this._getState();
    const newState = typeof state === 'function' ?
      produce(oldState, state) :
      assignImmerly(oldState, state);
    this._state$.next(newState);
    return newState;
  }
}

export abstract class Model<T> extends State<T> {
  abstract init(state?: any, ...rest: any[]): void;
  abstract destroy(param: unknown): void;
}

export function modelStateGetter<S, K extends keyof S>(model: Model<S>, key: K): () => {
  state: S[K];
  state$: Observable<S[K]>;
}

export function modelStateGetter<M, S, K extends keyof S>(model: Model<S>, key: K, format?: (v: S[K]) => M): () => {
  state: M;
  state$: Observable<M>;
}

export function modelStateGetter<M, S, K extends keyof S>(model: Model<S>, key: K, format?: (v: S[K]) => M) {
  return () => model._getModelState(model, key, format);
}

export class INITIAL_STATE {
  [immerable] = true as const;
}
