const fs = require('fs');
const path = require('path');

// Function to recursively find all .js and .jsx files
function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            findFiles(filePath, fileList);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Function to replace localhost URLs with relative paths
function fixApiUrls(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace http://localhost:8087/api/v1.0 with /api
    const oldPattern = /http:\/\/localhost:8087\/api\/v1\.0/g;
    if (oldPattern.test(content)) {
        content = content.replace(oldPattern, '/api');
        modified = true;
    }
    
    // Replace http://localhost:8087 with /api
    const oldPattern2 = /http:\/\/localhost:8087/g;
    if (oldPattern2.test(content)) {
        content = content.replace(oldPattern2, '/api');
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
    }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to process...`);

files.forEach(file => {
    fixApiUrls(file);
});

console.log('Done! All localhost:8087 URLs have been replaced with relative paths.');
