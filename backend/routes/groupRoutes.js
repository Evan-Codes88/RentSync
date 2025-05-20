import express from 'express';
import auth from '../middleware/auth.js';
import {
  createGroup,
  getUserGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  requestToJoinGroup,
  approveJoinRequest,
  rejectJoinRequest,
  leaveGroup,
} from '../controllers/groupController.js';

const router = express.Router();

router.post('/', auth, createGroup);
router.get('/', auth, getUserGroups);
router.get('/:identifier', auth, getGroup);
router.put('/:identifier', auth, updateGroup);
router.delete('/:id', auth, deleteGroup);
router.post('/:id/request', auth, requestToJoinGroup);
router.post('/:groupId/requests/:userId/approve', auth, approveJoinRequest);
router.delete('/:groupId/requests/:userId/reject', auth, rejectJoinRequest);
router.post('/:identifier/leave', auth, leaveGroup);

export default router;