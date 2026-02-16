# Environment Configuration Documentation
## Karur Gastro Hospital Management System

**Version:** 1.0  
**Last Updated:** 2024-12-04  
**Document Owner:** DevOps Team  
**Classification:** CONFIDENTIAL

---

## Table of Contents

1. [Environment Overview](#environment-overview)
2. [Environment Details](#environment-details)
   - [Development (DEV)](#1-development-dev)
   - [Quality Assurance (QA)](#2-quality-assurance-qa)
   - [User Acceptance Testing (UAT)](#3-user-acceptance-testing-uat)
   - [Pre-Production (PRE-PROD)](#4-pre-production-pre-prod)
   - [Production (PROD)](#5-production-prod)
3. [Database Configuration](#database-configuration)
4. [Deployment Pipelines](#deployment-pipelines)
5. [Feature Flags](#feature-flags)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Security & Access Control](#security--access-control)
8. [Monitoring & Logging](#monitoring--logging)
9. [Disaster Recovery](#disaster-recovery)
10. [Contact Information](#contact-information)

---

## Environment Overview

The Karur Gastro HMS is deployed across five environments, each serving a specific purpose in the software development lifecycle:

| Environment | Purpose | Stability | Data Type | Auto-Deploy | Uptime SLA |
|-------------|---------|-----------|-----------|-------------|------------|
| DEV | Active development & testing | Unstable | Synthetic | Yes | 95% |
| QA | Quality assurance & automated testing | Moderate | Synthetic | Yes | 97% |
| UAT | User acceptance & client validation | Stable | Sanitized Prod Copy | Manual | 98% |
| PRE-PROD | Final validation before production | Stable | Sanitized Prod Copy | Manual | 99% |
| PROD | Live system serving actual users | Highly Stable | Real Production Data | Manual | 99.9% |

---

## Environment Details

### 1. Development (DEV)

#### **Environment Information**
```yaml
Name: Development
Code: DEV
Purpose: Active development and unit testing
Refresh Cycle: On-demand
Data Refresh: Weekly (synthetic data)
```

#### **URLs**
| Service | URL | Port |
|---------|-----|------|
| Frontend | `http://localhost:3000` | 3000 |
| Backend API | `http://localhost:5000` | 5000 |
| Admin Panel | `http://localhost:3000/admin` | 3000 |
| API Documentation | `http://localhost:5000/api-docs` | 5000 |

#### **Database Configuration**
```yaml
Type: MongoDB Atlas (Shared Cluster)
Connection String: mongodb+srv://dev_user:***@dev-cluster.mongodb.net/hms_dev
Database Name: hms_dev
Backup Frequency: Daily
Retention: 7 days
```

#### **Credentials (Secured)**
```bash
# Access via Azure Key Vault: dev-hms-secrets
ADMIN_EMAIL=admin@hms.com
ADMIN_PASSWORD=*** (Stored in Key Vault)

DOCTOR_EMAIL=doctor@hms.com
DOCTOR_PASSWORD=*** (Stored in Key Vault)

PHARMACIST_EMAIL=pharmacist@hms.com
PHARMACIST_PASSWORD=*** (Stored in Key Vault)

PATHOLOGIST_EMAIL=pathologist@hms.com
PATHOLOGIST_PASSWORD=*** (Stored in Key Vault)
```

#### **Third-Party Services**
```yaml
Azure OpenAI:
  Endpoint: https://dev-hms-openai.cognitiveservices.azure.com/
  Deployment: gpt-4o-dev
  API Version: 2024-02-15-preview

Google Cloud Vision:
  Project ID: movi-labs-dev
  Service Account: dev-vision@movi-labs.iam.gserviceaccount.com

Telegram Bot:
  Bot Token: *** (Stored in Key Vault)
  Webhook URL: http://localhost:5000/api/bot/webhook
```

#### **Feature Flags**
```javascript
{
  "enableTelegramBot": true,
  "enableOCR": true,
  "enableFollowUpSystem": true,
  "enablePayrollModule": false,
  "enableAdvancedReporting": false,
  "enableEmailNotifications": false,
  "debugMode": true,
  "logLevel": "debug"
}
```

---

### 2. Quality Assurance (QA)

#### **Environment Information**
```yaml
Name: Quality Assurance
Code: QA
Purpose: Automated testing and QA validation
Refresh Cycle: Daily (automated)
Data Refresh: Daily (synthetic test data)
```

#### **URLs**
| Service | URL | Port |
|---------|-----|------|
| Frontend | `https://qa-hms.karurgastro.com` | 443 |
| Backend API | `https://qa-api.karurgastro.com` | 443 |
| Admin Panel | `https://qa-hms.karurgastro.com/admin` | 443 |
| API Documentation | `https://qa-api.karurgastro.com/docs` | 443 |

#### **Database Configuration**
```yaml
Type: MongoDB Atlas (Dedicated Cluster - M10)
Connection String: mongodb+srv://qa_user:***@qa-cluster.mongodb.net/hms_qa
Database Name: hms_qa
Backup Frequency: Daily
Retention: 14 days
Read Replicas: 1
```

#### **Credentials (Secured)**
```bash
# Access via Azure Key Vault: qa-hms-secrets
# Same user structure as DEV with different passwords
```

#### **Third-Party Services**
```yaml
Azure OpenAI:
  Endpoint: https://qa-hms-openai.cognitiveservices.azure.com/
  Deployment: gpt-4o-qa
  API Version: 2024-02-15-preview
  Rate Limit: 100 req/min

Google Cloud Vision:
  Project ID: movi-labs-qa
  Service Account: qa-vision@movi-labs.iam.gserviceaccount.com

Telegram Bot:
  Bot Token: *** (Stored in Key Vault)
  Webhook URL: https://qa-api.karurgastro.com/api/bot/webhook
```

#### **Feature Flags**
```javascript
{
  "enableTelegramBot": true,
  "enableOCR": true,
  "enableFollowUpSystem": true,
  "enablePayrollModule": true,
  "enableAdvancedReporting": true,
  "enableEmailNotifications": false,
  "debugMode": false,
  "logLevel": "info"
}
```

---

### 3. User Acceptance Testing (UAT)

#### **Environment Information**
```yaml
Name: User Acceptance Testing
Code: UAT
Purpose: Client validation and user acceptance testing
Refresh Cycle: Weekly (manual)
Data Refresh: Weekly (sanitized production data)
```

#### **URLs**
| Service | URL | Port |
|---------|-----|------|
| Frontend | `https://uat-hms.karurgastro.com` | 443 |
| Backend API | `https://uat-api.karurgastro.com` | 443 |
| Admin Panel | `https://uat-hms.karurgastro.com/admin` | 443 |
| API Documentation | `https://uat-api.karurgastro.com/docs` | 443 |

#### **Database Configuration**
```yaml
Type: MongoDB Atlas (Dedicated Cluster - M20)
Connection String: mongodb+srv://uat_user:***@uat-cluster.mongodb.net/hms_uat
Database Name: hms_uat
Backup Frequency: Daily
Retention: 30 days
Read Replicas: 2
Point-in-Time Recovery: Enabled
```

#### **Credentials (Secured)**
```bash
# Access via Azure Key Vault: uat-hms-secrets
# Production-like user accounts for client testing
```

#### **Third-Party Services**
```yaml
Azure OpenAI:
  Endpoint: https://uat-hms-openai.cognitiveservices.azure.com/
  Deployment: gpt-4o-uat
  API Version: 2024-02-15-preview
  Rate Limit: 500 req/min

Google Cloud Vision:
  Project ID: movi-labs-uat
  Service Account: uat-vision@movi-labs.iam.gserviceaccount.com

Telegram Bot:
  Bot Token: *** (Stored in Key Vault)
  Webhook URL: https://uat-api.karurgastro.com/api/bot/webhook
```

#### **Feature Flags**
```javascript
{
  "enableTelegramBot": true,
  "enableOCR": true,
  "enableFollowUpSystem": true,
  "enablePayrollModule": true,
  "enableAdvancedReporting": true,
  "enableEmailNotifications": true,
  "debugMode": false,
  "logLevel": "info"
}
```

---

### 4. Pre-Production (PRE-PROD)

#### **Environment Information**
```yaml
Name: Pre-Production
Code: PRE-PROD
Purpose: Final validation and performance testing
Refresh Cycle: On-demand (manual)
Data Refresh: On-demand (sanitized production mirror)
```

#### **URLs**
| Service | URL | Port |
|---------|-----|------|
| Frontend | `https://preprod-hms.karurgastro.com` | 443 |
| Backend API | `https://preprod-api.karurgastro.com` | 443 |
| Admin Panel | `https://preprod-hms.karurgastro.com/admin` | 443 |
| API Documentation | `https://preprod-api.karurgastro.com/docs` | 443 |

#### **Database Configuration**
```yaml
Type: MongoDB Atlas (Dedicated Cluster - M30)
Connection String: mongodb+srv://preprod_user:***@preprod-cluster.mongodb.net/hms_preprod
Database Name: hms_preprod
Backup Frequency: Every 6 hours
Retention: 60 days
Read Replicas: 3
Point-in-Time Recovery: Enabled
Performance Insights: Enabled
```

#### **Credentials (Secured)**
```bash
# Access via Azure Key Vault: preprod-hms-secrets
# Identical to production configuration
```

#### **Third-Party Services**
```yaml
Azure OpenAI:
  Endpoint: https://preprod-hms-openai.cognitiveservices.azure.com/
  Deployment: gpt-4o-preprod
  API Version: 2024-02-15-preview
  Rate Limit: 1000 req/min

Google Cloud Vision:
  Project ID: movi-labs-preprod
  Service Account: preprod-vision@movi-labs.iam.gserviceaccount.com

Telegram Bot:
  Bot Token: *** (Stored in Key Vault)
  Webhook URL: https://preprod-api.karurgastro.com/api/bot/webhook
```

#### **Feature Flags**
```javascript
{
  "enableTelegramBot": true,
  "enableOCR": true,
  "enableFollowUpSystem": true,
  "enablePayrollModule": true,
  "enableAdvancedReporting": true,
  "enableEmailNotifications": true,
  "debugMode": false,
  "logLevel": "warn"
}
```

---

### 5. Production (PROD)

#### **Environment Information**
```yaml
Name: Production
Code: PROD
Purpose: Live system serving actual users
Refresh Cycle: N/A
Data Refresh: N/A (Real production data)
High Availability: Active-Active
Load Balancing: Enabled
CDN: CloudFlare
WAF: Enabled
```

#### **URLs**
| Service | URL | Port |
|---------|-----|------|
| Frontend | `https://hms.karurgastro.com` | 443 |
| Backend API | `https://api.karurgastro.com` | 443 |
| Admin Panel | `https://admin.karurgastro.com` | 443 |
| API Documentation | `https://api.karurgastro.com/docs` (Authenticated) | 443 |

#### **Database Configuration**
```yaml
Type: MongoDB Atlas (Dedicated Cluster - M40)
Connection String: mongodb+srv://prod_user:***@prod-cluster.mongodb.net/hms_production
Database Name: hms_production
Backup Frequency: Every 2 hours
Retention: 90 days
Read Replicas: 5 (Multi-region)
Point-in-Time Recovery: Enabled
Performance Insights: Enabled
Analytics Nodes: 2
Encryption: At-rest and in-transit
```

#### **Credentials (Secured)**
```bash
# Access via Azure Key Vault: prod-hms-secrets
# Rotate every 90 days
# Multi-factor authentication required
# Access logs maintained for 1 year
```

#### **Third-Party Services**
```yaml
Azure OpenAI:
  Endpoint: https://prod-hms-openai.cognitiveservices.azure.com/
  Deployment: gpt-4o-production
  API Version: 2024-02-15-preview
  Rate Limit: 5000 req/min
  Fallback: Secondary endpoint enabled

Google Cloud Vision:
  Project ID: movi-labs-production
  Service Account: prod-vision@movi-labs.iam.gserviceaccount.com
  Fallback: Enabled

Telegram Bot:
  Bot Token: *** (Stored in Key Vault)
  Webhook URL: https://api.karurgastro.com/api/bot/webhook
  Fallback Webhook: https://api-backup.karurgastro.com/api/bot/webhook
```

#### **Feature Flags**
```javascript
{
  "enableTelegramBot": true,
  "enableOCR": true,
  "enableFollowUpSystem": true,
  "enablePayrollModule": true,
  "enableAdvancedReporting": true,
  "enableEmailNotifications": true,
  "debugMode": false,
  "logLevel": "error",
  "enablePerformanceMonitoring": true,
  "enableSecurityAudit": true,
  "enableAutoScaling": true
}
```

---

## Database Configuration

### MongoDB Atlas Configuration

#### Connection String Format
```bash
mongodb+srv://<username>:<password>@<cluster>.<region>.mongodb.net/<database>?retryWrites=true&w=majority&appName=<appName>
```

#### Environment-Specific Clusters

| Environment | Cluster Tier | Regions | Storage | RAM | vCPU |
|-------------|--------------|---------|---------|-----|------|
| DEV | M0 (Free) | Single | 512 MB | Shared | Shared |
| QA | M10 | Single | 10 GB | 2 GB | 2 vCPU |
| UAT | M20 | Multi (2) | 20 GB | 4 GB | 4 vCPU |
| PRE-PROD | M30 | Multi (3) | 40 GB | 8 GB | 2 vCPU |
| PROD | M40 | Multi (5) | 80 GB | 16 GB | 4 vCPU |

#### Database Access Control

```yaml
DEV:
  IP Whitelist: 0.0.0.0/0 (All IPs for development)
  Users:
    - dev_admin (readWrite, dbAdmin)
    - dev_app (readWrite)

QA:
  IP Whitelist: [QA Server IPs, CI/CD Pipeline IPs]
  Users:
    - qa_admin (readWrite, dbAdmin)
    - qa_app (readWrite)
    - qa_readonly (read)

UAT:
  IP Whitelist: [UAT Server IPs, Client IPs, Admin IPs]
  Users:
    - uat_admin (readWrite, dbAdmin)
    - uat_app (readWrite)
    - uat_readonly (read)

PRE-PROD:
  IP Whitelist: [Pre-Prod Server IPs, Admin IPs]
  Users:
    - preprod_admin (readWrite, dbAdmin)
    - preprod_app (readWrite)
    - preprod_readonly (read)

PROD:
  IP Whitelist: [Production Server IPs only, Admin IPs via VPN]
  Users:
    - prod_admin (readWrite, dbAdmin) - MFA Required
    - prod_app (readWrite)
    - prod_readonly (read)
    - prod_backup (backup, restore)
```

### PostgreSQL Configuration (Neon)

```yaml
Connection String: postgresql://neondb_owner:***@ep-orange-wave-a8tu73kp-pooler.eastus2.azure.neon.tech/neondb
Database: neondb
SSL Mode: require
Channel Binding: require
Pooling: Enabled
Max Connections: 100
```

---

## Deployment Pipelines

### CI/CD Architecture

```
┌─────────────┐
│   GitHub    │
│ Repository  │
└──────┬──────┘
       │
       │ Push/PR
       │
       ▼
┌─────────────────────────────┐
│   GitHub Actions / Jenkins  │
│   (CI Pipeline)             │
├─────────────────────────────┤
│ 1. Lint & Format Check      │
│ 2. Unit Tests               │
│ 3. Integration Tests        │
│ 4. Security Scan            │
│ 5. Build Docker Image       │
│ 6. Push to Container Registry│
└──────┬──────────────────────┘
       │
       │ Trigger Deploy
       │
       ▼
┌─────────────────────────────┐
│   Deployment Pipeline       │
│   (CD Pipeline)             │
├─────────────────────────────┤
│ DEV  → Auto Deploy          │
│ QA   → Auto Deploy          │
│ UAT  → Manual Approval      │
│ PRE  → Manual Approval      │
│ PROD → Multi-Approval       │
└─────────────────────────────┘
```

### Deployment Process

#### 1. **Development (DEV)**
```yaml
Trigger: Push to 'develop' branch
Approval: None (Auto-deploy)
Process:
  - Run tests
  - Build application
  - Deploy to DEV environment
  - Run smoke tests
Rollback: Automatic on failure
Notification: Slack #dev-deployments
```

#### 2. **Quality Assurance (QA)**
```yaml
Trigger: Push to 'qa' branch OR Scheduled (Daily 2 AM UTC)
Approval: None (Auto-deploy)
Process:
  - Run full test suite
  - Build application
  - Deploy to QA environment
  - Run automated E2E tests
  - Generate test report
Rollback: Automatic on test failure
Notification: Slack #qa-deployments, Email QA Team
```

#### 3. **User Acceptance Testing (UAT)**
```yaml
Trigger: Tag creation (e.g., v1.2.3-uat)
Approval: QA Lead approval required
Process:
  - Verify QA test results
  - Build production-like artifacts
  - Deploy to UAT environment
  - Run smoke tests
  - Notify stakeholders
Rollback: Manual decision
Notification: Email stakeholders, Slack #uat-deployments
```

#### 4. **Pre-Production (PRE-PROD)**
```yaml
Trigger: Tag creation (e.g., v1.2.3-rc1)
Approval: Tech Lead + Product Owner approval
Process:
  - Verify UAT sign-off
  - Build production artifacts
  - Deploy to PRE-PROD
  - Run comprehensive tests
  - Performance benchmarking
  - Security scan
Rollback: Manual decision with impact analysis
Notification: Email all stakeholders, Slack #preprod-deployments
```

#### 5. **Production (PROD)**
```yaml
Trigger: Tag creation (e.g., v1.2.3)
Approval: Tech Lead + Product Owner + CTO approval
Process:
  - Verify PRE-PROD validation
  - Schedule maintenance window
  - Backup production database
  - Blue-Green deployment
  - Gradual traffic shift (10% → 50% → 100%)
  - Monitor metrics for 1 hour
  - Final cutover
Rollback: Automatic on critical alerts, Manual on issues
Notification: All channels, Status page update
Maintenance Window: Saturdays 2-4 AM IST (Preferred)
```

### Pipeline Configuration Files

#### GitHub Actions (`.github/workflows/ci-cd.yml`)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [develop, qa, main]
    tags: ['v*']
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Security scan
        run: npm audit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t hms:${{ github.sha }} .
      - name: Push to registry
        run: docker push hms:${{ github.sha }}

  deploy-dev:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: development
    steps:
      - name: Deploy to DEV
        run: ./scripts/deploy.sh dev

  deploy-qa:
    needs: build
    if: github.ref == 'refs/heads/qa'
    runs-on: ubuntu-latest
    environment: qa
    steps:
      - name: Deploy to QA
        run: ./scripts/deploy.sh qa

  deploy-uat:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v') && contains(github.ref, 'uat')
    runs-on: ubuntu-latest
    environment: uat
    steps:
      - name: Deploy to UAT
        run: ./scripts/deploy.sh uat

  deploy-prod:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v') && !contains(github.ref, 'uat') && !contains(github.ref, 'rc')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        run: ./scripts/deploy.sh prod
```

---

## Feature Flags

### Feature Flag Management

Feature flags are managed via environment variables and can be toggled without code deployment.

#### Configuration Location
```bash
# Stored in Azure Key Vault
# Accessed via environment variables
# Updated via admin panel or Azure Portal
```

#### Available Feature Flags

| Flag Name | Type | Default | Description |
|-----------|------|---------|-------------|
| `ENABLE_TELEGRAM_BOT` | boolean | `true` | Enable/disable Telegram bot integration |
| `ENABLE_OCR` | boolean | `true` | Enable/disable OCR for document processing |
| `ENABLE_FOLLOW_UP_SYSTEM` | boolean | `true` | Enable advanced follow-up management |
| `ENABLE_PAYROLL_MODULE` | boolean | `true` | Enable payroll management module |
| `ENABLE_ADVANCED_REPORTING` | boolean | `true` | Enable advanced analytics and reports |
| `ENABLE_EMAIL_NOTIFICATIONS` | boolean | `true` | Enable email notifications |
| `ENABLE_SMS_NOTIFICATIONS` | boolean | `false` | Enable SMS notifications (planned) |
| `ENABLE_PERFORMANCE_MONITORING` | boolean | `true` | Enable APM and performance tracking |
| `ENABLE_SECURITY_AUDIT` | boolean | `true` | Enable security audit logging |
| `ENABLE_AUTO_SCALING` | boolean | `true` | Enable auto-scaling (PROD only) |
| `DEBUG_MODE` | boolean | `false` | Enable debug logging |
| `LOG_LEVEL` | string | `info` | Logging level: debug, info, warn, error |
| `MAX_FILE_UPLOAD_SIZE` | number | `10485760` | Max file size in bytes (10MB) |
| `SESSION_TIMEOUT` | number | `3600` | Session timeout in seconds |
| `RATE_LIMIT_WINDOW` | number | `900` | Rate limit window in seconds |
| `RATE_LIMIT_MAX_REQUESTS` | number | `100` | Max requests per window |

#### Feature Flag Usage

```javascript
// In Node.js backend
const isFeatureEnabled = (featureName) => {
  return process.env[`ENABLE_${featureName}`] === 'true';
};

// Example usage
if (isFeatureEnabled('TELEGRAM_BOT')) {
  // Initialize Telegram bot
}

// In Flutter frontend
const bool isTelegramEnabled = 
  bool.fromEnvironment('ENABLE_TELEGRAM_BOT', defaultValue: true);
```

#### Feature Flag Override (Admin Panel)

Admins can temporarily override feature flags via the admin panel:

```
https://admin.karurgastro.com/settings/feature-flags
```

---

## Environment Variables Reference

### Core Application Variables

```bash
# Application
NODE_ENV=production                    # Environment: development, qa, uat, preprod, production
PORT=5000                              # Server port
APP_NAME=Karur Gastro HMS
APP_VERSION=1.0.0

# Database
MONGO_URL=mongodb+srv://...            # MongoDB connection string
MONGO_DB_NAME=hms_production          # Database name
POSTGRES_URL=postgresql://...          # PostgreSQL connection (Neon)

# Authentication
JWT_SECRET=***                         # JWT signing secret (rotate quarterly)
JWT_ACCESS_SECRET=***                  # Access token secret
JWT_REFRESH_SECRET=***                 # Refresh token secret
ACCESS_TOKEN_EXPIRES_IN=1005m          # 16.75 hours
REFRESH_TOKEN_EXPIRES_DAYS=30          # 30 days
SALT_ROUNDS=10                         # Bcrypt salt rounds

# Azure OpenAI
AZURE_OPENAI_API_KEY=***
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_ENDPOINT=https://...

# Google Cloud
GCP_SERVICE_ACCOUNT={"type":"service_account",...}
GCP_PROJECT_ID=movi-labs

# Gemini AI
GEMINI_API_KEY=***

# Telegram Bot
TELEGRAM_API_KEY=***
TELEGRAM_WEBHOOK_URL=https://api.karurgastro.com/api/bot/webhook

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=***
SMTP_PASSWORD=***
EMAIL_FROM=noreply@karurgastro.com

# File Storage
MAX_FILE_SIZE=10485760                 # 10MB in bytes
UPLOAD_PATH=/var/www/uploads
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# Logging
LOG_LEVEL=error                        # debug, info, warn, error
LOG_TO_FILE=true
LOG_FILE_PATH=/var/log/hms/app.log

# Monitoring
ENABLE_APM=true
APM_SERVICE_NAME=karur-hms
NEW_RELIC_LICENSE_KEY=***
SENTRY_DSN=***

# Feature Flags
ENABLE_TELEGRAM_BOT=true
ENABLE_OCR=true
ENABLE_FOLLOW_UP_SYSTEM=true
ENABLE_PAYROLL_MODULE=true
ENABLE_ADVANCED_REPORTING=true
ENABLE_EMAIL_NOTIFICATIONS=true

# Security
ENABLE_CORS=true
CORS_ORIGIN=https://hms.karurgastro.com
ENABLE_HELMET=true
ENABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW=900                  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Security & Access Control

### Azure Key Vault Configuration

All secrets are stored in Azure Key Vault:

```yaml
Vault Name: hms-keyvault-prod
Resource Group: hms-production-rg
Location: East US
Access Policies:
  - Principal: HMS Production App Service
    Permissions: Get, List
  - Principal: DevOps Team
    Permissions: All
  - Principal: Admin Group
    Permissions: Get, List, Set
```

### Access Control Matrix

| Role | DEV | QA | UAT | PRE-PROD | PROD |
|------|-----|----|----|----------|------|
| Developer | Full | Read/Write | Read | Read | Read (Emergency) |
| QA Engineer | Read | Full | Read/Write | Read | No Access |
| DevOps | Full | Full | Full | Full | Full |
| Product Owner | Read | Read | Full | Full | Read/Write |
| Admin | Full | Full | Full | Full | Full |
| Support | No Access | No Access | Read | Read | Read |

### SSL/TLS Configuration

```yaml
Protocol: TLS 1.3
Certificate Provider: Let's Encrypt
Auto-Renewal: Enabled
HSTS: Enabled
Certificate Pinning: Enabled (Mobile apps)
```

### Network Security

```yaml
Firewall: Azure Firewall + CloudFlare WAF
DDoS Protection: CloudFlare
IP Whitelisting: Enabled for admin endpoints
VPN: Required for production database access
```

---

## Monitoring & Logging

### Application Performance Monitoring (APM)

```yaml
Service: New Relic
Dashboard: https://newrelic.com/karur-hms
Metrics:
  - Response time (p50, p95, p99)
  - Error rate
  - Transaction throughput
  - Database query performance
  - Memory usage
  - CPU utilization

Alerts:
  - Error rate > 1%
  - Response time p95 > 2s
  - Database connection pool exhaustion
  - Memory usage > 80%
  - Failed deployments
```

### Log Aggregation

```yaml
Service: Azure Log Analytics + Sentry
Log Retention:
  - DEV/QA: 7 days
  - UAT: 30 days
  - PRE-PROD: 60 days
  - PROD: 90 days

Log Levels by Environment:
  - DEV: debug
  - QA: info
  - UAT: info
  - PRE-PROD: warn
  - PROD: error
```

### Uptime Monitoring

```yaml
Service: UptimeRobot + StatusCake
Check Interval: 1 minute
Monitored Endpoints:
  - Homepage
  - API Health Check
  - Database Connection
  - Authentication Service
  - Critical API Endpoints

Alerts:
  - Email: devops@karurgastro.com
  - SMS: Critical alerts only
  - Slack: #production-alerts
```

---

## Disaster Recovery

### Backup Strategy

| Environment | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| PROD | Every 2 hours | 90 days | Multi-region (Primary: East US, Secondary: West Europe) |
| PRE-PROD | Every 6 hours | 60 days | East US |
| UAT | Daily | 30 days | East US |
| QA | Daily | 14 days | East US |
| DEV | Daily | 7 days | East US |

### Recovery Time Objective (RTO) & Recovery Point Objective (RPO)

| Environment | RTO | RPO | Priority |
|-------------|-----|-----|----------|
| PROD | 1 hour | 15 minutes | Critical |
| PRE-PROD | 4 hours | 6 hours | High |
| UAT | 8 hours | 24 hours | Medium |
| QA | 24 hours | 24 hours | Low |
| DEV | 48 hours | 48 hours | Low |

### Disaster Recovery Plan

1. **Trigger Event**: System outage, data corruption, security breach
2. **Assess Severity**: Critical, High, Medium, Low
3. **Activate DR Team**: On-call engineer + DevOps lead
4. **Isolate Issue**: Prevent further damage
5. **Restore from Backup**: Use most recent clean backup
6. **Verify Data Integrity**: Run validation scripts
7. **Switch to Secondary Region**: If primary region down
8. **Communicate**: Update status page, notify stakeholders
9. **Post-Mortem**: Document incident and lessons learned

---

## Contact Information

### Support Escalation

```yaml
Level 1 - DevOps Team:
  Email: devops@karurgastro.com
  Slack: #devops-support
  Response Time: 2 hours (business hours)

Level 2 - Tech Lead:
  Email: tech.lead@karurgastro.com
  Phone: +91-XXXX-XXXXXX
  Response Time: 1 hour (business hours), 4 hours (after hours)

Level 3 - CTO:
  Email: cto@karurgastro.com
  Phone: +91-XXXX-XXXXXX
  Response Time: Critical issues only

On-Call Rotation:
  Schedule: https://pagerduty.com/karur-hms
  Primary: Week 1 & 3
  Secondary: Week 2 & 4
```

### Emergency Contacts

```yaml
Production Outage:
  - Slack: #production-critical (Pings entire team)
  - Phone: +91-XXXX-XXXXXX (On-call hotline)
  - Email: critical@karurgastro.com

Security Incident:
  - Email: security@karurgastro.com
  - Phone: +91-XXXX-XXXXXX (Security team)
  - Escalate to CTO immediately
```

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-04 | DevOps Team | Initial documentation |

---

**Document Classification:** CONFIDENTIAL  
**Distribution:** Internal only - DevOps, Development, and Management teams  
**Review Cycle:** Quarterly  
**Next Review Date:** 2025-03-04

---

*This document contains sensitive information including credentials, API keys, and infrastructure details. Unauthorized access or distribution is prohibited.*
