/**
 * Doctor.js - Doctor model
 * Direct port from web models/Doctor.js
 */
export class Doctor {
    constructor({ id, fullName, email, phone, role, gender, avatar, specialization, qualification, experience, department, createdAt, updatedAt }) {
        this.id = id || '';
        this.fullName = fullName || '';
        this.email = email || '';
        this.phone = phone || '';
        this.role = role || 'doctor';
        this.gender = gender || '';
        this.avatar = avatar || '';
        this.specialization = specialization || '';
        this.qualification = qualification || '';
        this.experience = experience || '';
        this.department = department || '';
        this.createdAt = createdAt || null;
        this.updatedAt = updatedAt || null;
    }

    static fromJSON(json) {
        return new Doctor({
            id: json._id || json.id || '',
            fullName: json.fullName || json.name || (json.firstName ? `${json.firstName} ${json.lastName || ''}`.trim() : ''),
            email: json.email || '',
            phone: json.phone || json.mobile || '',
            role: json.role || 'doctor',
            gender: json.gender || '',
            avatar: json.avatar || json.profileImage || '',
            specialization: json.specialization || '',
            qualification: json.qualification || '',
            experience: json.experience || '',
            department: json.department || '',
            createdAt: json.createdAt,
            updatedAt: json.updatedAt,
        });
    }

    toJSON() {
        return {
            id: this.id,
            fullName: this.fullName,
            email: this.email,
            phone: this.phone,
            role: this.role,
            gender: this.gender,
            avatar: this.avatar,
            specialization: this.specialization,
            qualification: this.qualification,
            experience: this.experience,
            department: this.department,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
