import { useState, useEffect } from 'react';
import type { Observable } from 'rxjs';
import type { Model } from './model';

export function useModelState<T>(getState: () => {
  state: T;
  state$: Observable<T>;
}) {
  if (typeof getState === 'undefined') {
    throw new Error('Param is undefined');
  }
  const [state, setState] = useState(() => {
    const { state: _state } = getState();
    return _state;
  });
  useEffect(() => {
    const { state$ } = getState();
    const subscription = state$
      .subscribe((v) => {
        setState(v);
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [getState]);

  return state;
}

export function useModel<T, M extends keyof T>(
  model: Model<T>,
  key: M,
) {
  const [state, setState] = useState(() => {
    return model._getState()[key];
  });
  useEffect(() => {
    if (!model) {
      return;
    }
    const subscription = model
      ._selectState(_state => _state[key])
      .subscribe((v) => {
        setState(v);
      });
    return () => {
      subscription.unsubscribe();
    };
  }, [model, key]);

  return state;
}

