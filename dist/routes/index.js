"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = exports.chatRoomRouter = exports.messageRouter = exports.userRouter = void 0;
var userRoute_1 = require("./userRoute");
Object.defineProperty(exports, "userRouter", { enumerable: true, get: function () { return __importDefault(userRoute_1).default; } });
var messageRoute_1 = require("./messageRoute");
Object.defineProperty(exports, "messageRouter", { enumerable: true, get: function () { return __importDefault(messageRoute_1).default; } });
var chatRoomRoute_1 = require("./chatRoomRoute");
Object.defineProperty(exports, "chatRoomRouter", { enumerable: true, get: function () { return __importDefault(chatRoomRoute_1).default; } });
var notificationRoute_1 = require("./notificationRoute");
Object.defineProperty(exports, "notificationRouter", { enumerable: true, get: function () { return __importDefault(notificationRoute_1).default; } });
