import mongoose from "mongoose";
import Channel from "../model/ChannelModel.js";
import User from "../model/UserModel.js";

export const createChannel = async (request, response, next) => {
  try {
    const { name } = request.body;
    const userId = request.userId;
    const admin = await User.findById(userId);
    if (!admin) {
      return response.status(400).json({ message: "Admin user not found." });
    }

    // Create channel with no members initially, or with creator as first member
    const newChannel = new Channel({
      name,
      members: [], // public channel, users join later
      admin: userId,
    });

    await newChannel.save();

    return response.status(201).json({ channel: newChannel });
  } catch (error) {
    console.error("Error creating channel:", error);
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserChannels = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ channels });
  } catch (error) {
    console.error("Error getting user channels:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "firstName lastName email _id image color",
      },
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const messages = channel.messages;
    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error getting channel messages:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all channels (public listing)
export const getAllChannels = async (req, res) => {
  try {
    const channels = await Channel.find({}).sort({ updatedAt: -1 });
    return res.status(200).json({ channels });
  } catch (error) {
    console.error("Error getting all channels:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Join a channel (add user to members array)
export const joinChannel = async (req, res) => {
  try {
    const userId = req.userId;
    const { channelId } = req.params;
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }
    // Only add if not already a member
    if (!channel.members.some((id) => id.equals(userId))) {
      channel.members.push(userId);
      await channel.save();
    }
    return res.status(200).json({ channel });
  } catch (error) {
    console.error("Error joining channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add an event to a channel
export const addChannelEvent = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { title, description, time } = req.body;
    if (!title || !time) {
      return res.status(400).json({ message: "Title and time are required." });
    }
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }
    channel.events.push({ title, description, time });
    await channel.save();
    return res.status(201).json({ events: channel.events });
  } catch (error) {
    console.error("Error adding event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// List all events for a channel
export const getChannelEvents = async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }
    return res.status(200).json({ events: channel.events });
  } catch (error) {
    console.error("Error getting events:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
