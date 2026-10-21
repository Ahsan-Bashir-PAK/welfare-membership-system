#!/bin/bash
# One-click deployment script for welfare.absoverseas.com
set -e

echo "=== Pulling latest changes from GitHub ==="
git pull origin main

echo "=== Updating & Building Backend ==="
cd backend
npm install
npm run build

echo "=== Updating & Building Frontend ==="
cd ../frontend
npm install
npm run build

echo "=== Reloading PM2 Processes ==="
cd ..
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs

echo "=== Deployment to welfare.absoverseas.com Completed! ==="
