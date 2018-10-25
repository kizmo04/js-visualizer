import Interpreter from "./interpreter";
import _ from "lodash";

export function getInterpreter(code) {

  const initFunc = function(interpreter, scope) {

    var wrapper = function(href, callback) {
      var req = new XMLHttpRequest();
      req.open("GET", href, true);
      req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
          callback(req.responseText);
        }
      };
      req.send(null);
    };

    interpreter.setProperty(
      scope,
      "getXhr",
      interpreter.createAsyncFunction(wrapper)
    );

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

    interpreter.setProperty(
      scope,
      "console",
      interpreter.createObjectProto(obj)
    );
    interpreter.setProperty(
      obj,
      "log",
      interpreter.createNativeFunction((...rest) => console.log(...rest))
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

    interpreter.setProperty(
      scope,
      "setTimeout",
      interpreter.createAsyncFunction(function(callback, ms) {
        var id = window.setTimeout(callback, ms);
        return id;
      })
    );
  };

  return new Interpreter(code, initFunc);
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
      console.log(
        `line: ${line} \nch: ${ch -
          linesLength
            .slice(0, line)
            .reduce(
              (sum, lineLength) => sum + lineLength + 1,
              0
            )}\nch origin: ${ch}`
      );
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
  let currentScope = {};

  if (!scope.parentScope) {
    currentScope = {
      window: "global Object",
      this: "window"
    };
  }

  _.forOwn(scope.properties, (value, key) => {
    if (!window.hasOwnProperty(key)) {
      console.log(scope.properties);

      if (value && typeof value === "object") {
        if (key === "this") {
          currentScope[key] = value.parentScope ? "" : "window";
        } else if (key === "arguments") {
          currentScope[key] = `${value.properties[0]}`;
        } else if (value.class === "Array") {
          currentScope[key] = arrayToString(value);
        } else if (value.class === "Function") {
          currentScope[key] = value.class;
        } else {
          currentScope[key] = `${value.properties}`;
        }
      } else {
        console.log("prop", key, value, typeof value);
        currentScope[key] = `${value}`;
      }
    }
  });

  return currentScope;
}
