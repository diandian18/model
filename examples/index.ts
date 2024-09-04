import { Model, INITIAL_STATE, Persist, persist } from '../dist-lib';

export class InitialState extends INITIAL_STATE {
  @persist
  num: number | string = 0;
  @persist
  map: Map<string, string> = new Map();
}

const initialState = new InitialState();

@Persist()
class BaseModel extends Model<InitialState> {
  constructor(initialState: InitialState) {
    super(initialState);
  }

  public async init() {
    console.log('init');
  }
  public destroy() {
    this.setState(initialState);
  }

  setNum = (num: number | string) => {
    this.setState({ num });
  };
  setMap = () => {
    this.setState({
      map: this.state.map.set('aaa', 'xxxx'),
    });
  }
}

const baseModel = new BaseModel(initialState);

export default baseModel;

// Test in dom
const divDom = document.createElement('button');
divDom.innerText = `Click me! ${baseModel.state.num}`;
divDom.onclick = function() {
  const val = (Math.random() * 100).toFixed(0);
  baseModel.setNum(val);
  divDom.innerText = `Click me! ${val}`;
};
document.body.appendChild(divDom);

const refreshDom = document.createElement('button');
refreshDom.innerText = 'Reload page, number will be stored';
refreshDom.onclick = function() {
  location.reload();
}
const wrapDiv = document.createElement('div');
wrapDiv.appendChild(refreshDom);
document.body.appendChild(wrapDiv);
