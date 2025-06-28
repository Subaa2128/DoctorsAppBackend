"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatRoomController_1 = require("../controllers/chatRoomController");
const router = express_1.default.Router();
router.post('/', chatRoomController_1.createRoom);
router.get('/user/:userID', chatRoomController_1.getRoomsForUser);
router.get('/:id', chatRoomController_1.getRoomById);
router.put('/:id', chatRoomController_1.updateRoom);
router.delete('/:id', chatRoomController_1.deleteRoom);
exports.default = router;
