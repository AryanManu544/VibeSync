const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/serverController');
const cloudinary = require('../config/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// Middleware to upload to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  try {
    console.log('🖼️ Cloudinary middleware - File present:', req.file ? 'Yes' : 'No');
    
    if (req.file) {
      console.log('📤 Uploading to Cloudinary...');
      console.log('📊 File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'vibesync/servers', // Organize in folders
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit' }, // Resize if too large
          { quality: 'auto' }, // Auto optimize quality
          { fetch_format: 'auto' } // Auto format 
        ]
      });
      
      console.log('✅ Cloudinary upload successful:', result.secure_url);
      
      // Add Cloudinary URL to request object
      req.cloudinaryUrl = result.secure_url;
      req.cloudinaryPublicId = result.public_id;
    } else {
      console.log('ℹ️ No file to upload to Cloudinary');
    }
    next();
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      status: 500,
      message: 'Image upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.error('❌ Multer error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 400,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      status: 400, 
      message: `Upload error: ${error.message}`
    });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      status: 400,
      message: 'Only image files are allowed'
    });
  }
  
  next(error);
};

// Routes
router.post(
  '/create_server',
  auth,
  upload.single('server_image'),
  handleMulterError,
  uploadToCloudinary,
  ctrl.createServer
);

router.post('/server_info', auth, ctrl.getServerInfo);
router.post('/add_new_category', auth, ctrl.addCategory);
router.post('/add_new_channel', auth, ctrl.addChannel);
router.post('/leave_server', auth, ctrl.leaveServer);

module.exports = router;