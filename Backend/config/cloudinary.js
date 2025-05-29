const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'profile_pics',
    format: async (req, file) => file.mimetype.split('/')[1], 
    public_id: (req, file) => `${req.userId}-${Date.now()}`
  },
});

module.exports = { cloudinary, storage };
