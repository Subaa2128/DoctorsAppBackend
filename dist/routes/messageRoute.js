"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const router = express_1.default.Router();
router.post('/send', messageController_1.sendMessage);
router.post('/history/single', messageController_1.getSingleChatHistory);
router.get('/history/group/:roomID', messageController_1.getGroupChatHistory);
router.get('/:id', messageController_1.getMessageById);
router.put('/:id', messageController_1.updateMessage);
router.delete('/:id', messageController_1.deleteMessage);
exports.default = router;
