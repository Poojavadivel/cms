# Pathology Pending Tests Fix - Complete

## Changes Made

### File: `react/hms/src/modules/admin/pathology/Pathology.jsx`

#### 1. Updated fetchReports Function (Lines 107-149)
**Before**:
```javascript
const fetchReports = useCallback(async () => {
  const data = await pathologyService.fetchReports({ limit: 100 });
  setReports(data);
}, []);
```

**After**:
```javascript
const fetchReports = useCallback(async () => {
  // Fetch BOTH pending tests and completed reports
  const [completedReports, pendingTests] = await Promise.all([
    pathologyService.fetchReports({ limit: 100 }),
    pathologyService.fetchPendingTests({ limit: 50 })
  ]);
  
  // Transform pending tests with status flag
  const pendingWithStatus = pendingTests.map(test => ({
    ...test,
    id: test._id,
    status: 'Pending',
    isPending: true,
    testCount: test.pathologyItems?.length || 0
  }));
  
  // Combine: pending first, then completed
  const allData = [...pendingWithStatus, ...completedReports];
  setReports(allData);
}, []);
```

#### 2. Added handleProcessPendingTest Function (Lines 210-230)
New handler to process pending test orders by pre-filling the form:
```javascript
const handleProcessPendingTest = (pendingTest) => {
  const prefilledData = {
    patientId: pendingTest.patientId,
    patientName: pendingTest.patientName,
    testName: pendingTest.testName,
    intakeId: pendingTest._id,
    pathologyItems: pendingTest.pathologyItems
  };
  
  setEditingReport(prefilledData);
  setShowForm(true);
};
```

#### 3. Updated Table Display (Lines 464-540)
**Enhanced to show pending tests differently**:
- Shows "ORDER" badge for pending tests
- Shows "+X more" for multiple tests in one order
- Displays doctor name instead of technician for pending
- Shows "Process Test" button instead of Edit/Download for pending
- Uses `createdAt` if `reportDate` is missing

**Before**:
```jsx
<td>
  <span className="primary">{report.testName}</span>
</td>
<td>
  <span className="technician-badge">{report.technician}</span>
</td>
<td>
  <button className="btn-action edit">Edit</button>
  <button className="btn-action download">Download</button>
</td>
```

**After**:
```jsx
<td>
  <span className="primary">
    {report.testName}
    {report.isPending && report.testCount > 1 && (
      <span>+{report.testCount - 1} more</span>
    )}
  </span>
  {report.isPending && <span className="artifact-tag">ORDER</span>}
</td>
<td>
  {report.isPending ? (
    <span>{report.doctorName || 'Dr. N/A'}</span>
  ) : (
    <span>{report.technician || 'N/A'}</span>
  )}
</td>
<td>
  {!report.isPending && (
    <>
      <button className="btn-action edit">Edit</button>
      <button className="btn-action download">Download</button>
    </>
  )}
  {report.isPending && (
    <button onClick={() => handleProcessPendingTest(report)}>
      Process Test
    </button>
  )}
</td>
```

#### 4. Updated Table Header (Line 458)
Changed "Technician" to "Ordered By / Tech" to reflect dual purpose.

## How It Works Now

### Complete Workflow:

```
1. Doctor logs in
   ↓
2. Opens appointment → Click "Intake"
   ↓
3. Adds lab tests (e.g., CBC, LFT)
   ↓
4. Clicks "Save Intake"
   ↓
5. Backend saves to Intake.meta.pathologyItems
   ↓
6. Pathologist logs in
   ↓
7. Opens "Test Reports" screen
   ↓
8. Frontend fetches BOTH:
      - Pending tests from /pathology/pending-tests
      - Completed reports from /pathology/reports
   ↓
9. Pathologist sees PENDING TESTS ✅
   ↓
10. Clicks "Process Test" button
    ↓
11. Form opens pre-filled with patient data
    ↓
12. Uploads results, saves
    ↓
13. Creates LabReport → Status changes to "Completed"
```

## Visual Changes

### Before:
- Only showed completed reports from LabReport collection
- Pending test orders from doctors were invisible ❌

### After:
- Shows pending test orders with "Pending" status ✅
- Shows "ORDER" badge to distinguish from completed reports ✅
- Shows doctor who ordered instead of technician ✅
- Shows "Process Test" button for pending orders ✅
- Shows "+X more" for multiple tests ✅

## Data Flow

### Pending Test (from Intake collection):
```javascript
{
  _id: "intake-123",
  patientName: "John Doe",
  patientId: "patient-456",
  doctorName: "Dr. Smith",
  pathologyItems: [
    { testName: "CBC", priority: "Normal", status: "Requested" },
    { testName: "LFT", priority: "Urgent", status: "Requested" }
  ],
  status: "Pending",  // Added by frontend
  isPending: true,    // Flag for conditional rendering
  testCount: 2        // Number of tests
}
```

### Completed Report (from LabReport collection):
```javascript
{
  _id: "report-789",
  patientName: "Jane Smith",
  testName: "X-Ray",
  technician: "Tech A",
  status: "Completed",
  pdfRef: "file-id-123",
  isPending: false
}
```

## Testing Checklist

- [ ] Doctor creates intake with lab tests
- [ ] Check database: `meta.pathologyItems` exists in Intake
- [ ] Pathologist logs in
- [ ] Opens Test Reports screen
- [ ] Sees pending test orders with "Pending" status ✅
- [ ] Sees "ORDER" badge ✅
- [ ] Sees doctor name who ordered ✅
- [ ] Clicks "Process Test" button ✅
- [ ] Form opens with pre-filled data ✅
- [ ] Uploads results and saves
- [ ] Report moves from "Pending" to "Completed" ✅
- [ ] No longer shows "Process Test" button ✅
- [ ] Shows Edit/Download buttons instead ✅

## API Endpoints Used

```
GET /pathology/pending-tests
  → Returns: Intakes with meta.pathologyItems
  → Filter: No labReportIds OR items not completed
  → Source: Intake collection
  
GET /pathology/reports
  → Returns: Completed lab reports
  → Source: LabReport collection
  
POST /pathology/reports
  → Creates: New lab report
  → Links: Back to intake if intakeId provided
```

## Summary

✅ **Pathology screen now shows BOTH**:
1. Pending test orders from doctors (Intake collection)
2. Completed lab reports (LabReport collection)

✅ **Clear visual distinction**:
- Pending: "ORDER" badge, doctor name, "Process Test" button
- Completed: PDF/IMG badges, technician name, Edit/Download buttons

✅ **Proper workflow**:
- Doctor orders → Shows as pending
- Pathologist processes → Creates report
- Status changes to completed

---
**Fixed**: 2026-02-20  
**Status**: ✅ COMPLETE - Pathology now matches Pharmacy workflow!
