import { enableMapSet } from 'immer';

enableMapSet();

export {
  Model,
  State,
  modelStateGetter,
  INITIAL_STATE,
}
from './model';

export {
  Persist,
  persist,
  format,
} from './persist';

export {
  useModel,
  useModelState,
} from './hooks';
