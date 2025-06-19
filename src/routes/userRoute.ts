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
router.get('/:id', getUserById as any);    
router.put('/:id', updateUser as any);    
router.delete('/:id', deleteUser as any);  

export default router;
