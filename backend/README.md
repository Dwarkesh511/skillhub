# SkillHub Backend API

Backend application foundation for SkillHub - Online Course / E-Learning Platform.

## Technology Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Middleware**: CORS, cookie-parser, dotenv
- **Dev Tool**: Nodemon

## Quick Start Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Production Server
```bash
npm start
```

## Endpoints

- **Backend Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

## Current Status
Backend foundation scaffold initialized. Health-check endpoint operational without database dependency.
