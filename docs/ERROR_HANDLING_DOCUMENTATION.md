# Error Handling Documentation
## Karur Gastro Hospital Management System

**Version:** 1.0  
**Last Updated:** 2024-12-04  
**Document Owner:** Backend Team

---

## Table of Contents

1. [Error Handling Strategy](#error-handling-strategy)
2. [Error Code System](#error-code-system)
3. [Standard Error Format](#standard-error-format)
4. [HTTP Status Codes](#http-status-codes)
5. [Error Code Reference](#error-code-reference)
6. [Backend Error Handling](#backend-error-handling)
7. [Frontend Error Handling](#frontend-error-handling)
8. [Retry Logic](#retry-logic)
9. [Circuit Breaker Pattern](#circuit-breaker-pattern)
10. [Error Logging](#error-logging)
11. [Best Practices](#best-practices)

---

## Error Handling Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Error Flow                            │
└─────────────────────────────────────────────────────────┘

Client Request
     │
     ▼
┌──────────────┐
│ API Gateway  │ ─┐
└──────────────┘  │ Validation Error (400)
     │            │
     ▼            │
┌──────────────┐  │
│ Middleware   │ ─┤ Auth Error (401/403)
└──────────────┘  │
     │            │
     ▼            │
┌──────────────┐  │
│   Service    │ ─┤ Business Logic Error (400/404/409)
└──────────────┘  │
     │            │
     ▼            │
┌──────────────┐  │
│  Database    │ ─┘ Database Error (500)
└──────────────┘
     │
     ▼
Error Response (JSON)
     │
     ▼
Client Error Handler
     │
     ├─ Display to User
     ├─ Log Error
     └─ Retry (if applicable)
```

### Error Categories

| Category | HTTP Code Range | Description | Retry Strategy |
|----------|----------------|-------------|----------------|
| **Client Errors** | 400-499 | Invalid request, auth issues | No retry |
| **Server Errors** | 500-599 | Internal errors, database issues | Retry with backoff |
| **Validation Errors** | 400 | Invalid input data | No retry |
| **Authentication Errors** | 401 | Invalid/expired token | Refresh token |
| **Authorization Errors** | 403 | Insufficient permissions | No retry |
| **Not Found Errors** | 404 | Resource not found | No retry |
| **Conflict Errors** | 409 | Duplicate resource | No retry |

---

## Error Code System

### Code Structure

```
┌──────────────────────────────────────────────────────┐
│  Error Code Format: XXXX                             │
│                                                       │
│  X XXX                                               │
│  │  └──── Specific Error Number (001-999)          │
│  └─────── Category (1-9)                            │
│                                                       │
│  Categories:                                         │
│  1XXX - Authentication & Authorization               │
│  2XXX - Session & Token Management                   │
│  3XXX - Patient Management                           │
│  4XXX - Resource Access                              │
│  5XXX - Server & Database Errors                     │
│  6XXX - Pharmacy & Inventory                         │
│  7XXX - Pathology & Lab                              │
│  8XXX - (Reserved for future use)                    │
│  9XXX - (Reserved for future use)                    │
│  10XXX+ - Intake & Consultation                      │
└──────────────────────────────────────────────────────┘
```

### Error Severity Levels

| Level | Code Range | Description | Action Required |
|-------|-----------|-------------|-----------------|
| **CRITICAL** | - | System failure, data corruption | Immediate attention |
| **ERROR** | 5000-5999 | Operation failed | User notification |
| **WARNING** | 4000-4999 | Potential issue | Log and monitor |
| **INFO** | 1000-3999 | User action needed | User notification |

---

## Standard Error Format

### Backend Response Format

```javascript
// Standard Error Response
{
  "success": false,
  "message": "Human-readable error message",
  "errorCode": 1002,
  "details": {
    "field": "email",
    "value": "invalid@email",
    "constraint": "Valid email required"
  },
  "timestamp": "2024-12-04T10:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST",
  "stack": "Error: Invalid credentials..." // Only in development
}
```

### Error Response Schema

```typescript
interface ErrorResponse {
  success: false;
  message: string;              // User-friendly message
  errorCode: number;            // Application error code
  details?: any;                // Additional error details
  timestamp: string;            // ISO 8601 timestamp
  path: string;                 // Request path
  method: string;               // HTTP method
  stack?: string;               // Stack trace (dev only)
  requestId?: string;           // Request tracking ID
  validation?: ValidationError[]; // Validation errors
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}
```

### Success Response Format

```javascript
// Standard Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2024-12-04T10:30:00.000Z"
  }
}
```

---

## HTTP Status Codes

### Complete Status Code Mapping

| HTTP Code | Meaning | Use Case | Error Code Range |
|-----------|---------|----------|------------------|
| **200** | OK | Successful GET, PUT, PATCH | - |
| **201** | Created | Successful POST (resource created) | - |
| **204** | No Content | Successful DELETE | - |
| **400** | Bad Request | Invalid input, validation failure | 1000-4999 |
| **401** | Unauthorized | Missing/invalid authentication | 1000-1999, 2000-2999 |
| **403** | Forbidden | Insufficient permissions | 1009, 4010 |
| **404** | Not Found | Resource not found | 1007, 3007, 6007 |
| **409** | Conflict | Duplicate resource | 6003, 2008 |
| **422** | Unprocessable Entity | Validation error | - |
| **429** | Too Many Requests | Rate limit exceeded | - |
| **500** | Internal Server Error | Server/database error | 5000-5999 |
| **502** | Bad Gateway | External service error | - |
| **503** | Service Unavailable | Service down | - |
| **504** | Gateway Timeout | Request timeout | - |

### Status Code Selection Guide

```javascript
// ✅ CORRECT
if (!email) {
  return res.status(400).json({ 
    message: 'Email is required',
    errorCode: 1000 
  });
}

// ✅ CORRECT
const user = await User.findById(id);
if (!user) {
  return res.status(404).json({ 
    message: 'User not found',
    errorCode: 3007 
  });
}

// ✅ CORRECT
if (req.user.role !== 'admin') {
  return res.status(403).json({ 
    message: 'Forbidden',
    errorCode: 1009 
  });
}

// ❌ INCORRECT (Should be 404, not 400)
if (!user) {
  return res.status(400).json({ message: 'User not found' });
}

// ❌ INCORRECT (Should be 403, not 401)
if (req.user.role !== 'admin') {
  return res.status(401).json({ message: 'Not authorized' });
}
```

---

## Error Code Reference

### 1XXX - Authentication & Authorization

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 1000 | Please enter email and password | 400 | Missing login credentials |
| 1002 | Invalid credentials | 400 | Incorrect email/password |
| 1003 | Invalid credentials (incorrect password) | 400 | Password mismatch |
| 1006 | Missing required fields: patientId, appointmentType, startAt | 400 | Appointment missing fields |
| 1007 | Appointment/Patient not found | 404 | Resource not found |
| 1008 | Status is required | 400 | Missing status field |
| 1009 | Forbidden | 403 | Insufficient permissions |
| 1010 | Not authorized to create follow-up for this appointment | 403 | Permission denied |

### 2XXX - Session & Token Management

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 2000 | Missing refresh token or identifiers | 400 | Token refresh requires token |
| 2001 | Session not found / Invalid refresh token | 401 | Session expired/invalid |
| 2002 | User not found | 404 | User account deleted |
| 2006 | Missing required field: staffId | 400 | Staff ID required |
| 2007 | Payroll/Staff not found | 404 | Record not found |
| 2008 | Payroll already exists for this staff and period | 409 | Duplicate payroll |
| 2009 | Payroll already approved or paid | 400 | Cannot modify paid payroll |
| 2010 | Payroll must be approved before processing payment | 400 | Workflow violation |
| 2011 | Cannot delete processed or paid payroll | 400 | Delete prevented |

### 3XXX - Patient Management

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 3000 | No session identifier provided | 401 | Missing session ID |
| 3001 | Session not found | 401 | Invalid session |
| 3006 | Missing required fields: firstName, phone | 400 | Patient registration incomplete |
| 3007 | Patient not found | 404 | Patient does not exist |

### 4XXX - Resource Access

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 4001 | Patient not found (card) | 404 | Card data unavailable |
| 4010 | Forbidden (non-doctor access) | 403 | Doctor-only endpoint |

### 5XXX - Server & Database Errors

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 5000 | Failed to create appointment / Server error | 500 | Internal server error |
| 5001 | Failed to fetch appointments | 500 | Database read error |
| 5002 | Failed to fetch appointment | 500 | Single record fetch failed |
| 5003 | Failed to update status | 500 | Update operation failed |
| 5004 | Failed to delete appointment | 500 | Delete operation failed |
| 5005 | Failed to update appointment | 500 | Update failed |
| 5006 | Failed to create follow-up appointment | 500 | Follow-up creation failed |
| 5007 | Failed to fetch follow-up history | 500 | History retrieval failed |
| 5008 | Failed to fetch follow-up chain | 500 | Chain fetch failed |

### 6XXX - Pharmacy & Inventory

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 6001 | Missing required field: name (medicine) | 400 | Medicine name required |
| 6002 | Forbidden: admin/pharmacist role required | 403 | Role check failed |
| 6003 | Medicine with this SKU already exists | 409 | Duplicate SKU |
| 6004 | Cannot delete medicine with existing batches or records | 400 | Delete prevented |
| 6007 | Medicine not found | 404 | Medicine does not exist |
| 6101 | medicineId and quantity are required | 400 | Batch fields missing |
| 6102 | Medicine not found (batch creation) | 404 | Parent medicine missing |
| 6103 | Batch not found | 404 | Batch does not exist |
| 6201 | No items provided | 400 | Empty dispense request |
| 6202 | Patient not found (dispense) | 404 | Patient missing |
| 6203 | Invalid item: medicineId & positive quantity required | 400 | Item validation failed |
| 6208 | Record not found | 404 | Pharmacy record missing |
| 6209 | Intake not found | 404 | Intake missing |
| 6210 | No medicine items provided | 400 | Empty items array |
| 6211 | Prescription already dispensed | 400 | Duplicate dispense |
| 6301 | medicines array is required | 400 | Prescription empty |

### 7XXX - Pathology & Lab

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 7001 | Intake model not available | 500 | Model loading failed |
| 7002 | Forbidden: admin/pathologist role required | 403 | Role check failed |
| 7006 | patientId is required | 400 | Patient ID missing |
| 7007 | Patient not found (lab report) | 404 | Patient missing |
| 7010 | Lab report not found | 404 | Report missing |

### 10XXX+ - Intake & Consultation

| Code | Message | HTTP Status | Description |
|------|---------|-------------|-------------|
| 10010 | id (param) is required | 400 | Missing intake ID |
| 10011 | patientId or patientSnapshot required | 400 | Patient data missing |
| 10012 | patientSnapshot.firstName is required | 400 | Name missing |
| 10020 | patientId (param) is required | 400 | Patient ID missing |
| 10030 | patientId and intakeId are required | 400 | Multiple IDs missing |
| 10031 | Intake not found | 404 | Intake missing |
| 10032 | Forbidden (intake access) | 403 | Access denied |

---

## Backend Error Handling

### Try-Catch Pattern

```javascript
// Standard Try-Catch Pattern
router.post('/api/resource', authMiddleware, async (req, res) => {
  try {
    // 1. Input Validation
    const { field1, field2 } = req.body;
    if (!field1) {
      return res.status(400).json({
        success: false,
        message: 'Field1 is required',
        errorCode: 1000,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }

    // 2. Business Logic
    const resource = await Model.create({ field1, field2 });

    // 3. Success Response
    return res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resource
    });

  } catch (error) {
    // 4. Error Logging
    console.error('CREATE RESOURCE ERROR:', error);

    // 5. Error Response
    return res.status(500).json({
      success: false,
      message: 'Failed to create resource',
      errorCode: 5000,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});
```

### Validation Error Handling

```javascript
// Multiple Field Validation
router.post('/api/appointments', async (req, res) => {
  try {
    const { patientId, doctorId, startAt } = req.body;
    const errors = [];

    if (!patientId) errors.push({ field: 'patientId', message: 'Patient ID is required' });
    if (!doctorId) errors.push({ field: 'doctorId', message: 'Doctor ID is required' });
    if (!startAt) errors.push({ field: 'startAt', message: 'Start time is required' });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errorCode: 1006,
        validation: errors,
        timestamp: new Date().toISOString()
      });
    }

    // Continue with business logic...
  } catch (error) {
    // Handle error
  }
});
```

### Database Error Handling

```javascript
// Database Operation Error Handling
router.get('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);

    // Handle not found
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        errorCode: 3007,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: patient
    });

  } catch (error) {
    // Database connection error
    if (error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error',
        errorCode: 5000,
        timestamp: new Date().toISOString()
      });
    }

    // Generic database error
    console.error('DATABASE ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Database operation failed',
      errorCode: 5001,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Authentication Error Handling

```javascript
// Middleware Error Handling
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token') || 
                  req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied',
        errorCode: 2000,
        timestamp: new Date().toISOString()
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        errorCode: 2001,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('AUTH MIDDLEWARE ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      errorCode: 5000,
      timestamp: new Date().toISOString()
    });
  }
};
```

---

## Frontend Error Handling

### Flutter/Dart Error Handling

```dart
// Dio API Handler Error Handling
Future<dynamic> _handleResponse(Response response) {
  if (response.statusCode == null) {
    throw Exception('No response from server');
  }

  // Success responses (200-299)
  if (response.statusCode! >= 200 && response.statusCode! < 300) {
    return Future.value(response.data);
  }

  // Error responses
  final errorData = response.data is Map ? response.data : {};
  final errorMessage = errorData['message'] ?? 'Unknown error occurred';
  final errorCode = errorData['errorCode'] ?? 0;

  // Handle specific error codes
  switch (errorCode) {
    case 1002:
    case 1003:
      throw AuthenticationException(errorMessage);
    
    case 2001:
      throw TokenExpiredException(errorMessage);
    
    case 1009:
    case 4010:
      throw PermissionDeniedException(errorMessage);
    
    case 3007:
    case 6007:
      throw NotFoundException(errorMessage);
    
    default:
      throw ApiException(errorMessage, errorCode);
  }
}
```

### Custom Exception Classes

```dart
// Custom Exception Classes
class ApiException implements Exception {
  final String message;
  final int errorCode;
  
  ApiException(this.message, this.errorCode);
  
  @override
  String toString() => 'ApiException: $message (Code: $errorCode)';
}

class AuthenticationException extends ApiException {
  AuthenticationException(String message) : super(message, 1002);
}

class TokenExpiredException extends ApiException {
  TokenExpiredException(String message) : super(message, 2001);
}

class PermissionDeniedException extends ApiException {
  PermissionDeniedException(String message) : super(message, 1009);
}

class NotFoundException extends ApiException {
  NotFoundException(String message) : super(message, 404);
}

class ValidationException extends ApiException {
  final List<ValidationError> errors;
  
  ValidationException(String message, this.errors) : super(message, 1000);
}
```

### Error Handling in UI

```dart
// UI Error Handling
Future<void> loginUser(String email, String password) async {
  try {
    final response = await DioApiHandler.instance.post(
      '/api/auth/login',
      body: {
        'email': email,
        'password': password,
      },
    );
    
    // Handle success
    _handleLoginSuccess(response);
    
  } on AuthenticationException catch (e) {
    // Show user-friendly message
    _showErrorDialog('Login Failed', e.message);
    
  } on TokenExpiredException catch (e) {
    // Redirect to login
    _handleTokenExpired();
    
  } on DioException catch (e) {
    if (e.type == DioExceptionType.connectionTimeout) {
      _showErrorDialog('Connection Timeout', 'Please check your internet connection');
    } else if (e.type == DioExceptionType.receiveTimeout) {
      _showErrorDialog('Server Timeout', 'Server is taking too long to respond');
    } else {
      _showErrorDialog('Network Error', 'Unable to connect to server');
    }
    
  } catch (e) {
    // Generic error
    _showErrorDialog('Error', 'An unexpected error occurred');
  }
}
```

---

## Retry Logic

### Backend Retry Configuration

```javascript
// Retry with Exponential Backoff
async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Last attempt - throw error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Usage
router.post('/api/external-service', async (req, res) => {
  try {
    const result = await retryOperation(async () => {
      return await externalApiCall(req.body);
    }, 3, 1000);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'External service failed after retries',
      errorCode: 5000 
    });
  }
});
```

### Frontend Retry Configuration (Dio)

```dart
// Dio Retry Interceptor
class RetryInterceptor extends Interceptor {
  final int maxRetries;
  final Duration retryDelay;
  
  RetryInterceptor({
    this.maxRetries = 3,
    this.retryDelay = const Duration(seconds: 1),
  });
  
  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Get retry count from request options
    final attempt = err.requestOptions.extra['retryAttempt'] ?? 0;
    
    // Check if should retry
    if (attempt >= maxRetries || !_shouldRetry(err)) {
      return handler.next(err);
    }
    
    // Calculate delay with exponential backoff
    final delay = retryDelay * math.pow(2, attempt);
    
    debugPrint('Retry attempt ${attempt + 1}/$maxRetries after ${delay.inMilliseconds}ms');
    
    await Future.delayed(delay);
    
    // Increment retry count
    err.requestOptions.extra['retryAttempt'] = attempt + 1;
    
    // Retry the request
    try {
      final response = await _dio.fetch(err.requestOptions);
      return handler.resolve(response);
    } catch (e) {
      return handler.next(err);
    }
  }
  
  bool _shouldRetry(DioException err) {
    // Only retry on network errors or 5xx server errors
    return err.type == DioExceptionType.connectionTimeout ||
           err.type == DioExceptionType.receiveTimeout ||
           err.type == DioExceptionType.sendTimeout ||
           (err.response != null && err.response!.statusCode! >= 500);
  }
}
```

### Retry Strategy Table

| Scenario | Max Retries | Base Delay | Backoff | Retry On |
|----------|-------------|------------|---------|----------|
| **Database Operations** | 3 | 1s | Exponential | 500, 503 |
| **External API Calls** | 5 | 2s | Exponential | Timeout, 500-503 |
| **File Uploads** | 2 | 3s | Linear | Timeout, 500 |
| **Authentication** | 0 | - | - | Never |
| **Validation Errors** | 0 | - | - | Never |

---

## Circuit Breaker Pattern

### Implementation

```javascript
// Circuit Breaker for External Services
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try to recover
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log('Circuit breaker CLOSED');
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`Circuit breaker OPEN until ${new Date(this.nextAttempt)}`);
    }
  }
}

// Usage
const azureOpenAIBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000
});

router.post('/api/ai/chat', async (req, res) => {
  try {
    const response = await azureOpenAIBreaker.execute(async () => {
      return await azureOpenAI.chat(req.body.message);
    });
    
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable',
        errorCode: 5000
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'AI service error',
      errorCode: 5000
    });
  }
});
```

---

## Error Logging

### Logging Levels

```javascript
// Logging Configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Structured Logging

```javascript
// Structured Error Logging
function logError(error, context = {}) {
  logger.error({
    message: error.message,
    errorCode: context.errorCode,
    stack: error.stack,
    path: context.path,
    method: context.method,
    userId: context.userId,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...context
  });
}

// Usage in route
router.post('/api/resource', async (req, res) => {
  try {
    // ... operation
  } catch (error) {
    logError(error, {
      errorCode: 5000,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Operation failed',
      errorCode: 5000
    });
  }
});
```

### External Error Tracking (Sentry)

```javascript
// Sentry Integration
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error handler middleware
app.use((err, req, res, next) => {
  // Log to Sentry
  Sentry.captureException(err, {
    extra: {
      path: req.path,
      method: req.method,
      body: req.body,
      user: req.user
    }
  });
  
  // Send response
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    errorCode: err.errorCode || 5000
  });
});
```

---

## Best Practices

### ✅ DO's

1. **Always use try-catch blocks** for async operations
2. **Return appropriate HTTP status codes** (400 for client errors, 500 for server errors)
3. **Include error codes** in all error responses
4. **Log errors with context** (user ID, request path, timestamp)
5. **Validate input** before processing
6. **Use custom error classes** for different error types
7. **Implement retry logic** for transient failures
8. **Sanitize error messages** before sending to client (no stack traces in production)
9. **Monitor error rates** and set up alerts
10. **Document all error codes** with examples

### ❌ DON'Ts

1. **Don't expose stack traces** in production
2. **Don't use generic error messages** ("Something went wrong")
3. **Don't retry authentication failures** (4xx errors)
4. **Don't log sensitive data** (passwords, tokens)
5. **Don't swallow errors** (catch without logging)
6. **Don't use wrong HTTP status codes** (401 vs 403, 404 vs 400)
7. **Don't hard-code error messages** (use constants)
8. **Don't skip error handling** in async functions
9. **Don't ignore error codes** in frontend
10. **Don't return different formats** for errors

### Error Handling Checklist

```markdown
□ Input validation with clear error messages
□ Try-catch blocks for all async operations
□ Appropriate HTTP status codes
□ Error codes for all error responses
□ Structured error logging
□ User-friendly error messages
□ No sensitive data in errors
□ Retry logic for transient failures
□ Circuit breaker for external services
□ Error monitoring and alerting
□ Documentation for all error codes
□ Frontend error handling for all API calls
□ Graceful degradation for non-critical failures
```

---

## Error Response Examples

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": 1006,
  "validation": [
    {
      "field": "patientId",
      "message": "Patient ID is required",
      "constraint": "required"
    },
    {
      "field": "startAt",
      "message": "Start time must be in the future",
      "value": "2024-01-01T10:00:00.000Z",
      "constraint": "futureDate"
    }
  ],
  "timestamp": "2024-12-04T10:30:00.000Z",
  "path": "/api/appointments",
  "method": "POST"
}
```

### Authentication Error

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "errorCode": 2001,
  "timestamp": "2024-12-04T10:30:00.000Z",
  "path": "/api/patients",
  "method": "GET"
}
```

### Not Found Error

```json
{
  "success": false,
  "message": "Patient not found",
  "errorCode": 3007,
  "details": {
    "patientId": "12345-abcde"
  },
  "timestamp": "2024-12-04T10:30:00.000Z",
  "path": "/api/patients/12345-abcde",
  "method": "GET"
}
```

### Server Error

```json
{
  "success": false,
  "message": "Failed to create appointment",
  "errorCode": 5000,
  "timestamp": "2024-12-04T10:30:00.000Z",
  "path": "/api/appointments",
  "method": "POST",
  "requestId": "req-uuid-12345"
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-04  
**Maintained By:** Backend Team  
**Next Review:** 2025-03-04

---

*This document describes error handling standards and practices. All developers must follow these guidelines when implementing new features or fixing bugs.*
