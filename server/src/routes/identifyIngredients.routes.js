import { Router } from 'express';
import multer from 'multer';
import { identifyIngredients } from '../controllers/identifyIngredients.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      return callback(new Error('Only image uploads are allowed'));
    }

    callback(null, true);
  },
});

router.post('/', upload.single('image'), identifyIngredients);

export default router;
