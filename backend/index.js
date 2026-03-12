const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ── Model imports ──
const Department    = require('./models/Department');
const Faculty       = require('./models/Faculty');
const Student       = require('./models/Student');
const Attendance    = require('./models/Attendance');
const AcademicResult = require('./models/AcademicResult');
const Fee           = require('./models/Fee');
const Document      = require('./models/Document');
const Report        = require('./models/Report');
const SystemSetting = require('./models/SystemSetting');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── MongoDB Connection ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas (CMS Database)'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// ═══════════════════════════════════════════════════════════
//  CRUD helper – keeps route definitions DRY
// ═══════════════════════════════════════════════════════════
function registerCrud(router, path, Model, idField) {
  // GET all
  router.get(path, async (_req, res) => {
    try { res.json(await Model.find().sort({ createdAt: -1 })); }
    catch (e) { res.status(500).json({ message: e.message }); }
  });

  // GET one
  if (idField) {
    router.get(`${path}/:id`, async (req, res) => {
      try {
        const query = idField === '_id'
          ? { _id: req.params.id }
          : { [idField]: req.params.id };
        const doc = await Model.findOne(query);
        if (!doc) return res.status(404).json({ message: 'Not found' });
        res.json(doc);
      } catch (e) { res.status(500).json({ message: e.message }); }
    });
  }

  // POST create
  router.post(path, async (req, res) => {
    try { res.status(201).json(await Model.create(req.body)); }
    catch (e) { res.status(400).json({ message: e.message }); }
  });

  // PUT update
  if (idField) {
    router.put(`${path}/:id`, async (req, res) => {
      try {
        const query = idField === '_id'
          ? { _id: req.params.id }
          : { [idField]: req.params.id };
        const doc = await Model.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ message: 'Not found' });
        res.json(doc);
      } catch (e) { res.status(400).json({ message: e.message }); }
    });
  }

  // DELETE
  if (idField) {
    router.delete(`${path}/:id`, async (req, res) => {
      try {
        const query = idField === '_id'
          ? { _id: req.params.id }
          : { [idField]: req.params.id };
        const doc = await Model.findOneAndDelete(query);
        if (!doc) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted successfully' });
      } catch (e) { res.status(500).json({ message: e.message }); }
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  Register all routes
// ═══════════════════════════════════════════════════════════
registerCrud(app, '/api/departments',      Department,     'code');
registerCrud(app, '/api/faculty',          Faculty,        '_id');
registerCrud(app, '/api/students',         Student,        'rollNumber');
registerCrud(app, '/api/attendance',       Attendance,     '_id');
registerCrud(app, '/api/academic-results', AcademicResult, '_id');
registerCrud(app, '/api/fees',             Fee,            '_id');
registerCrud(app, '/api/documents',        Document,       '_id');
registerCrud(app, '/api/reports',          Report,         '_id');
registerCrud(app, '/api/settings',         SystemSetting,  'key');

// ── Extra: get attendance / results / fees / documents by studentId ──
app.get('/api/attendance/student/:studentId', async (req, res) => {
  try { res.json(await Attendance.find({ studentId: req.params.studentId }).sort({ date: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/academic-results/student/:studentId', async (req, res) => {
  try { res.json(await AcademicResult.find({ studentId: req.params.studentId }).sort({ semester: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/fees/student/:studentId', async (req, res) => {
  try { res.json(await Fee.find({ studentId: req.params.studentId }).sort({ date: -1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/documents/student/:studentId', async (req, res) => {
  try { res.json(await Document.find({ studentId: req.params.studentId })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Root ──
app.get('/', (_req, res) => res.send('CMS Backend API is running...'));

// ── Start server ──
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
