const express = require('express');
const router = express.Router();
const { User, Staff } = require('../Models');
const auth = require('../Middleware/Auth');

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, metadata } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update User fields
        if (firstName) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (metadata) {
            user.metadata = { ...user.metadata, ...metadata };
        }

        await user.save();

        // Sync with Staff collection if applicable
        const staffRoles = ['doctor', 'pharmacist', 'pathologist'];
        if (staffRoles.includes(user.role)) {
            const staffUpdate = {};
            if (firstName || lastName) {
                staffUpdate.name = `${user.firstName} ${user.lastName || ''}`.trim();
            }
            if (phone !== undefined) staffUpdate.contact = phone;
            if (metadata) {
                if (metadata.department) staffUpdate.department = metadata.department;
                if (metadata.experienceYears !== undefined) staffUpdate.experienceYears = Number(metadata.experienceYears);
                if (metadata.specialization) staffUpdate.designation = metadata.specialization;
            }

            if (Object.keys(staffUpdate).length > 0) {
                // Try to find staff by userId in metadata or by email
                let staff = await Staff.findOne({ 'metadata.userId': userId });
                if (!staff) {
                    staff = await Staff.findOne({ email: user.email });
                }

                if (staff) {
                    Object.assign(staff, staffUpdate);
                    await staff.save();
                    console.log(`Synced profile update to Staff: ${user.email}`);
                }
            }
        }

        const updatedUser = await User.findById(userId).select('-password').lean();
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
