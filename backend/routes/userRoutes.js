import express from 'express';
import auth from '../middleware/auth.js';
import {
  signup,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getAllUsers,
  getUserById,
  searchUsers,
} from '../controllers/userController.js';

const router = express.Router();


router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', auth, logout);

router.get('/me', auth, getUserProfile);
router.put('/me', auth, updateUserProfile);
router.delete('/me', auth, deleteUserProfile);
router.get('/', auth, getAllUsers);
router.get('/search', auth, searchUsers);
router.get('/:id', auth, getUserById);

export default router;