import { useState } from 'react';
import StudentAdmissionModal from './StudentAdmissionModal';
import FacultyAdmissionModal from './FacultyAdmissionModal';

export default function AddMemberModal({ isOpen, onClose, onSuccess }) {
  const [choice, setChoice] = useState(null); // 'student' or 'faculty'

  if (!isOpen) return null;

  const handleInnerSuccess = (data) => {
    onSuccess({ type: choice, data });
    setChoice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-blue-100">
        {!choice ? (
          <div>
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-[#1162d4] to-[#0a47a8] p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Add New Member</h2>
              <p className="text-blue-100">Select the type of member to add to the institution</p>
            </div>

            {/* Choice Cards */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-6">
                {/* Student Card */}
                <button
                  onClick={() => setChoice('student')}
                  className="group relative p-8 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 overflow-hidden"
                >
                  {/* Floating background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 text-center">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="material-symbols-outlined text-white text-4xl">person_add</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Student</h3>
                    <p className="text-sm text-gray-600">Add a new student to the admission system</p>
                    <div className="mt-4 inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold group-hover:bg-blue-200 transition-colors">
                      8 Steps
                    </div>
                  </div>
                </button>

                {/* Faculty Card */}
                <button
                  onClick={() => setChoice('faculty')}
                  className="group relative p-8 rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 overflow-hidden"
                >
                  {/* Floating background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 text-center">
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="material-symbols-outlined text-white text-4xl">badge</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Faculty</h3>
                    <p className="text-sm text-gray-600">Add a new faculty member to the institution</p>
                    <div className="mt-4 inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-lg text-xs font-semibold group-hover:bg-purple-200 transition-colors">
                      7 Steps
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : choice === 'student' ? (
          <StudentAdmissionModal
            isOpen={true}
            onClose={() => { setChoice(null); onClose(); }}
            onSuccess={handleInnerSuccess}
          />
        ) : (
          <FacultyAdmissionModal
            isOpen={true}
            onClose={() => { setChoice(null); onClose(); }}
            onSuccess={handleInnerSuccess}
          />
        )}
      </div>
    </div>
  );
}
