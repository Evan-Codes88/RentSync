import express from 'express';
import auth from '../middleware/auth.js';
import {
  createInspection,
  getGroupInspections,
  getInspection,
  updateInspection,
  deleteInspection,
  assignInspection,
  attendInspection,
} from '../controllers/inspectionController.js';

const router = express.Router();

router.post('/', auth, createInspection);
router.get('/group/:groupIdentifier', auth, getGroupInspections);
router.get('/:id', auth, getInspection);
router.put('/:id', auth, updateInspection);
router.delete('/:id', auth, deleteInspection);
router.post('/:id/assign', auth, assignInspection);
router.post('/:id/attend', auth, attendInspection);

export default router;