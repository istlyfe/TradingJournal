const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript and TSX files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      fileList = findTsFiles(filePath, fileList);
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx')) && 
      !file.endsWith('.d.ts')
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if there are any imports with '@/Components'
    if (!content.includes('@/Components')) {
      return false; // No changes needed
    }
    
    // Replace '@/Components' with '@/components'
    const updatedContent = content.replace(/@\/Components\//g, '@/components/');
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Fixed imports in ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main process
console.log('Starting import path fixes...');
const tsFiles = findTsFiles('.');
let fixedCount = 0;

tsFiles.forEach(file => {
  if (fixImportsInFile(file)) {
    fixedCount++;
  }
});

console.log(`Completed import path fixes. Fixed ${fixedCount} files.`); 