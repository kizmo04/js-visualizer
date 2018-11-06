import Interpreter from "./interpreter";
import _ from "lodash";
import TYPE from "../constants/parser";

const ignoreWindowProperties = [
  "window",
  "this",
  "NaN",
  "Infinity",
  "undefined",
  "self",
  "Function",
  "Object",
  "Array",
  "String",
  "Boolean",
  "Number",
  "Date",
  "RegExp",
  "Error",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
  "Math",
  "JSON",
  "eval",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "prompt",
  "alert",
  "console",
  "setTimeout",
];

function nodeToString(node) {
  switch (node.type) {
    case TYPE.BINARY_EXPRESSION:
      return `${nodeToString(node.left)} ${node.operator} ${nodeToString(
        node.right
      )}`;
    case TYPE.IDENTIFIER:
      return node.name;
    case TYPE.LITERAL:
      return typeof node.value === "string"
        ? node.value
        : node.value.toString();
    case TYPE.ARRAY_EXPRESSION:
      return `[${node.elements.map(node => parseNode(node))}]`;
    default:
      break;
  }
}

function parseNode(state) {
  const node = state.node;
  switch (node.type) {
    case TYPE.LITERAL:
      return node.value;
    case TYPE.ARRAY_EXPRESSION:
      return node.elements.map(node => parseNode(node));
    case TYPE.IDENTIFIER:
      return node.name;
    case TYPE.VARIABLE_DECLARATION:
      return {
        type: TYPE.CREATION,
        kind: node.kind,
        declarations: parseNode(node.declarations.map(node => parseNode(node)))
      };
    case TYPE.VARIABLE_DECLARATOR:
      return {
        type: TYPE.EXCUTION,
        initValue: node.init instanceof Node ? parseNode(node.init) : node.init,
        name: parseNode(node.id)
      };
    case TYPE.MEMBER_EXPRESSION:
      const key = `${nodeToString(node.object)}[${nodeToString(
        node.property
      )}]`;
      if (node.computed) {
        return {
          name: key,
          value: state.value
        };
      }
      return {
        name: key
      };
    case TYPE.BINARY_EXPRESSION:
      if (state["doneRight_"]) {
        const result = eval(
          `${state.leftValue_} ${node.operator} ${state.value}`
        );
        return {
          result,
          type: TYPE.EXCUTION,
          left: parseNode(node.left),
          right: parseNode(node.right),
          operator: node.operator,
          leftValue: state.leftValue_,
          rightValue: state.value
        };
      } else if (state["doneLeft_"]) {
        return {
          type: TYPE.EXCUTION,
          left: parseNode(node.left),
          right: parseNode(node.right),
          operator: node.operator,
          leftValue: state.value
        };
      }
      break;
    case TYPE.UPDATE_EXPRESSION:
      return {
        type: TYPE.EXCUTION_LOOP,
        argument: parseNode(node.argument),
        operator: node.operator,
        prefix: node.prefix
      };
    case TYPE.FOR_STATEMENT:
      if (state["mode_"] === 1) {
        //for 시작
      } else if (state["mode_"] === 2) {
        // test 로 분기 -> 종료혹은 body 실행
      } else if (state["mode_"] === 3) {
        // update 실행
      }
      return {
        type: TYPE.EXCUTION_LOOP_BEGIN,
        init: parseNode(node.init),
        test: parseNode(node.test),
        update: parseNode(node.update)
      };
    case TYPE.IF_STATEMENT || TYPE.CONDITIONAL_EXPRESSION:
      if (state["mode_"] === 1) {
        // 시작
      } else if (state["mode_"] === 2) {
      } else if (state["mode_"] === 3) {
      }
      return {
        type: TYPE.EXCUTION_IF,
        test: parseNode(node.test)
        // consequent,
      };
    case TYPE.BLOCK_STATEMENT:
      return {
        node
      };
    case TYPE.EXPRESSION_STATEMENT:
      if (node["done_"]) {
        return {
          type: TYPE.EXCUTION,
          done: true,
          value: node.value
        };
      } else {
        return {
          type: TYPE.EXCUTION,
          done: false
        };
      }
    case TYPE.ASSIGNMENT_EXPRESSION:
      if (node["doneRight_"]) {
        return {
          left: node.leftReference_[node.leftReference_.length - 1],
          value: node.value
        };
      } else if (node["nodeLeft_"]) {
      }
      break;
    default:
      break;
  }
}

export const initFunc = function(interpreter, scope) {
  interpreter.setProperty(
    scope,
    "prompt",
    interpreter.createNativeFunction((...rest) => {
      var result = window.prompt(...rest);
      return result;
    })
  );

  interpreter.setProperty(
    scope,
    "alert",
    interpreter.createNativeFunction((...rest) => alert(...rest))
  );

  const obj = interpreter.createObject(interpreter.OBJECT);

  interpreter.setProperty(scope, "console", interpreter.createObjectProto(obj));
  interpreter.setProperty(
    obj,
    "log",
    interpreter.createNativeFunction((...rest) => {
      const params = rest.map(p => {
        if (interpreter.isa(p, interpreter.ARRAY)) {
          return interpreter.pseudoToNative(p);
        }
        return p;
      });
      return console.log(...params);
    })
  );

  interpreter.setProperty(
    obj,
    "warn",
    interpreter.createNativeFunction((...rest) => console.warn(...rest))
  );

  interpreter.setProperty(
    obj,
    "clear",
    interpreter.createNativeFunction(() => console.clear())
  );
  interpreter.setProperty(
    obj,
    "error",
    interpreter.createNativeFunction((...rest) => console.error(...rest))
  );

  interpreter.setProperty(
    obj,
    "dir",
    interpreter.createNativeFunction(obj => console.dir(obj))
  );
};

export class InterpreterWrapper extends Interpreter {
  constructor(code, initFunc) {
    super(code, initFunc);
    this.code = code;
    this.scopeNames = ["Global"];
    this.callee = ["window"];
  }

  nextStep() {
    const hasNextStep = this.step();
    const currentState = this.stateStack[this.stateStack.length - 1];
    const start = currentState.node.start;
    const end = currentState.node.end;

    if (currentState.node.type === "Program" && currentState.done) {
      return {
        operationType: "End",
        hasNextStep,
        start,
        end
      };
    }

    if (currentState.func_) {
      const { name } = currentState.func_.node.id;
      this.scopeNames.push(name);
      return {
        currentScope: {
          scopeName: Object.keys(currentState.scope.properties).length
            ? this.scopeNames[this.scopeNames.length - 2]
            : null,
          ...currentState.scope.properties
        },
        operationType: currentState.node.type,
        hasNextStep,
        start,
        end
      };
    } else if (currentState.node.callee && currentState.node.callee.object) {
      this.callee.push(currentState.node.callee.object.name);
    }

    return {
      currentScope: {
        scopeName: Object.keys(currentState.scope.properties).length
          ? this.scopeNames[this.scopeNames.length - 1]
          : null,
        ...currentState.scope.properties,
        this: this.callee[this.callee.length - 1]
      },
      operationType: currentState.node.type,
      hasNextStep,
      start,
      end
    };
  }
}

export function arrayToString(node) {
  return `[${Object.values(node.properties)}]`;
}

export function getHighlightOffset(charOffset, code) {
  const lines = code.split("\n");
  const linesLength = lines.map(line => line.length);
  let line = 0;
  let ch = 0;

  for (let i = 0; i < code.length + 1; i++) {
    if (i === charOffset) {
      return {
        line,
        ch:
          ch -
          linesLength
            .slice(0, line)
            .reduce((sum, lineLength) => sum + lineLength + 1, 0)
      };
    }

    if (code[i] === "\n") {
      line++;
    }

    ch++;
  }
}

export function getScopeProperties(scope) {
  const currentScope = {};
  if (!scope.scopeName) return currentScope;
  _.forIn(scope, (value, key) => {
    if (!ignoreWindowProperties.includes(key) && key !== scope.scopeName) {
      currentScope[key] = value;
      if (value && typeof value === "object") {
        if (key === "this") {
          currentScope[key] = {
            type: "Object",
            value: value.properties.window ? "window" : scope.scopeName
          };
        } else if (key === "arguments") {
          currentScope[key] = {
            type: "ArrayLike",
            value: `${value.properties[0]}`
          };
        } else if (value.class === "Array") {
          currentScope[key] = {
            type: "Array",
            value: arrayToString(value)
          };
        } else if (value.class === "Function") {
          currentScope[key] = {
            type: "Function",
            value: value.class
          };
        } else {
          let obj = "{ ";
          _.forOwn(value.properties, (value, key) => {
            if (typeof value === "number" || typeof value === "string") {
              obj += `${key}: ${value},\n`;
            } else if (value.class) {
              obj += `${key}: ${value.class},\n`;
            }
          });
          obj += " }";
          currentScope[key] = {
            type: typeof value.properties,
            value: `${obj}`
          };
        }
      } else {
        currentScope[key] = {
          type: typeof value,
          value: `${value}`
        };
      }
    }
  });

  if (scope.scopeName === "Global") {
    currentScope.window = {
      value: "global Object",
      type: "Object"
    };
    currentScope.this = {
      value: "window",
      type: "Object"
    };
  }

  return currentScope;
}
