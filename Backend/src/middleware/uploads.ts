// import multer from 'multer';
// import { storage } from '../config/cloudinary.js';
// import type { Request } from 'express';

// // File filter to only allow images
// const fileFilter = (
//     req: Request,
//     file: Express.Multer.File,
//     cb: multer.FileFilterCallback
// ) => {
//     // Accept only image files
//     if (file.mimetype.startsWith('image/')) {
//         cb(null, true);
//     } else {
//         cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
//     }
// };

// // Configure multer with storage, file filter, and size limits
// export const upload = multer({
//     storage: storage,
//     fileFilter: fileFilter,
//     limits: {
//         fileSize: 5 * 1024 * 1024, // 5MB max file size
//         files: 1, // Only allow 1 file per request
//     },
// });
