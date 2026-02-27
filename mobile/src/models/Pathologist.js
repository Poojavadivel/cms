/**
 * Pathologist.js - Pathologist model
 * Direct port from web models/Pathologist.js
 */
export class Pathologist {
    constructor({ id, fullName, email, phone, role, gender, avatar, labName, createdAt, updatedAt }) {
        this.id = id || '';
        this.fullName = fullName || '';
        this.email = email || '';
        this.phone = phone || '';
        this.role = role || 'pathologist';
        this.gender = gender || '';
        this.avatar = avatar || '';
        this.labName = labName || '';
        this.createdAt = createdAt || null;
        this.updatedAt = updatedAt || null;
    }

    static fromJSON(json) {
        return new Pathologist({
            id: json._id || json.id || '',
            fullName: json.fullName || json.name || (json.firstName ? `${json.firstName} ${json.lastName || ''}`.trim() : ''),
            email: json.email || '',
            phone: json.phone || json.mobile || '',
            role: json.role || 'pathologist',
            gender: json.gender || '',
            avatar: json.avatar || json.profileImage || '',
            labName: json.labName || '',
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
            labName: this.labName,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
