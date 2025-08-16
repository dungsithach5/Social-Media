const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class WatermarkService {
    /**
     * Thêm watermark vào hình ảnh
     * @param {string} imagePath - Đường dẫn hình ảnh gốc
     * @param {string} watermarkText - Nội dung watermark
     * @param {string} position - Vị trí watermark (top-left, center, bottom-right)
     * @returns {Promise<string>} - Đường dẫn hình ảnh đã có watermark
     */
    static async addWatermark(imagePath, watermarkText, position = 'bottom-right') {
        try {
            const image = sharp(imagePath);
            const metadata = await image.metadata();
            
            // Tạo watermark text
            const watermarkSvg = this.createWatermarkSvg(watermarkText, metadata.width, metadata.height, position);
            
            // Thêm watermark vào hình ảnh
            const watermarkedImage = await image
                .composite([{
                    input: Buffer.from(watermarkSvg),
                    top: this.getWatermarkPosition(position, metadata.height),
                    left: this.getWatermarkPosition(position, metadata.width)
                }])
                .jpeg({ quality: 90 })
                .toBuffer();
            
            // Lưu hình ảnh đã có watermark
            const watermarkedPath = imagePath.replace('.', '_watermarked.');
            await fs.promises.writeFile(watermarkedPath, watermarkedImage);
            
            return watermarkedPath;
        } catch (error) {
            console.error('Error adding watermark:', error);
            throw error;
        }
    }
    
    /**
     * Tạo SVG watermark
     */
    static createWatermarkSvg(text, imageWidth, imageHeight, position) {
        const fontSize = Math.max(20, Math.min(imageWidth, imageHeight) * 0.03);
        const padding = 20;
        
        return `
            <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
                    </filter>
                </defs>
                <text 
                    x="${this.getTextX(position, imageWidth, padding)}" 
                    y="${this.getTextY(position, imageHeight, padding)}"
                    font-family="Arial, sans-serif" 
                    font-size="${fontSize}" 
                    fill="rgba(255,255,255,0.8)" 
                    filter="url(#shadow)"
                    text-anchor="${this.getTextAnchor(position)}"
                >
                    ${text}
                </text>
            </svg>
        `;
    }
    
    /**
     * Lấy vị trí X cho text
     */
    static getTextX(position, width, padding) {
        switch (position) {
            case 'top-left':
            case 'bottom-left':
                return padding;
            case 'center':
                return width / 2;
            case 'top-right':
            case 'bottom-right':
                return width - padding;
            default:
                return width - padding;
        }
    }
    
    /**
     * Lấy vị trí Y cho text
     */
    static getTextY(position, height, padding) {
        switch (position) {
            case 'top-left':
            case 'top-right':
                return padding + 20;
            case 'center':
                return height / 2;
            case 'bottom-left':
            case 'bottom-right':
                return height - padding;
            default:
                return height - padding;
        }
    }
    
    /**
     * Lấy text anchor
     */
    static getTextAnchor(position) {
        switch (position) {
            case 'top-left':
            case 'bottom-left':
                return 'start';
            case 'center':
                return 'middle';
            case 'top-right':
            case 'bottom-right':
                return 'end';
            default:
                return 'end';
        }
    }
    
    /**
     * Lấy vị trí watermark
     */
    static getWatermarkPosition(position, dimension) {
        switch (position) {
            case 'top-left':
                return 0;
            case 'center':
                return Math.floor(dimension / 2);
            case 'bottom-right':
                return dimension;
            default:
                return 0;
        }
    }
}

module.exports = WatermarkService;
