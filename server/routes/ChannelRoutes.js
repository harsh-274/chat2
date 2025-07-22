import { Router } from "express";
import {
  createChannel,
  getChannelMessages,
  getUserChannels,
  getAllChannels,
  joinChannel,
  addChannelEvent,
  getChannelEvents
} from "../controllers/ChannelControllers.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const channelRoutes = Router();

channelRoutes.post("/create-channel", verifyToken, createChannel);
channelRoutes.get("/get-user-channels", verifyToken, getUserChannels);
channelRoutes.get("/all", verifyToken, getAllChannels);
channelRoutes.post("/join/:channelId", verifyToken, joinChannel);
channelRoutes.post("/:channelId/events", verifyToken, addChannelEvent);
channelRoutes.get("/:channelId/events", verifyToken, getChannelEvents);
channelRoutes.get(
  "/get-channel-messages/:channelId",
  verifyToken,
  getChannelMessages
);

export default channelRoutes;
