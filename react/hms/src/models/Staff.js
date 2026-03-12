/**
 * Represents a Staff member in the Hospital Management System.
 * Comprehensive model for all hospital staff including doctors, nurses, and administrative personnel.
 */
export class Staff {
  constructor({
    id,
    name,
    designation,
    department,
    patientFacingId = '',
    contact = '',
    email = '',
    avatarUrl = '',
    gender = '',
    status = 'Off Duty',
    shift = '',
    roles = [],
    qualifications = [],
    experienceYears = 0,
    joinedAt = null,
    lastActiveAt = null,
    location = '',
    dob = '',
    notes = {},
    appointmentsCount = 0,
    tags = [],
    isSelected = false,
  }) {
    this.id = id;
    this.name = name;
    this.designation = designation;
    this.department = department;
    this.patientFacingId = patientFacingId;
    this.contact = contact;
    this.email = email;
    this.avatarUrl = avatarUrl;
    this.gender = gender;
    this.status = status;
    this.shift = shift;
    this.roles = Array.isArray(roles) ? roles : [];
    this.qualifications = Array.isArray(qualifications) ? qualifications : [];
    this.experienceYears = experienceYears;
    this.joinedAt = joinedAt ? new Date(joinedAt) : null;
    this.lastActiveAt = lastActiveAt ? new Date(lastActiveAt) : null;
    this.location = location;
    this.dob = dob;
    this.notes = notes || {};
    this.appointmentsCount = appointmentsCount;
    this.tags = Array.isArray(tags) ? tags : [];
    this.isSelected = isSelected;
  }

  static fromJSON(json) {
    const parseDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      try {
        return new Date(v);
      } catch {
        return null;
      }
    };

    const parseNotes = (n) => {
      if (!n) return {};
      if (typeof n === 'object' && !Array.isArray(n)) {
        return Object.entries(n).reduce((acc, [k, v]) => {
          acc[k] = v?.toString() || '';
          return acc;
        }, {});
      }
      if (typeof n === 'string') {
        return { notes: n };
      }
      return {};
    };

    const parseStringList = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v.map(e => e.toString());
      if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(s => s);
      return [];
    };

    const stringFallback = (keys) => {
      for (const k of keys) {
        const val = json[k];
        if (val != null) {
          const s = val.toString().trim();
          if (s) return s;
        }
      }
      return '';
    };

    const designationValue = stringFallback(['designation', 'role', 'title']) || '-';
    const contactValue = stringFallback(['contact', 'phone', 'phoneNumber', 'contactNumber']) || '-';

    const parsedNotes = parseNotes(json.notes);

    const metaLookup = (meta, keys) => {
      if (!meta) return '';
      for (const k of keys) {
        const v = meta[k];
        if (v != null) {
          const s = v.toString().trim();
          if (s) return s;
        }
      }
      return '';
    };

    let patientFacingId = '';
    const directPf = (json.patientFacingId || json.patientFacing || json.code)?.toString().trim() || '';
    if (directPf) {
      patientFacingId = directPf;
    } else {
      const metaRaw = json.metadata;
      if (metaRaw && typeof metaRaw === 'object') {
        patientFacingId = metaLookup(metaRaw, ['staffCode', 'staff_code', 'code', 'patientFacingId']);
      } else if (json.meta && typeof json.meta === 'object') {
        patientFacingId = metaLookup(json.meta, ['staffCode', 'staff_code', 'code', 'patientFacingId']);
      }

      if (!patientFacingId) {
        const noteCode = (parsedNotes.staffCode || parsedNotes.staff_code || parsedNotes.code)?.toString().trim() || '';
        if (noteCode) patientFacingId = noteCode;
      }
    }

    const mergedNotes = { ...parsedNotes };
    const metaRaw2 = json.metadata;
    if (metaRaw2 && typeof metaRaw2 === 'object') {
      Object.entries(metaRaw2).forEach(([k, v]) => {
        try {
          const key = `meta_${k}`;
          if (!mergedNotes[key]) {
            mergedNotes[key] = v?.toString() || '';
          }
        } catch {}
      });
    }

    return new Staff({
      id: json._id?.toString() || json.id?.toString() || '',
      name: (json.name || json.fullName || json.firstName || '').toString(),
      designation: designationValue,
      department: json.department?.toString() || json.dept?.toString() || '',
      patientFacingId,
      contact: contactValue,
      email: json.email?.toString() || '',
      avatarUrl: json.avatarUrl?.toString() || json.photo?.toString() || '',
      gender: json.gender?.toString() || '',
      status: json.status?.toString() || 'Off Duty',
      shift: json.shift?.toString() || '',
      roles: parseStringList(json.roles || (json.metadata?.roles)),
      qualifications: parseStringList(json.qualifications || (json.metadata?.qualifications)),
      experienceYears: parseInt(json.experienceYears || json.metadata?.experienceYears || json.experience || 0) || 0,
      joinedAt: parseDate(json.joinedAt || json.metadata?.joinedAt || json.createdAt),
      lastActiveAt: parseDate(json.lastActiveAt || json.metadata?.lastActiveAt || json.updatedAt),
      location: json.location?.toString() || (json.metadata?.location?.toString()) || '',
      dob: json.dob?.toString() || (json.metadata?.dob?.toString()) || '',
      notes: mergedNotes,
      appointmentsCount: parseInt(json.appointmentsCount || json.metadata?.appointmentsCount || json.apptCount || 0) || 0,
      tags: parseStringList(json.tags || (json.metadata?.tags)),
      isSelected: json.isSelected === true,
    });
  }

  toJSON() {
    const meta = {};
    if (this.patientFacingId) meta.staffCode = this.patientFacingId;

    const notesToEmit = {};
    Object.entries(this.notes).forEach(([k, v]) => {
      if (k.startsWith('meta_')) {
        meta[k.substring(5)] = v;
      } else {
        notesToEmit[k] = v;
      }
    });

    return {
      ...(this.id && { _id: this.id }),
      name: this.name,
      designation: this.designation,
      department: this.department,
      code: this.patientFacingId,
      contact: this.contact,
      email: this.email,
      avatarUrl: this.avatarUrl,
      gender: this.gender,
      status: this.status,
      shift: this.shift,
      roles: this.roles,
      qualifications: this.qualifications,
      experienceYears: this.experienceYears,
      joinedAt: this.joinedAt?.toISOString(),
      lastActiveAt: this.lastActiveAt?.toISOString(),
      location: this.location,
      dob: this.dob,
      notes: notesToEmit,
      appointmentsCount: this.appointmentsCount,
      tags: this.tags,
      isSelected: this.isSelected,
      metadata: meta,
    };
  }

  toString() {
    return `Staff(id: ${this.id}, name: ${this.name}, designation: ${this.designation}, department: ${this.department}, status: ${this.status})`;
  }
}
