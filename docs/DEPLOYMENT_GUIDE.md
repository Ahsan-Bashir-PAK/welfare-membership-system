# Institutional Management System — Deployment Guide

This guide details instructions for setting up, building, running, and deploying the application in development and production environments.

## System Prerequisites
- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **npm**: v9.x or higher
- **MySQL / MariaDB**: 8.0+ or MariaDB 10.4+
- **OS**: Windows, Linux, or macOS

---

## 1. Environment Configuration

### Backend Environment Variables (`backend/.env`)
```ini
PORT=5000
NODE_ENV=production
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=membership_system_db
DATABASE_USER=root
DATABASE_PASSWORD=your_secure_db_password
JWT_SECRET=generate_a_long_random_jwt_secret_key_here
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-domain.com
COOKIE_NAME=auth_token
```

### Frontend Environment Variables (`frontend/.env.local`)
```ini
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

---

## 2. Database Setup

1. Run the database schema:
```bash
mysql -u root -p < database/schema.sql
```
2. Seed initial master data:
```bash
mysql -u root -p < database/seeds/01_master_data.sql
```
3. Initialize the first Super Administrator:
```bash
cd backend
npm run init-admin
```
4. (Optional) Seed realistic development and test records:
```bash
cd backend
npm run seed
```

---

## 3. Running in Development

### Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## 4. Production Deployment

### Backend Build & PM2 Process Manager
```bash
cd backend
npm install --omit=dev
npm run build
pm2 start dist/server.js --name "membership-backend"
pm2 save
```

### Frontend Production Build
```bash
cd frontend
npm install --omit=dev
npm run build
pm2 start npm --name "membership-frontend" -- start
pm2 save
```

### Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name portal.your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. Automated Backup & Recovery

### Daily Database Backup Script (cron / task scheduler)
```bash
mysqldump -u root -p --single-transaction --quick --lock-tables=false membership_system_db > /backups/backup_$(date +%F).sql
```

### Restore Database
```bash
mysql -u root -p membership_system_db < /backups/backup_YYYY-MM-DD.sql
```
