const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/serverController');
const cloudinary = require('../config/cloudinary'); 

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
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
    if (req.file) {
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
      
      // Add Cloudinary URL to request object
      req.cloudinaryUrl = result.secure_url;
      req.cloudinaryPublicId = result.public_id;
    }
    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ 
      status: 500, 
      message: 'Image upload failed' 
    });
  }
};

router.post(
  '/create_server',
  auth,
  upload.single('server_image'),
  uploadToCloudinary,
  ctrl.createServer
);

router.post('/server_info', auth, ctrl.getServerInfo);
router.post('/add_new_category', auth, ctrl.addCategory);
router.post('/add_new_channel', auth, ctrl.addChannel);
router.post('/leave_server', auth, ctrl.leaveServer);

module.exports = router;