# NexKirana Accounting System - Backend API

🔒 **Internal Use Only** - Enterprise Financial Management Backend

## Overview

This is the backend API for the NexKirana Accounting System, a comprehensive financial management platform designed for internal use. Built with Node.js, Express, and MongoDB, it provides secure authentication, role-based access control, and complete accounting functionality.

## 🚀 Features

### Authentication & Security
- **JWT Authentication** with 8-hour token expiry
- **Role-Based Access Control** (Admin, Manager, Accountant, User)
- **Department-Based Permissions** (Accounts, Sales, Purchase, Inventory, Admin)
- **Password Hashing** with bcrypt
- **Security Headers** via Helmet.js
- **CORS Protection** configured for production

### Accounting Features
- **Multi-Company Management** - Handle multiple companies
- **Comprehensive Ledger System** - Complete chart of accounts
- **Voucher Management** - All transaction types supported
- **Financial Reports** - Balance sheets, P&L, trial balance
- **Real-time Calculations** - Automatic balance updates

### User Management
- **Admin-Only Registration** - Restricted user creation
- **User Role Management** - Assign roles and permissions
- **Department Organization** - Organize users by department
- **User Activation/Deactivation** - Control user access

## 🛠 Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet.js** - Security headers
- **Morgan** - Request logging
- **Express Validator** - Input validation

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- npm or yarn

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nexkirana-accounting-backend.git
   cd nexkirana-accounting-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Create admin user**
   ```bash
   npm run create-admin
   ```

### Production Deployment

See [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

## 🔧 Environment Variables

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=8h
NODE_ENV=production
COMPANY_NAME=NexKirana
SESSION_TIMEOUT=480
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Admin-only user creation
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Admin/Manager)
- `PUT /api/users/:id` - Update user (Admin/Manager)
- `DELETE /api/users/:id` - Deactivate user (Admin only)

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company

### Ledgers
- `GET /api/ledgers` - List ledgers
- `POST /api/ledgers` - Create ledger
- `GET /api/ledgers/:id` - Get ledger details
- `PUT /api/ledgers/:id` - Update ledger

### Vouchers
- `GET /api/vouchers` - List vouchers
- `POST /api/vouchers` - Create voucher
- `GET /api/vouchers/:id` - Get voucher details

### Reports
- `GET /api/reports/trial-balance` - Trial balance report
- `GET /api/reports/profit-loss` - P&L statement
- `GET /api/reports/balance-sheet` - Balance sheet
- `GET /api/reports/day-book` - Day book report
- `GET /api/reports/ledger-statement` - Ledger statement

## 🔐 User Roles & Permissions

### Administrator
- Full system access
- User management
- Company creation/deletion
- All financial operations

### Manager
- Company management
- User creation (non-admin)
- All financial operations
- Report access

### Accountant
- Financial data entry
- Report generation
- Ledger management
- Voucher operations

### User
- Basic data entry
- Limited report access
- Read-only permissions

## 🚀 Deployment

### Vercel Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**
   - Configure all required environment variables in Vercel dashboard

3. **Create Admin User**
   ```bash
   npm run create-admin-prod
   ```

## 📁 Project Structure

```
server/
├── models/           # Database models
├── routes/           # API routes
├── middleware/       # Custom middleware
├── utils/            # Utility functions
├── index.js          # Server entry point
├── vercel.json       # Vercel configuration
└── package.json      # Dependencies
```

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcrypt with salt rounds
- **Input Validation** on all endpoints
- **Security Headers** via Helmet.js
- **CORS Protection** configured for production
- **Rate Limiting** (configurable)
- **Environment Variable Protection**

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**
   - Verify MongoDB URI
   - Check IP whitelist in MongoDB Atlas

2. **Authentication Issues**
   - Ensure JWT_SECRET is configured
   - Check token expiry settings

3. **CORS Errors**
   - Verify frontend domain is allowed
   - Check CORS configuration

## 📞 Support

For technical support:
- Check the API documentation
- Review server logs
- Test endpoints individually
- Verify environment variables

## 📄 License

© 2024 NexKirana. All rights reserved.

This software is proprietary and confidential. Intended for internal use only.

---

**🚀 NexKirana Accounting System Backend - Production Ready**