/**
 * Pharmacist.js - Pharmacist model
 * Direct port from web models/Pharmacist.js
 */
export class Pharmacist {
    constructor({ id, fullName, email, phone, role, gender, avatar, licenseNumber, createdAt, updatedAt }) {
        this.id = id || '';
        this.fullName = fullName || '';
        this.email = email || '';
        this.phone = phone || '';
        this.role = role || 'pharmacist';
        this.gender = gender || '';
        this.avatar = avatar || '';
        this.licenseNumber = licenseNumber || '';
        this.createdAt = createdAt || null;
        this.updatedAt = updatedAt || null;
    }

    static fromJSON(json) {
        return new Pharmacist({
            id: json._id || json.id || '',
            fullName: json.fullName || json.name || (json.firstName ? `${json.firstName} ${json.lastName || ''}`.trim() : ''),
            email: json.email || '',
            phone: json.phone || json.mobile || '',
            role: json.role || 'pharmacist',
            gender: json.gender || '',
            avatar: json.avatar || json.profileImage || '',
            licenseNumber: json.licenseNumber || '',
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
            licenseNumber: this.licenseNumber,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
