const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const express = require("express");
const userController = require("../controllers/user.controller");





const {
    getAllUsers,
    getUserById,
    register,
    login,
    updateUser,
    deleteUser,
} = require('../controllers/user.controller');

router.post('/api/users/reset-password', userController.resetPassword);




router.post('/register', register);
router.post('/login', login);

// Protected routes 
router.get('/', authMiddleware, getAllUsers);
router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Email không tồn tại' });


    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Sai mật khẩu' });


    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'my-secret-key', { expiresIn: '1h' });


    res.json({ token, name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

router.post('/register', async (req, res) => {
  const { email, name, password, confirmPassword } = req.body;

  if (!email || !name || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Mật khẩu phải ít nhất 6 ký tự, bao gồm chữ và số' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Hash 
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ email, name, password: hashedPassword });

    // JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'my-secret-key', { expiresIn: '1h' });

    res.status(201).json({ message: 'User created', token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', err });
  }
});

module.exports = router;