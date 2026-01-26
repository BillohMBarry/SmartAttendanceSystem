
// import { v2 as cloudinary } from 'cloudinary';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import multer from 'multer';
// import dotenv from 'dotenv';
// import type { Request } from 'express';

// dotenv.config();

// cloudinary.config({
//     cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME),
//     api_key: String(process.env.CLOUDINARY_API_KEY),
//     api_secret: String(process.env.CLOUDINARY_API_SECRET)
// });

// export const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'attendance-system',
//         allowed_formats: ['jpg', 'png', 'jpeg'],
//         public_id: (req: Request, file: Express.Multer.File) => {
//             const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//             return file.fieldname + '-' + uniqueSuffix;
//         }
//     }
// });

// export const upload = multer({ storage });
