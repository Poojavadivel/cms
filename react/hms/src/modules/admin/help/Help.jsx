import React, { useState } from 'react';
import './Help.css';

const Help = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I add a new patient?',
          answer: 'Navigate to the Patients page and click the "Add Patient" button. Fill in the required information including name, age, gender, contact details, and medical history. Click "Save" to create the patient record.'
        },
        {
          question: 'How do I schedule an appointment?',
          answer: 'Go to the Appointments page and click "New Appointment". Select the patient, doctor, date, time, and reason for visit. The system will check for conflicts and confirm the booking.'
        },
        {
          question: 'How do I manage staff members?',
          answer: 'Access the Staff Management page to add, edit, or remove staff members. You can assign roles, departments, and manage their schedules and contact information.'
        }
      ]
    },
    {
      category: 'Pharmacy Management',
      questions: [
        {
          question: 'How do I add new medicines?',
          answer: 'Go to Pharmacy > Medicines tab and click "Add Medicine". Enter the medicine name, SKU, category, manufacturer, stock quantity, and reorder level. The system will track inventory automatically.'
        },
        {
          question: 'How do I manage medicine batches?',
          answer: 'Navigate to Pharmacy > Batches tab to add new batches with expiry dates, batch numbers, and quantities. The system alerts you about expiring batches.'
        },
        {
          question: 'What happens when stock is low?',
          answer: 'When medicine stock falls below the reorder level, the system automatically marks it as "Low Stock" and you\'ll receive notifications to reorder.'
        }
      ]
    },
    {
      category: 'Pathology Reports',
      questions: [
        {
          question: 'How do I upload a pathology report?',
          answer: 'Go to Pathology page, click "Upload Report", select the patient, test type, and upload the PDF/image file. The report will be linked to the patient record.'
        },
        {
          question: 'Can patients access their reports?',
          answer: 'Yes, patients can view and download their pathology reports through their patient portal once uploaded and marked as complete.'
        }
      ]
    },
    {
      category: 'Invoicing & Billing',
      questions: [
        {
          question: 'How do I create an invoice?',
          answer: 'Navigate to Invoice page, click "Create Invoice", select the patient, add services/items, specify payment method, and generate the invoice. You can print or email it directly.'
        },
        {
          question: 'How do I track payments?',
          answer: 'All invoices show payment status (Pending, Partially Paid, Paid). You can update payment information by editing the invoice and adding payment details.'
        },
        {
          question: 'Can I generate financial reports?',
          answer: 'Yes, use the Reports section to generate revenue reports, payment summaries, and outstanding payment lists for any date range.'
        }
      ]
    },
    {
      category: 'Payroll Management',
      questions: [
        {
          question: 'How do I process monthly payroll?',
          answer: 'Go to Payroll page, select the month and year, review all staff payroll records, make any adjustments, and click "Process Payroll" to mark salaries for payment.'
        },
        {
          question: 'How are salaries calculated?',
          answer: 'Salaries are calculated as Basic Salary + Allowances - Deductions = Net Salary. You can customize allowances and deductions for each staff member.'
        },
        {
          question: 'Can I export payroll data?',
          answer: 'Yes, you can export payroll data to CSV or PDF format for accounting and record-keeping purposes.'
        }
      ]
    },
    {
      category: 'Troubleshooting',
      questions: [
        {
          question: 'What if I can\'t log in?',
          answer: 'Ensure you\'re using the correct email and password. If you forgot your password, use the "Forgot Password" link. Contact your system administrator if issues persist.'
        },
        {
          question: 'Why is data not loading?',
          answer: 'Check your internet connection. Try refreshing the page. If the problem continues, it might be a server issue - contact technical support.'
        },
        {
          question: 'How do I report a bug?',
          answer: 'Click the "Report Issue" button at the bottom of this page and describe the problem in detail. Include screenshots if possible.'
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      searchQuery === '' ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleFaq = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setExpandedFaq(expandedFaq === key ? null : key);
  };

  return (
    <div className="help-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">
              <span className="icon">❓</span>
              Help & Support
            </h1>
            <p className="page-subtitle">Find answers to common questions and get support</p>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            FAQs
          </button>
          <button 
            className={`tab ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            User Guide
          </button>
          <button 
            className={`tab ${activeTab === 2 ? 'active' : ''}`}
            onClick={() => setActiveTab(2)}
          >
            Contact Support
          </button>
        </div>
      </div>

      {activeTab === 0 && (
        <div className="faq-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="faq-list">
            {filteredFaqs.map((category, catIndex) => (
              <div key={catIndex} className="faq-category">
                <h3 className="category-title">{category.category}</h3>
                {category.questions.map((faq, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isExpanded = expandedFaq === key;
                  
                  return (
                    <div key={qIndex} className="faq-item">
                      <div 
                        className="faq-question"
                        onClick={() => toggleFaq(catIndex, qIndex)}
                      >
                        <span>{faq.question}</span>
                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                          ▼
                        </span>
                      </div>
                      {isExpanded && (
                        <div className="faq-answer">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="user-guide-section">
          <div className="guide-card">
            <h3>📋 Quick Start Guide</h3>
            <ol>
              <li>Log in with your admin credentials</li>
              <li>Familiarize yourself with the dashboard</li>
              <li>Add patients, staff, and configure settings</li>
              <li>Start managing appointments and records</li>
              <li>Generate reports and track performance</li>
            </ol>
          </div>

          <div className="guide-card">
            <h3>📚 Module Guides</h3>
            <ul>
              <li><strong>Dashboard:</strong> Overview of hospital operations and key metrics</li>
              <li><strong>Patients:</strong> Comprehensive patient record management</li>
              <li><strong>Staff:</strong> Employee management and scheduling</li>
              <li><strong>Appointments:</strong> Schedule and track patient visits</li>
              <li><strong>Pharmacy:</strong> Inventory and medicine management</li>
              <li><strong>Pathology:</strong> Lab reports and test results</li>
              <li><strong>Invoice:</strong> Billing and payment tracking</li>
              <li><strong>Payroll:</strong> Staff salary and compensation management</li>
            </ul>
          </div>

          <div className="guide-card">
            <h3>💡 Best Practices</h3>
            <ul>
              <li>Regularly backup your data</li>
              <li>Keep patient information up to date</li>
              <li>Review and process pending tasks daily</li>
              <li>Monitor inventory levels proactively</li>
              <li>Generate weekly/monthly reports for insights</li>
              <li>Train staff on system usage</li>
              <li>Maintain data privacy and security</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="contact-section">
          <div className="contact-card">
            <h3>📧 Email Support</h3>
            <p>support@hospital-hms.com</p>
            <p className="response-time">Response time: Within 24 hours</p>
          </div>

          <div className="contact-card">
            <h3>📞 Phone Support</h3>
            <p>+1 (555) 123-4567</p>
            <p className="response-time">Available: Mon-Fri, 9AM-6PM</p>
          </div>

          <div className="contact-card">
            <h3>💬 Live Chat</h3>
            <p>Chat with our support team</p>
            <button className="btn-primary">Start Chat</button>
          </div>

          <div className="contact-card full-width">
            <h3>🐛 Report an Issue</h3>
            <form className="issue-form">
              <input 
                type="text" 
                placeholder="Subject" 
                className="form-input"
              />
              <textarea 
                placeholder="Describe the issue..."
                rows="5"
                className="form-textarea"
              />
              <button type="submit" className="btn-primary">Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Help;
