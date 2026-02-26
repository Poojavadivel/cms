/**
 * Admin.js - Admin model
 * Direct port from web models/Admin.js
 */
export class Admin {
    constructor({ id, fullName, email, phone, role, gender, avatar, createdAt, updatedAt }) {
        this.id = id || '';
        this.fullName = fullName || '';
        this.email = email || '';
        this.phone = phone || '';
        this.role = role || 'admin';
        this.gender = gender || '';
        this.avatar = avatar || '';
        this.createdAt = createdAt || null;
        this.updatedAt = updatedAt || null;
    }

    static fromJSON(json) {
        return new Admin({
            id: json._id || json.id || '',
            fullName: json.fullName || json.name || (json.firstName ? `${json.firstName} ${json.lastName || ''}`.trim() : ''),
            email: json.email || '',
            phone: json.phone || json.mobile || '',
            role: json.role || 'admin',
            gender: json.gender || '',
            avatar: json.avatar || json.profileImage || '',
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
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
