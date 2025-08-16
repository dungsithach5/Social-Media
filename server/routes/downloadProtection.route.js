const express = require('express');
const path = require('path');
const { downloadProtection } = require('../middleware/downloadProtection');

const router = express.Router();

// Route để serve hình ảnh có bảo vệ
router.get('/protected-image', downloadProtection, (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL required' });
    }
    
    const imagePath = path.resolve(__dirname, '../public/uploads', path.basename(imageUrl));
    res.sendFile(imagePath);
});

// Route để kiểm tra quyền download (API)
router.get('/check-permission', downloadProtection, (req, res) => {
    res.json({ 
        message: 'Access granted',
        postInfo: req.postInfo 
    });
});

module.exports = router;
