const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailer');

// Validation helper functions
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Biến lưu OTP tạm thời (email -> { otp, expires })
const otpStore = {};

// API gửi OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Tạo OTP 4 số
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  // Lưu vào memory, hết hạn sau 5 phút
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    await sendMail({
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: `<b>Your OTP code is: ${otp}</b>`
    });
    res.json({ message: 'OTP sent to email!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};

// API xác thực OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: 'No OTP sent to this email' });
  if (Date.now() > record.expires) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
  // Xác thực thành công, xóa OTP
  delete otpStore[email];
  res.json({ message: 'OTP verified' });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Input validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address' 
      });
    }

    // Password confirmation check
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    // Password strength validation
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long and contain both letters and numbers' 
      });
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Check if username already exists
    const existingUsername = await prisma.users.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        username: newUser.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return success response (without password)
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      bio: newUser.bio,
      avatar_url: newUser.avatar_url,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return success response (without password)
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar_url: user.avatar_url,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login' 
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatar_url: true,
        createdAt: true
      }
    });
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
};

// Get user by ID (public info only)
exports.getUserById = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                avatar_url: true
            }
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                avatar: user.avatar_url || '/img/user.png',
                name: user.username
            }
        });
    } catch (error) {
        console.error('Error getting user by ID:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error getting user information' 
        });
    }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove password from update data if present
    delete updateData.password;
    
    const updatedUser = await prisma.users.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating user' 
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await prisma.users.delete({
      where: { id: Number(req.params.id) }
    });

    if (!deletedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
};

exports.resetPassword = async (req, res) => {
  console.log('RESET PASSWORD API CALLED', req.body);
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and contain both letters and numbers' });
  }
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword }
    });
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

// Thêm alias cho register
exports.createUser = exports.register;

exports.onboarding = async (req, res) => {
  try {
    const { email, gender, interestIds } = req.body;

    // Input validation
    if (!email || !gender || !interestIds || !Array.isArray(interestIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, gender và interests là bắt buộc' 
      });
    }

    // Tìm user theo email
    const user = await prisma.users.findUnique({
      where: { email },
      include: { interests: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với email này.'
      });
    }

    // Kiểm tra các interestIds có tồn tại trong hệ thống không
    const validInterests = await prisma.interests.findMany({
      where: { id: { in: interestIds } },
      select: { id: true }
    });

    if (validInterests.length !== interestIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Một hoặc nhiều interestId không hợp lệ.'
      });
    }

    // Cập nhật thông tin onboarding
    const updatedUser = await prisma.users.update({
      where: { email },
      data: {
        gender,
        onboarded: true,
        interests: {
          set: [],
          connect: interestIds.map(id => ({ id }))
        }
      },
      include: {
        interests: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        gender: updatedUser.gender,
        interests: updatedUser.interests,
        onboarded: updatedUser.onboarded
      }
    });

  } catch (error) {
  console.error('Onboarding error message:', error.message);
  console.error('Onboarding error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server trong quá trình onboarding',
      error: error.message
    });
  }
};

// Thêm route test gửi mail
async function testSendMail(req, res) {
  try {
    await sendMail({
      to: req.body.to || process.env.EMAIL_USER,
      subject: 'Test Nodemailer',
      text: 'Đây là email test từ Social Media App!',
      html: '<b>Đây là email test từ Social Media App!</b>'
    });
    res.status(200).json({ message: 'Đã gửi email thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports.testSendMail = testSendMail;