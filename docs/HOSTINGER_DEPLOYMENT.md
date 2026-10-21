# Hostinger Deployment Guide for welfare.absoverseas.com

This comprehensive guide details how to host and deploy the **Membership, Payments, Welfare & Transfer Management System** on Hostinger under the domain **`https://welfare.absoverseas.com`**.

---

## 1. Domain & DNS Configuration

1. Log in to your domain registrar / DNS manager for **`absoverseas.com`** (e.g., Hostinger DNS Zone or Cloudflare).
2. Add a new **A Record** (or CNAME) for the subdomain:
   - **Type**: `A`
   - **Name / Subdomain**: `welfare`
   - **Points to (Value)**: Your Hostinger Server IP address (found in your Hostinger control panel)
   - **TTL**: 300 (or Automatic)
3. Ensure DNS propagation is active before installing SSL.

---

## 2. Deployment Architecture Options on Hostinger

### Option A: Hostinger VPS (Recommended & Standard for Full-Stack Node + Next.js + MySQL)
Hostinger VPS (Ubuntu 22.04 / 24.04 LTS) gives you full control to run the Express backend on port `5000`, the Next.js frontend on port `3000`, and Nginx as a high-performance reverse proxy with free Let's Encrypt SSL.

### Option B: Hostinger Cloud / Shared Web Hosting (via hPanel Node.js)
If using Hostinger Business or Cloud web hosting:
- Hostinger hPanel includes a **Node.js** app manager and **Git** integration.
- Next.js can be deployed as the main Node.js application or static export with backend running via the Node.js application manager.

---

## 3. Hostinger VPS Step-by-Step Deployment (Option A)

### Step 3.1: Server Initial Setup & Dependencies
Connect to your Hostinger VPS via SSH:
```bash
ssh root@YOUR_SERVER_IP
```

Update system packages and install Node.js (v20 LTS), Git, Nginx, and PM2:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx mysql-server

# Install PM2 process manager globally
sudo npm install -g pm2
```

---

### Step 3.2: Create MySQL Database & User
Run the MySQL security configuration and create your database:
```bash
sudo mysql
```
Inside the MySQL shell:
```sql
CREATE DATABASE IF NOT EXISTS membership_system_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'welfare_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON membership_system_db.* TO 'welfare_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### Step 3.3: Clone Repository from GitHub
Create your web root directory and clone the repository:
```bash
sudo mkdir -p /var/www/welfare-system
sudo chown -R $USER:$USER /var/www/welfare-system
cd /var/www/welfare-system

# Clone your GitHub repository
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git .
```

---

### Step 3.4: Import Database Schema & Seeds
Execute the SQL schema and seeds into your MySQL database:
```bash
mysql -u welfare_user -p membership_system_db < database/schema.sql
mysql -u welfare_user -p membership_system_db < database/seeds/01_master_data.sql
```

Create the initial Super Admin account:
```bash
cd /var/www/welfare-system/backend
npm install
npm run build
npm run init-admin
```
*(Default Super Admin credentials: CNIC `1234567890123`, Password `AdminPassword123!`)*

---

### Step 3.5: Configure Environment Variables

#### Backend `.env`:
Create `/var/www/welfare-system/backend/.env`:
```env
PORT=5000
NODE_ENV=production
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=membership_system_db
DATABASE_USER=welfare_user
DATABASE_PASSWORD=YourStrongPassword123!
JWT_SECRET=use_a_long_random_64_character_string_here
JWT_EXPIRES_IN=24h
COOKIE_NAME=auth_token
FRONTEND_URL=https://welfare.absoverseas.com
```

#### Frontend `.env.local`:
Create `/var/www/welfare-system/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://welfare.absoverseas.com/api
```

---

### Step 3.6: Build Applications & Launch with PM2

#### 1. Build Backend:
```bash
cd /var/www/welfare-system/backend
npm install --production=false
npm run build
```

#### 2. Build Frontend:
```bash
cd /var/www/welfare-system/frontend
npm install --production=false
npm run build
```

#### 3. Start Both Services with PM2:
Create an ecosystem configuration file `/var/www/welfare-system/ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: 'welfare-backend',
      cwd: '/var/www/welfare-system/backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'welfare-frontend',
      cwd: '/var/www/welfare-system/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

Launch and configure auto-start on server reboot:
```bash
cd /var/www/welfare-system
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

### Step 3.7: Configure Nginx & SSL for `welfare.absoverseas.com`

Create Nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/welfare.absoverseas.com
```
Add the following configuration:
```nginx
server {
    listen 80;
    server_name welfare.absoverseas.com;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Client body size for file uploads
    client_max_body_size 20M;

    # Reverse proxy for backend API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Reverse proxy for Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and test configuration:
```bash
sudo ln -s /etc/nginx/sites-available/welfare.absoverseas.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Install free Let's Encrypt SSL certificate:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d welfare.absoverseas.com
```
Certbot will automatically configure HTTPS redirect and auto-renewal.

---

## 4. Continuous Deployment via GitHub Webhook

To update your live site automatically whenever you push code to GitHub:
1. Create a script `/var/www/welfare-system/deploy.sh`:
```bash
#!/bin/bash
cd /var/www/welfare-system
git pull origin main

# Update backend
cd backend
npm install --production=false
npm run build

# Update frontend
cd ../frontend
npm install --production=false
npm run build

# Reload PM2 zero-downtime
cd ..
pm2 reload ecosystem.config.cjs
echo "Deployment completed successfully!"
```
2. Make it executable:
```bash
chmod +x /var/www/welfare-system/deploy.sh
```
3. Whenever you push to GitHub, you can execute `./deploy.sh` on your server, or trigger it via GitHub Actions SSH.
