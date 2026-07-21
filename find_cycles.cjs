const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = getFiles(srcDir);
const graph = {};

files.forEach(file => {
  const relativeFile = path.relative(srcDir, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf-8');
  const imports = [];
  
  // Find all from '...' or from "..." or import '...' or import("...")
  const regex = /(?:from|import)\s+['"](\.\.?\/[^'"]+|@[^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let importPath = match[1];
    
    // Resolve relative or alias path
    let resolved = null;
    if (importPath.startsWith('.')) {
      const fileDir = path.dirname(relativeFile);
      resolved = path.join(fileDir, importPath).replace(/\\/g, '/');
    } else if (importPath.startsWith('@/')) {
      resolved = importPath.replace('@/', '');
    } else {
      // Third-party package, ignore
      continue;
    }
    
    // Resolve file extension
    let found = null;
    const extensions = ['.tsx', '.ts', '/index.tsx', '/index.ts'];
    for (const ext of ['', ...extensions]) {
      const fullPath = path.resolve(srcDir, resolved + ext);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        found = path.relative(srcDir, fullPath).replace(/\\/g, '/');
        break;
      }
    }
    if (found) {
      if (!imports.includes(found)) {
        imports.push(found);
      }
    }
  }
  graph[relativeFile] = imports;
});

// DFS cycle detection
const visited = {};
const recStack = {};
const cycles = [];

function detectCycles(node, pathStack = []) {
  if (recStack[node]) {
    const cycleStartIdx = pathStack.indexOf(node);
    cycles.push([...pathStack.slice(cycleStartIdx), node]);
    return;
  }
  if (visited[node]) return;

  visited[node] = true;
  recStack[node] = true;
  pathStack.push(node);

  const neighbors = graph[node] || [];
  for (const neighbor of neighbors) {
    detectCycles(neighbor, pathStack);
  }

  pathStack.pop();
  recStack[node] = false;
}

Object.keys(graph).forEach(node => {
  detectCycles(node);
});

if (cycles.length > 0) {
  console.log('FOUND CYCLES:');
  cycles.forEach((cycle, index) => {
    console.log(`Cycle ${index + 1}: ${cycle.join(' -> ')}`);
  });
} else {
  console.log('NO CYCLES DETECTED');
}
