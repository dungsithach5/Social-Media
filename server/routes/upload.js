const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const WatermarkService = require('../services/watermarkService');

const router = express.Router();

// Đảm bảo thư mục public/uploads tồn tại
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer lưu file vào public/uploads với tên gốc
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Upload với watermark option
router.post('/with-watermark', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { watermark_enabled, watermark_text, watermark_position } = req.body;
        let imageUrl = `http://localhost:5001/uploads/${req.file.filename}`;
        let watermarkedPath = null;

        // Thêm watermark nếu được yêu cầu
        if (watermark_enabled === 'true' && watermark_text) {
            try {
                watermarkedPath = await WatermarkService.addWatermark(
                    req.file.path,
                    watermark_text,
                    watermark_position || 'bottom-right'
                );
                
                // Cập nhật URL cho hình ảnh đã có watermark
                const watermarkedFilename = path.basename(watermarkedPath);
                imageUrl = `http://localhost:5001/uploads/${watermarkedFilename}`;
            } catch (error) {
                console.error('Watermark error:', error);
                // Vẫn trả về hình ảnh gốc nếu watermark thất bại
            }
        }

        res.json({ 
            imageUrl,
            originalPath: req.file.path,
            watermarkedPath: watermarkedPath
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Upload thông thường (giữ nguyên)
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const imageUrl = `http://localhost:5001/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;