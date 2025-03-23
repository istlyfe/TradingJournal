const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'app', 'api');

// Function to add Node.js runtime export to a file if not already present
function addRuntimeToFile(filePath) {
  // Only process .ts and .js files that are route files
  if (!filePath.match(/route\.(ts|js)$/)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if runtime is already defined
  if (content.includes('export const runtime =')) {
    console.log(`Runtime already defined in ${filePath}`);
    return;
  }
  
  // Add the runtime export after imports
  const importRegex = /^import.*?;(\r?\n)/gm;
  let lastImportIndex = 0;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    lastImportIndex = match.index + match[0].length;
  }
  
  if (lastImportIndex === 0) {
    // If no imports found, add at the beginning
    const newContent = `// Specify Node.js runtime\nexport const runtime = 'nodejs';\n\n${content}`;
    fs.writeFileSync(filePath, newContent);
  } else {
    // Add after the last import
    const newContent = 
      content.substring(0, lastImportIndex) + 
      "\n// Specify Node.js runtime\nexport const runtime = 'nodejs';\n\n" + 
      content.substring(lastImportIndex);
    
    fs.writeFileSync(filePath, newContent);
  }
  
  console.log(`Added Node.js runtime to ${filePath}`);
}

// Function to recursively process all files in a directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (stat.isFile()) {
      addRuntimeToFile(filePath);
    }
  }
}

// Start processing from the API directory
processDirectory(API_DIR);
console.log('Finished adding Node.js runtime to API route files'); 