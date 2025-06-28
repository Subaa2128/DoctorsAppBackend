import express from 'express';
import {
  createRoom,
  getRoomsForUser,
  getRoomById,
  updateRoom,
  deleteRoom
} from '../controllers/chatRoomController';

const router = express.Router();

router.post('/', createRoom as any);                  
router.get('/user/:userID', getRoomsForUser);    
router.get('/:id', getRoomById as any);              
router.put('/:id', updateRoom as any);                   
router.delete('/:id', deleteRoom as any);                

export default router;
