import { User } from '../models/Users.js';
import mongoose from 'mongoose';
import { mongodbUri } from '../config/config.js';

(async () => {
  await mongoose.connect(mongodbUri);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin || !admin.office) {
    console.error('Admin or admin office not found');
    process.exit(1);
  }

  await User.updateMany(
    {
      role: 'employee',
      $or: [
        { office: { $exists: false } },
        { office: null }
      ]
    },
    { $set: { office: admin.office } },
  )
  console.log('Office assigned to employees successfully');
  process.exit(0);
})()