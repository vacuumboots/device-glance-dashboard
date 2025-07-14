#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing UI Loading in Different Environments\n');

// Test 1: Production Electron Build
console.log('📱 Testing Production Electron Build...');
const electronProd = spawn('npx', ['electron', '.'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

electronProd.on('close', (code) => {
  console.log(`Production Electron exited with code ${code}`);
  
  // Test 2: Development Electron Build
  console.log('\n🔧 Testing Development Electron Build...');
  const electronDev = spawn('npm', ['run', 'electron-dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  setTimeout(() => {
    electronDev.kill('SIGTERM');
    console.log('Development Electron test complete');
    
    // Test 3: Web Preview
    console.log('\n🌐 Testing Web Preview...');
    const webPreview = spawn('npm', ['run', 'preview'], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    setTimeout(() => {
      webPreview.kill('SIGTERM');
      console.log('Web Preview test complete');
      
      console.log('\n✅ All tests completed!');
      console.log('Check the outputs above for any errors.');
    }, 5000);
  }, 10000);
});

// Kill the process after 8 seconds
setTimeout(() => {
  electronProd.kill('SIGTERM');
}, 8000);