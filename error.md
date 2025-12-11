19:05:27.596 Running build in Portland, USA (West) – pdx1
19:05:27.597 Build machine configuration: 2 cores, 8 GB
19:05:27.708 Cloning github.com/minamotodenki/suke_vercel (Branch: main, Commit: f57e892)
19:05:28.219 Cloning completed: 511.000ms
19:05:28.345 Restored build cache from previous deployment (FDJCX8qDm9Y3dVRsCX3tkDrU48Xh)
19:05:28.893 Running "vercel build"
19:05:29.290 Vercel CLI 49.1.2
19:05:29.937 Installing dependencies...
19:05:30.881 
19:05:30.882 > suke-schedule-app@1.0.0 postinstall
19:05:30.882 > npm run install:all
19:05:30.882 
19:05:31.017 
19:05:31.018 > suke-schedule-app@1.0.0 install:all
19:05:31.018 > cd server && npm install && cd ../client && npm install
19:05:31.018 
19:05:31.687 
19:05:31.687 up to date, audited 239 packages in 588ms
19:05:31.688 
19:05:31.688 30 packages are looking for funding
19:05:31.688   run `npm fund` for details
19:05:31.688 
19:05:31.689 found 0 vulnerabilities
19:05:32.477 
19:05:32.478 up to date, audited 98 packages in 705ms
19:05:32.478 
19:05:32.479 14 packages are looking for funding
19:05:32.479   run `npm fund` for details
19:05:32.485 
19:05:32.485 2 moderate severity vulnerabilities
19:05:32.485 
19:05:32.485 To address all issues (including breaking changes), run:
19:05:32.485   npm audit fix --force
19:05:32.485 
19:05:32.485 Run `npm audit` for details.
19:05:32.511 
19:05:32.511 up to date in 2s
19:05:32.511 
19:05:32.511 46 packages are looking for funding
19:05:32.511   run `npm fund` for details
19:05:32.642 
19:05:32.642 > suke-schedule-app@1.0.0 build
19:05:32.643 > npm run server:build && npm run client:build
19:05:32.643 
19:05:32.746 
19:05:32.747 > suke-schedule-app@1.0.0 server:build
19:05:32.747 > cd server && npm run build
19:05:32.747 
19:05:32.858 
19:05:32.858 > suke-server@1.0.0 build
19:05:32.859 > tsc
19:05:32.859 
19:05:34.184 
19:05:34.184 > suke-schedule-app@1.0.0 client:build
19:05:34.184 > cd client && npm run build
19:05:34.184 
19:05:34.291 
19:05:34.291 > suke-client@1.0.0 build
19:05:34.291 > tsc && vite build
19:05:34.291 
19:05:37.065 [33mThe CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.[39m
19:05:37.139 [36mvite v5.4.21 [32mbuilding for production...[36m[39m
19:05:37.190 transforming...
19:05:39.187 [32m✓[39m 929 modules transformed.
19:05:39.367 rendering chunks...
19:05:39.375 computing gzip size...
19:05:39.388 [2mbuild/[22m[32mindex.html                 [39m[1m[2m  0.40 kB[22m[1m[22m[2m │ gzip:  0.31 kB[22m
19:05:39.388 [2mbuild/[22m[2massets/[22m[35mindex-CzDeyku9.css  [39m[1m[2m 18.15 kB[22m[1m[22m[2m │ gzip:  3.40 kB[22m
19:05:39.388 [2mbuild/[22m[2massets/[22m[36mindex-Cj2RetcV.js   [39m[1m[2m265.47 kB[22m[1m[22m[2m │ gzip: 87.71 kB[22m
19:05:39.388 [32m✓ built in 2.22s[39m
19:05:39.676 Using TypeScript 4.9.5 (local user-provided)
19:05:42.926 Using TypeScript 4.9.5 (local user-provided)
19:05:43.868 Build Completed in /vercel/output [14s]
19:05:44.132 Deploying outputs...
19:05:50.138 Deployment completed
19:05:50.721 Creating build cache...