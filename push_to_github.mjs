import fs from 'fs';
import path from 'path';

const CONFIG = {
  owner: 'jamilkhan307-ship-it',
  repo: 'EFI-CIS',
  token: process.env.GITHUB_TOKEN,
  branch: 'main'
};

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.env',
  '.DS_Store',
  '*.log',
  'build',
  'out-tsc'
];

function shouldIgnore(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const parts = relativePath.split(path.sep);
  
  // Check if any part of the path matches an ignore pattern
  return parts.some(part => {
    if (IGNORE_PATTERNS.includes(part)) return true;
    if (part.startsWith('.') && part !== '.gitignore') return true;
    return false;
  });
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!shouldIgnore(fullPath)) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (!shouldIgnore(fullPath)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function uploadFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath);
  const base64Content = content.toString('base64');

  console.log(`Processing: ${relativePath}...`);

  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${relativePath}`;
  
  // 1. Check if file exists to get SHA
  let sha = null;
  try {
    const getResponse = await fetch(`${url}?ref=${CONFIG.branch}`, {
      headers: {
        'Authorization': `token ${CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (getResponse.ok) {
      const existingFile = await getResponse.json();
      sha = existingFile.sha;
      console.log(`  File exists, updating... (SHA: ${sha.substring(0, 7)})`);
    }
  } catch (err) {
    // Ignore error, assume file doesn't exist
  }

  // 2. Upload/Update file
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `chore: sync ${relativePath}`,
      content: base64Content,
      branch: CONFIG.branch,
      sha: sha // Include SHA if updating
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to upload ${relativePath}: ${JSON.stringify(error)}`);
  }

  console.log(`Successfully synced: ${relativePath}`);
}

async function main() {
  try {
    console.log('Starting GitHub Push Workaround...');
    const allFiles = await getAllFiles(process.cwd());
    console.log(`Found ${allFiles.length} files to upload.`);

    for (const file of allFiles) {
      await uploadFile(file);
    }

    console.log('\n--- SUCCESS ---');
    console.log(`Project pushed to https://github.com/${CONFIG.owner}/${CONFIG.repo}`);
  } catch (error) {
    console.error('\n--- ERROR ---');
    console.error(error.message);
    process.exit(1);
  }
}

main();
