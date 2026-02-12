# Deployment Guide for Perti_service2

## Production Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/3amrpepsi5-max/Perti_service2.git
   cd Perti_service2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory and fill in the required variables as shown in `.env.example`.
   
4. Build the application:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Database Migration
1. Ensure your database server is running.
2. Run migrations:
   ```bash
   npm run migrate
   ```
   - This will apply all the pending migrations to the database.

## Server Configuration
1. Ensure your server meets the following requirements:
   - Node.js version >= 14.x
   - NPM version >= 6.x

2. For production, consider using a process manager like PM2 to manage the application:
   ```bash
   npm install -g pm2
   pm2 start dist/app.js --name "Perti_service2"
   ```

3. Set up a reverse proxy (e.g., Nginx) to handle requests to your application:
   - Example Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Ensure to monitor your application for performance and errors using tools like LogRocket, Sentry, or Application Insights.