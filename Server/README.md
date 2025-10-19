# 🏥 Karur Gastro Foundation - HMS Backend

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-AI_Bot-3776AB?logo=python)](https://www.python.org/)

A robust and scalable backend API for the Karur Gastro Foundation Hospital Management System, built with Node.js, Express, MongoDB, and integrated AI-powered chatbot services.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [AI Chatbot](#-ai-chatbot)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)

## 🌟 Overview

This backend system provides a comprehensive RESTful API for hospital management operations including user authentication, appointment scheduling, patient records, pharmacy management, and an intelligent AI chatbot for patient assistance.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (SuperAdmin, Admin, Doctor, Staff)
- Secure password hashing with bcrypt
- Session management and audit logging
- Initial admin and doctor user creation

### 👥 User Management
- Multi-role user system
- Staff and doctor profile management
- User activation/deactivation
- Profile updates and credentials management

### 📅 Appointment System
- Schedule and manage appointments
- Doctor availability tracking
- Appointment status management
- Calendar integration
- Patient appointment history

### 👤 Patient Management
- Complete patient records (CRUD operations)
- Medical history tracking
- Lab reports and prescriptions
- Patient PDF document generation
- Intake form processing

### 💊 Pharmacy Management
- Medicine inventory tracking
- Medicine batch management
- Stock monitoring
- Prescription management
- Pharmacy records

### 🧪 Laboratory & Reports
- Lab report management
- PDF report generation
- Report file upload and storage
- Report history tracking

### 🤖 AI-Powered Chatbot
- Natural language processing (NLP)
- Intent recognition
- Medical appointment booking via chat
- Patient query handling
- Multi-language support
- Conversation history
- RAG (Retrieval-Augmented Generation) for accurate responses

### 📄 Document Management
- File upload and storage
- PDF processing and parsing
- Image processing with Sharp
- Document scanner integration
- Google Cloud Vision API integration

### 📊 Audit & Logging
- Comprehensive audit trail
- User activity tracking
- System logs
- Error monitoring

## 🛠️ Tech Stack

### Backend Framework
- **Node.js** - Runtime environment
- **Express.js** (v5.1.0) - Web framework
- **MongoDB** (v6.19.0) - Database
- **Mongoose** (v8.18.0) - ODM

### Authentication & Security
- **jsonwebtoken** (v9.0.2) - JWT authentication
- **bcryptjs** (v3.0.2) - Password hashing
- **cors** (v2.8.5) - Cross-Origin Resource Sharing
- **dotenv** (v17.2.3) - Environment configuration

### File & Document Processing
- **multer** (v2.0.2) - File upload handling
- **sharp** (v0.34.4) - Image processing
- **pdf-parse** (v2.2.13) - PDF parsing
- **uuid** (v8.3.2) - Unique identifier generation

### AI & Machine Learning (Python)
- **FastAPI** (v0.115.0) - Python web framework
- **PyTorch** (v2.5.1+cpu) - Deep learning
- **Transformers** (v4.44.2) - NLP models
- **spaCy** (v3.7.2) - Advanced NLP
- **OpenAI** (v1.47.0) - GPT integration
- **Google Generative AI** (v0.24.1) - Gemini AI
- **Azure Cognitive Services** - Speech recognition

### External Services
- **Google Cloud Vision** (v5.3.3) - Image analysis
- **axios** (v1.12.2) - HTTP client

### Python AI Stack
- **Streamlit** (v1.38.0) - Interactive UI
- **pymongo** (v4.10.1) - MongoDB driver
- **langdetect** (v1.0.9) - Language detection
- **dateparser** (v1.2.0) - Date parsing

## 📁 Project Structure

```
Server/
├── 🚀 Server.js                    # Main application entry point
├── 📦 package.json                 # Node.js dependencies
├── 🔧 .env                         # Environment variables (not in repo)
├── 🗃️ Config/                      # Configuration files
│   └── Dbconfig.js                 # MongoDB connection setup
├── 📊 Models/                      # Mongoose data models
│   ├── index.js                    # Model exports
│   ├── User.js                     # User model (UUID-based)
│   ├── Staff.js                    # Staff model
│   ├── Patient.js                  # Patient model
│   ├── Appointment.js              # Appointment model
│   ├── Medicine.js                 # Medicine model
│   ├── MedicineBatch.js            # Medicine batch model
│   ├── PharmacyRecord.js           # Pharmacy transaction model
│   ├── LabReport.js                # Lab report model
│   ├── Intake.js                   # Patient intake model
│   ├── File.js                     # File metadata model
│   ├── PatientPDF.js               # Patient PDF documents
│   ├── Bot.js                      # Chatbot conversation model
│   ├── AuthSession.js              # Authentication session model
│   ├── AuditLog.js                 # Audit logging model
│   └── common.js                   # Common model utilities
├── 🛣️ routes/                      # API route handlers
│   ├── auth.js                     # Authentication routes
│   ├── staff.js                    # Staff management routes
│   ├── doctors.js                  # Doctor management routes
│   ├── patients.js                 # Patient management routes
│   ├── appointment.js              # Appointment routes
│   ├── pharmacy.js                 # Pharmacy routes
│   ├── intake.js                   # Intake form routes
│   ├── scanner.js                  # Document scanner routes
│   └── bot.js                      # Chatbot proxy routes
├── 🔒 Middleware/                  # Express middleware
├── 🛠️ utils/                       # Utility functions
├── 📤 uploads/                     # File upload directory
├── 🌐 web/                         # Static web app files
├── 🤖 Bot/                         # AI Chatbot service (Python)
│   ├── app.py                      # FastAPI chatbot application
│   ├── nlp.py                      # NLP processing
│   ├── rag.py                      # RAG implementation
│   ├── mongo.py                    # MongoDB integration
│   ├── config.py                   # Python configuration
│   ├── requirements.txt            # Python dependencies
│   ├── runtime.txt                 # Python version
│   ├── apt.txt                     # System dependencies
│   ├── models/                     # ML models
│   └── logs/                       # Chatbot logs
└── 🖼️ image-processor/             # Image processing utilities

```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- ✅ Node.js (v16 or higher)
- ✅ npm or yarn
- ✅ MongoDB (v6.0 or higher)
- ✅ Python (v3.10 or higher) - for AI chatbot
- ✅ Git

### Installation

1️⃣ **Clone the repository**
```bash
git clone <repository-url>
cd karur/Server
```

2️⃣ **Install Node.js dependencies**
```bash
npm install
```

3️⃣ **Set up Python AI Chatbot**
```bash
cd Bot
pip install -r requirements.txt
cd ..
```

4️⃣ **Configure environment variables**

Create a `.env` file in the Server directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/karur_gastro_foundation
MONGO_DB_NAME=karur_gastro_foundation

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Initial Admin User
ADMIN_EMAIL=admin@karurgastro.com
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_ROLE=superadmin

# Initial Doctor User
DOCTOR_EMAIL=doctor@karurgastro.com
DOCTOR_PASSWORD=your_secure_doctor_password
DOCTOR_ROLE=doctor

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json

# OpenAI Configuration (for chatbot)
OPENAI_API_KEY=your_openai_api_key

# Azure Cognitive Services (for chatbot)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region

# Chatbot Configuration
LOG_TO_FILE=1
SPACY_TRANSFORMER=0
USE_MONGO_FOR_CONV=1
```

5️⃣ **Start MongoDB**

Ensure MongoDB is running:
```bash
# Linux/Mac
sudo systemctl start mongod

# Windows (if installed as service)
net start MongoDB

# Or run MongoDB directly
mongod --dbpath /path/to/your/data/directory
```

6️⃣ **Start the Backend Server**
```bash
npm start
# or for development with auto-reload
npm run dev
```

7️⃣ **Start the AI Chatbot Service** (in a separate terminal)
```bash
cd Bot
python app.py
# or
uvicorn app:app --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:3000`
The chatbot service will be available at: `http://localhost:8000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "staff",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST `/api/auth/login`
User login
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "uuid",
    "email": "user@example.com",
    "role": "staff",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Patient Endpoints

#### GET `/api/patients`
Get all patients (with pagination)
- Query params: `page`, `limit`, `search`

#### POST `/api/patients`
Create new patient
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "female",
  "phone": "+1234567890",
  "email": "jane.doe@example.com",
  "address": "123 Main St"
}
```

#### GET `/api/patients/:id`
Get patient by ID

#### PUT `/api/patients/:id`
Update patient information

#### DELETE `/api/patients/:id`
Delete patient

### Appointment Endpoints

#### GET `/api/appointments`
Get all appointments
- Query params: `date`, `doctorId`, `status`

#### POST `/api/appointments`
Create new appointment
```json
{
  "patientId": "patient_uuid",
  "doctorId": "doctor_uuid",
  "appointmentDate": "2024-01-20T10:00:00Z",
  "reason": "Regular checkup",
  "status": "scheduled"
}
```

#### PUT `/api/appointments/:id`
Update appointment

#### DELETE `/api/appointments/:id`
Cancel appointment

### Staff & Doctor Endpoints

#### GET `/api/staff`
Get all staff members

#### POST `/api/staff`
Create new staff member

#### GET `/api/doctors`
Get all doctors

#### PUT `/api/doctors/:id`
Update doctor information

### Pharmacy Endpoints

#### GET `/api/pharmacy/medicines`
Get all medicines

#### POST `/api/pharmacy/medicines`
Add new medicine

#### POST `/api/pharmacy/dispense`
Dispense medicine

#### GET `/api/pharmacy/inventory`
Get inventory status

### Chatbot Endpoints

#### POST `/api/bot/chat`
Send message to chatbot
```json
{
  "message": "I need to book an appointment",
  "userId": "user_uuid",
  "conversationId": "conversation_uuid"
}
```

#### POST `/api/bot/conversations`
Create new conversation

#### GET `/api/bot/conversations`
Get user conversations

#### GET `/api/bot/conversations/:id/messages`
Get conversation messages

### Scanner Endpoints

#### POST `/api/scanner/upload`
Upload and process document
- Multipart form data with file

## 🤖 AI Chatbot

### Features
- 🧠 Natural Language Understanding with spaCy
- 🎯 Intent recognition for appointments, queries, and medical information
- 📅 Smart date parsing and appointment scheduling
- 🌍 Multi-language support with automatic detection
- 💬 Conversation context management
- 📚 RAG-based responses using medical knowledge base
- 🔊 Voice interaction support (Azure Speech Services)
- 📊 Conversation analytics and logging

### Chatbot Architecture

```
User Input → Language Detection → Intent Classification → Entity Extraction
    ↓
Response Generation (RAG) → Context Management → Response to User
    ↓
MongoDB Storage (Conversation History)
```

### Supported Intents
- 📅 **Appointment Booking** - Schedule doctor appointments
- ❓ **General Query** - Answer medical questions
- 👤 **Patient Information** - Retrieve patient records
- 💊 **Medication Info** - Medicine information
- 🏥 **Hospital Services** - Information about services
- 🆘 **Emergency** - Emergency assistance routing

### Training & Customization

To add custom intents or improve NLP:

1. Update training data in `Bot/models/`
2. Modify intent patterns in `Bot/nlp.py`
3. Add new response templates in `Bot/rag.py`
4. Retrain the model if needed

## 🗄️ Database Schema

### Collections

#### Users
```javascript
{
  _id: UUID,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (enum: ['superadmin', 'admin', 'doctor', 'staff']),
  firstName: String,
  lastName: String,
  is_active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Patients
```javascript
{
  _id: UUID,
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  phone: String,
  email: String,
  address: Object,
  medicalHistory: Array,
  createdAt: Date,
  updatedAt: Date
}
```

#### Appointments
```javascript
{
  _id: UUID,
  patientId: UUID (ref: Patient),
  doctorId: UUID (ref: User),
  appointmentDate: Date,
  duration: Number,
  status: String (enum: ['scheduled', 'completed', 'cancelled', 'no-show']),
  reason: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Medicines
```javascript
{
  _id: UUID,
  name: String,
  genericName: String,
  manufacturer: String,
  category: String,
  dosageForm: String,
  strength: String,
  stockQuantity: Number,
  reorderLevel: Number,
  price: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 24h |
| `ADMIN_EMAIL` | Initial admin email | Yes | - |
| `ADMIN_PASSWORD` | Initial admin password | Yes | - |
| `DOCTOR_EMAIL` | Initial doctor email | Yes | - |
| `DOCTOR_PASSWORD` | Initial doctor password | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for chatbot | No | - |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud credentials path | No | - |
| `LOG_TO_FILE` | Enable file logging | No | 0 |

## 🚀 Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "Server.js"]
```

Build and run:
```bash
docker build -t karur-hms-backend .
docker run -p 3000:3000 --env-file .env karur-hms-backend
```

### Production Checklist

- ✅ Set `NODE_ENV=production`
- ✅ Use strong JWT secret
- ✅ Enable MongoDB authentication
- ✅ Set up SSL/TLS certificates
- ✅ Configure CORS for production domains
- ✅ Set up logging and monitoring
- ✅ Configure backup strategy
- ✅ Set up rate limiting
- ✅ Enable security headers
- ✅ Configure firewall rules

## 🔧 Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Database Migrations
```bash
npm run migrate
```

### Seed Database
```bash
npm run seed
```

## 📊 Monitoring & Logging

The application logs important events including:
- User authentication attempts
- API requests and responses
- Database operations
- Error stack traces
- Chatbot interactions

Logs are stored in:
- Console output
- `Bot/logs/chatbot.log` (if `LOG_TO_FILE=1`)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Check connection string format
# mongodb://username:password@host:port/database
```

### Python Chatbot Issues
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install python3-dev build-essential

# Reinstall Python packages
pip install --upgrade --force-reinstall -r Bot/requirements.txt
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
```

## 📄 License

This project is proprietary software for Karur Gastro Foundation.

## 📞 Support

For technical support and questions:
- 📧 Email: support@karurgastro.com
- 📱 Phone: [Contact Number]
- 🌐 Website: [Website URL]

---

🏥 **Built with ❤️ for Karur Gastro Foundation** | Powered by Node.js, MongoDB & AI
