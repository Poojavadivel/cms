// Server/Models/APILog.js
// API usage logging model for tracking costs and performance

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { commonOptions } = require('./common');

const Schema = mongoose.Schema;

const APILogSchema = new Schema({
  _id: { type: String, default: () => uuidv4() },
  
  // Request Information
  requestId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  
  // API Configuration
  apiProvider: { type: String, default: 'openai-compatible', index: true },
  apiUrl: { type: String, default: '' },
  model: { type: String, required: true, index: true },
  
  // User Information
  userId: { type: String, ref: 'User', index: true },
  userRole: { type: String, index: true },
  userName: { type: String },
  
  // Request Details
  endpoint: { type: String, index: true }, // 'chatbot' or 'scanner'
  requestType: { type: String, index: true }, // 'greeting', 'medical_query', 'intent_detection', 'data_extraction'
  
  // Request Data
  requestMessages: [
    {
      role: { type: String },
      content: { type: String }
    }
  ],
  requestTokens: { type: Number, default: 0 },
  
  // Request Configuration
  temperature: { type: Number, default: 0.7 },
  maxTokens: { type: Number, default: 1500 },
  
  // Response Data
  responseContent: { type: String, default: '' },
  responseTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0, index: true },
  
  // Performance Metrics
  responseTimeMs: { type: Number, required: true, index: true },
  startTime: { type: Date },
  endTime: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['success', 'error', 'retry', 'circuit_breaker'], 
    default: 'success',
    index: true 
  },
  statusCode: { type: Number },
  
  // Error Information
  errorMessage: { type: String, default: null },
  errorStack: { type: String, default: null },
  retryCount: { type: Number, default: 0 },
  
  // Cost Information (if available)
  estimatedCost: { type: Number, default: 0 },
  costPerToken: { type: Number, default: 0 },
  
  // Session Information
  sessionId: { type: String, index: true },
  conversationId: { type: String, index: true },
  
  // Additional Metadata
  metadata: {
    userAgent: { type: String },
    ipAddress: { type: String },
    features: [String], // e.g., ['intent_detection', 'patient_matching']
    intent: { type: String }, // For scanner logs
    confidence: { type: Number }, // For scanner logs
    patientId: { type: String }, // For scanner logs
    batchId: { type: String }, // For bulk operations
    fileCount: { type: Number } // For bulk operations
  }
  
}, Object.assign({}, commonOptions, {
  // Override timestamps to use custom field names
  timestamps: false
}));

// Indexes for efficient querying
APILogSchema.index({ timestamp: -1 });
APILogSchema.index({ userId: 1, timestamp: -1 });
APILogSchema.index({ model: 1, timestamp: -1 });
APILogSchema.index({ status: 1, timestamp: -1 });
APILogSchema.index({ endpoint: 1, timestamp: -1 });
APILogSchema.index({ totalTokens: -1 });
APILogSchema.index({ responseTimeMs: -1 });

// Virtual for calculating cost (if you have pricing info)
APILogSchema.virtual('calculatedCost').get(function() {
  if (this.costPerToken > 0) {
    return this.totalTokens * this.costPerToken;
  }
  return this.estimatedCost || 0;
});

// Static methods for analytics
APILogSchema.statics.getTotalUsageByUser = async function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: startDate, $lte: endDate },
        status: 'success'
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$estimatedCost' },
        avgResponseTime: { $avg: '$responseTimeMs' }
      }
    }
  ]);
};

APILogSchema.statics.getUsageByModel = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        status: 'success'
      }
    },
    {
      $group: {
        _id: '$model',
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$estimatedCost' },
        avgResponseTime: { $avg: '$responseTimeMs' }
      }
    },
    {
      $sort: { totalTokens: -1 }
    }
  ]);
};

APILogSchema.statics.getDailyUsage = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        status: 'success'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$estimatedCost' },
        avgResponseTime: { $avg: '$responseTimeMs' }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
    }
  ]);
};

APILogSchema.statics.getErrorStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        status: 'error'
      }
    },
    {
      $group: {
        _id: '$errorMessage',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('APILog', APILogSchema);
