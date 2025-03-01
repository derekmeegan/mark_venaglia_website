// vercel-build.js
const { execSync } = require('child_process');

// Run the build command without postbuild hooks
try {
  console.log('Building the application...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
