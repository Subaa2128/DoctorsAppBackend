import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController';

const router = express.Router();

router.post('/', createUser as any);      
router.get('/', getAllUsers);       
router.get('/:userID', getUserById as any);    
router.put('/:userID', updateUser as any);    
router.delete('/:id', deleteUser as any);  

export default router;
