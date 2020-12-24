      const modules = {"./index.js": function(exports, require) { "use strict";
var _sayHello = require("./sayHello.js");
console.log((0, _sayHello.sayHello)()); },"./sayHello.js": function(exports, require) { "use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sayHello = void 0;
var _name = require("./name.js");
var sayHello = function sayHello() {
  return "Hello ".concat(_name.name);
};
exports.sayHello = sayHello; },"./name.js": function(exports, require) { "use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.name = void 0;
var name = "Siddharth";
exports.name = name; },};
      const entry = "./index.js";
      function webpackStart({ modules, entry }) {
        const moduleCache = {};
        const require = moduleName => {
          // if in cache, return the cached version
          if (moduleCache[moduleName]) {
            return moduleCache[moduleName];
          }
          const exports = {};
          // this will prevent infinite "require" loop
          // from circular dependencies
          moduleCache[moduleName] = exports;
      
          // "require"-ing the module,
          // exported stuff will assigned to "exports"
          modules[moduleName](exports, require);
          return moduleCache[moduleName];
        };
      
        // start the program
        require(entry);
      }
  
      webpackStart({ modules, entry });