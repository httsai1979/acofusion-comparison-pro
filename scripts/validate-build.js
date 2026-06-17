import { execSync } from 'node:child_process';
execSync('npm run check:i18n', { stdio: 'inherit' });
execSync('npm run build', { stdio: 'inherit' });
