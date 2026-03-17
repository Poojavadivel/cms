// Fee Type Enumeration
export const FeeType = {
  APPLICATION: 'application',
  SEMESTER: 'semester',
  EXAM: 'exam',
  HOSTEL: 'hostel',
  LIBRARY: 'library',
  OTHER: 'other',
};

// Payment Status Enumeration
export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIAL: 'partial',
};

// Payment Method Enumeration
export const PaymentMethod = {
  DEBIT_CARD: 'debit_card',
};

// Fee Structure Configuration
export const FeeStructure = {
  application: {
    name: 'Application Fee',
    amount: 500,
    description: 'One-time application fee',
    icon: 'receipt',
  },
  semester: {
    name: 'Semester Fee',
    amount: 5000,
    description: 'Per semester fee',
    icon: 'school',
  },
  exam: {
    name: 'Exam Fee',
    amount: 1000,
    description: 'Examination fee per semester',
    icon: 'assignment',
  },
  hostel: {
    name: 'Hostel Fee',
    description: 'Annual hostel accommodation fee',
    icon: 'home',
    types: {
      ac: { name: 'AC Room', amount: 40000, description: 'AC room with 2-3 sharing' },
      nonAc: { name: 'Non-AC Room', amount: 25000, description: 'Non-AC room with 3-4 sharing' },
      mess: { name: 'Mess Fee', amount: 12000, description: 'Annual mess fee' },
    },
  },
  dayScholar: {
    name: 'Day Scholar Bus Fee',
    description: 'Monthly bus fee based on distance',
    icon: 'directions_bus',
    distances: {
      near: { range: '5-10 km', minAmount: 800, maxAmount: 1500, label: 'Near area' },
      medium: { range: '10-25 km', minAmount: 1500, maxAmount: 3000, label: 'Medium distance' },
      far: { range: '25+ km', minAmount: 3000, maxAmount: 4500, label: 'Long distance' },
    },
  },
  library: {
    name: 'Library Fee',
    amount: 500,
    description: 'Annual library fee',
    icon: 'library_books',
  },
  other: {
    name: 'Other Fee',
    description: 'Miscellaneous fees',
    icon: 'receipt_long',
  },
};

// Get fee amount based on type and details
export const calculateFeeAmount = (feeType, detailsObject = {}) => {
  switch (feeType) {
    case FeeType.APPLICATION:
    case FeeType.EXAM:
    case FeeType.LIBRARY:
      return FeeStructure[feeType].amount;

    case FeeType.SEMESTER:
      return FeeStructure[feeType].amount;

    case FeeType.HOSTEL:
      if (detailsObject.hostelType === 'ac') return FeeStructure.hostel.types.ac.amount;
      if (detailsObject.hostelType === 'nonAc') return FeeStructure.hostel.types.nonAc.amount;
      if (detailsObject.hostelType === 'mess') return FeeStructure.hostel.types.mess.amount;
      return 0;

    case 'dayScholar':
      // Return average for the selected distance
      if (detailsObject.distance === 'near') {
        return (FeeStructure.dayScholar.distances.near.minAmount + FeeStructure.dayScholar.distances.near.maxAmount) / 2;
      }
      if (detailsObject.distance === 'medium') {
        return (FeeStructure.dayScholar.distances.medium.minAmount + FeeStructure.dayScholar.distances.medium.maxAmount) / 2;
      }
      if (detailsObject.distance === 'far') {
        return (FeeStructure.dayScholar.distances.far.minAmount + FeeStructure.dayScholar.distances.far.maxAmount) / 2;
      }
      return 0;

    default:
      return detailsObject.amount || 0;
  }
};

// Get badge color based on payment status
export const getPaymentStatusColor = (status) => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800 border-green-300';
    case PaymentStatus.PENDING:
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case PaymentStatus.FAILED:
      return 'bg-red-100 text-red-800 border-red-300';
    case PaymentStatus.REFUNDED:
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case PaymentStatus.PARTIAL:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};

// Get background color for paid status
export const getPaidStatusBgColor = (isPaid) => {
  return isPaid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';
};
