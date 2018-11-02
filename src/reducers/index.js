import _ from "lodash";
import {
  CODE_CHANGED,
  CURRENT_SCOPE_UPDATED,
  NEXT_STEP_DECIDED,
  OPERATION_TYPE_UPDATED,
  INTERPRETER_RUNNING,
  INTERPRETER_STOPPED,
  RUNNING_SPEED_CHANGED,
  INTERPRETER_STATE_RESET,
  CODE_SHARED,
  INFO_MODAL_OPENED,
  MODAL_CLOSED,
} from "../constants/actionTypes";

export const initialState = {
  code: "// enter your code",
  scopeHistory: [],
  currentScope: {},
  hasNextStep: true,
  operationType: "",
  isRunning: false,
  runningSpeed: 100,
  sharedCodeId: "",
};

const reducer = (state = initialState, action) => {
  const newScopeHistory = _.cloneDeep(state.scopeHistory);
  const newCurrentScope = _.cloneDeep(action.currentScope);
  switch (action.type) {
    case CODE_SHARED:
      return Object.assign({}, state, {
        sharedCodeId: action.sharedCodeId,
      });
    case CODE_CHANGED:
      return Object.assign({}, state, {
        code: action.code,
      });
    case CURRENT_SCOPE_UPDATED:
      // const newCurrentScope = _.cloneDeep(action.currentScope);
      if (Object.keys(action.currentScope).length) {
        _.forOwn(action.currentScope, (propBody, propName) => {
          if (state.currentScope[propName] && state.currentScope[propName].value !== propBody.value) {
            newCurrentScope[propName].highlight = true;
          } else {
            newCurrentScope[propName].highlight = false;
          }
        });
      }

      if (!Object.keys(state.currentScope).length || (state.currentScope.scopeName && state.currentScope.scopeName.value === action.currentScope.scopeName.value)) {
        return Object.assign({}, state, {
          currentScope: _.assign({}, newCurrentScope),
        });
      } else if (
        state.scopeHistory.length && state.scopeHistory[state.scopeHistory.length - 1].scopeName.value ===
          action.currentScope.scopeName.value
      ) {
        newScopeHistory.pop();
        return Object.assign({}, state, {
          scopeHistory: [...newScopeHistory],
          currentScope: _.assign({}, newCurrentScope),
        });
      } else {
        return Object.assign({}, state, {
          scopeHistory: [...state.scopeHistory, state.currentScope],
          currentScope: _.assign({}, newCurrentScope),
        });
      }
    case NEXT_STEP_DECIDED:
      return Object.assign({}, state, {
        hasNextStep: action.hasNextStep,
      });
    case OPERATION_TYPE_UPDATED:
      return Object.assign({}, state, {
        operationType: action.operationType,
      });
    case INTERPRETER_RUNNING:
      return Object.assign({}, state, {
        isRunning: action.isRunning,
      });
    case INTERPRETER_STOPPED:
      return Object.assign({}, state, {
        isRunning: action.isRunning,
      });
    case RUNNING_SPEED_CHANGED:
      return Object.assign({}, state, {
        runningSpeed: action.runningSpeed,
      });
    case INTERPRETER_STATE_RESET:
      return Object.assign({}, state, {
        scopeHistory: action.scopeHistory,
        currentScope: action.currentScope,
        hasNextStep: action.hasNextStep,
        operationType: action.operationType,
        isRunning: action.isRunning,
      });
    case INFO_MODAL_OPENED:
      return Object.assign({}, state, {
        isModalActive: action.isModalActive,
        sharedCodeId: action.sharedCodeId,
      });
    case MODAL_CLOSED:
      return Object.assign({}, state, {
        isModalActive: action.isModalActive,
        sharedCodeId: action.sharedCodeId,
      });
    default:
      return state;
  }
};

export default reducer;
