const { spawn } = require('child_process');

// Set the environment variable
process.env.BRAND_NAME = 'akilajewellers';

console.log('🚀 Starting Akila Jewellers brand...');
console.log('🔍 BRAND_NAME set to:', process.env.BRAND_NAME);

// Start expo with spawn (not spawnSync) to keep it running
const expoProcess = spawn('npx', ['expo', 'start', '--dev-client'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

// Handle process events
expoProcess.on('error', (error) => {
  console.error('❌ Failed to start Expo:', error);
  process.exit(1);
});

expoProcess.on('exit', (code) => {
  console.log(`Expo process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping Expo...');
  expoProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Stopping Expo...');
  expoProcess.kill('SIGTERM');
}); 