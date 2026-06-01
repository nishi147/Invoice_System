import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'manshu_finance_secret_jwt_access_2026_key_99', {
    expiresIn: '1h',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'manshu_finance_secret_jwt_refresh_2026_key_88', {
    expiresIn: '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (In production, usually Super Admin only or restricted. For this setup, we allow open signup of the first Super Admin)
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Determine role - default is staff. If no users exist, make Super Admin
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'super_admin' : (role || 'staff');

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    if (user) {
      // Create Audit Log
      await AuditLog.create({
        user: user._id,
        userEmail: user.email,
        userName: user.name,
        action: 'USER_REGISTER',
        details: `Registered new user ${user.email} with role ${user.role}`,
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateAccessToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get tokens
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'inactive') {
        return res.status(403).json({ success: false, message: 'Your account is deactivated' });
      }

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token to database
      user.refreshToken = refreshToken;
      await user.save();

      // Create Audit Log
      await AuditLog.create({
        user: user._id,
        userEmail: user.email,
        userName: user.name,
        action: 'USER_LOGIN',
        details: 'User logged in successfully',
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accessToken,
          refreshToken,
        },
      });
    } else {
      // Create failure audit log
      await AuditLog.create({
        userEmail: email,
        action: 'USER_LOGIN_FAILED',
        details: `Failed login attempt for email: ${email}`,
        ipAddress: req.ip,
      });

      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'manshu_finance_secret_jwt_refresh_2026_key_88');
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user._id);
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// @desc    Logout user & revoke refresh token
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = undefined;
      await user.save();

      await AuditLog.create({
        user: user._id,
        userEmail: user.email,
        userName: user.name,
        action: 'USER_LOGOUT',
        details: 'User logged out',
        ipAddress: req.ip,
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
