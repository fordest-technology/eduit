const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'app', 'api');

function updateFileImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Update imports
    content = content.replace(
      /from ["']@\/lib\/auth["']/g,
      'from "@/lib/auth-server"'
    );

    // Update specific imports that might have been using named imports
    content = content.replace(
      /import\s*\{([^}]*?)(\bgetSession\b)([^}]*?)\}\s*from\s*["']@\/lib\/auth["']/g,
      'import {$1$3} from "@/lib/auth-server"'
    );

    // If the file was modified, save it
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

function processDirectory(directory) {
  let updatedCount = 0;
  
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      updatedCount += processDirectory(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      if (updateFileImports(fullPath)) {
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

console.log('Updating auth imports in API routes...');
const updatedCount = processDirectory(API_DIR);
console.log(`\n✅ Updated ${updatedCount} files.`);
