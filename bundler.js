const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const { type } = require('os');

// Initial params
const entryFile = 'index.js';
const entryPath = './pack_tester';
const outputPath = './build';

const absoluteEntryPath = path.resolve(entryPath, entryFile);

console.log(absoluteEntryPath);


const build = ({entryFile, outputFolder})  => {
    const graph = createModuleGraph(entryFile);
    const outputFiles = bundle(graph);

    outputFiles.forEach(outputFile => fs.writeFileSync(
        path.join(outputFolder, outputFile.name),
        outputFile.content,
        'utf-8'
    ))
};

// Creating a moduleMap
const createModuleGraph = entryFile => createModule(entryFile);

const createModule = filePath => new Module(filePath);

function Module(filePath) {
    this.filePath = filePath;
    this.content = fs.readFileSync(filePath, 'utf-8');
    this.ast = babel.parseSync(this.content);
    this.dependencies = this.findDependencies();
}

Module.prototype.findDependencies = function() {
    return this.ast.program.body
    .filter(node => node.type === 'ImportDeclaration')
    .map(node => node.source.value)
    .map(relativePath => {
        const newFilePath = path.join(path.dirname(this.filePath), relativePath);
        return fs.lstatSync(newFilePath).isDirectory()  
            ? `${newFilePath}/index.js`
            : newFilePath
    })
    .map(absolutePath => createModule(absolutePath))
}

Module.prototype.transformModuleInterface = function() {
    const { ast, code } = babel.transformFromAstSync(this.ast, this.content, {presets: ["@babel/preset-env"]});
    this.ast = ast;
    this.content = code;
  }

const bundle = moduleGraph => {
   const modules = collectModules(moduleGraph);
   const moduleMap = toModuleMap(modules); 
   const moduleCode = addRuntime(moduleMap, modules[0].filePath);
   return [{ name: 'bundle.js', content: moduleCode }];
}

const collectModules = moduleGraph => {
    const collect = (module, modules) => {
        modules.push(module);
        module.dependencies.forEach(dependency => collect(dependency, modules));
    }
    const modules = [];
    collect(moduleGraph, modules);
    return modules;
}

const toModuleMap = modules => {
    let moduleMap = '';
    moduleMap += '{';
    modules.forEach(module => {
        module.transformModuleInterface();
        moduleMap += `".\/${module.filePath}": `;
        moduleMap += `function(exports, require) { ${module.content} },`;
    });
    moduleMap += '}';
  return moduleMap;
}

function addRuntime(moduleMap, entryPoint) {
    return trim(`
      const modules = ${moduleMap};
      const entry = ".\/${entryPoint}";
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
  
      webpackStart({ modules, entry });`);
  }
  
  // trim away spaces before the line
  function trim(str) {
    const lines = str.split('\n').filter(Boolean);
    const padLength = lines[0].length - lines[0].trimLeft().length;
    const regex = new RegExp(`^\s{${padLength}}`);
    return lines.map(line => line.replace(regex, '')).join('\n');
  }



build({entryFile: entryFile, outputFolder: './build'});