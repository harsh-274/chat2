import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import apiClient from "@/lib/api-client";
import {
  FETCH_ALL_MESSAGES_ROUTE,
  GET_CHANNEL_MESSAGES,
  HOST,
  MESSAGE_TYPES,
  GET_CHANNEL_EVENTS,
  ADD_CHANNEL_EVENT,
} from "@/lib/constants";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { IoMdArrowRoundDown } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { MdFolderZip } from "react-icons/md";
import { Button } from "@/components/ui/button";

const MessageContainer = () => {
  const [showImage, setShowImage] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const {
    selectedChatData,
    setSelectedChatMessages,
    selectedChatMessages,
    selectedChatType,
    userInfo,
    setDownloadProgress,
    setIsDownloading,
  } = useAppStore();
  const messageEndRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventTime, setEventTime] = useState("");

  useEffect(() => {
    const getMessages = async () => {
      const response = await apiClient.post(
        FETCH_ALL_MESSAGES_ROUTE,
        {
          id: selectedChatData._id,
        },
        { withCredentials: true }
      );

      if (response.data.messages) {
        setSelectedChatMessages(response.data.messages);
      }
    };
    const getChannelMessages = async () => {
      const response = await apiClient.get(
        `${GET_CHANNEL_MESSAGES}/${selectedChatData._id}`,
        { withCredentials: true }
      );
      if (response.data.messages) {
        setSelectedChatMessages(response.data.messages);
      }
    };
    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
      else if (selectedChatType === "channel") getChannelMessages();
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);

  // Fetch events for channel
  useEffect(() => {
    const fetchEvents = async () => {
      if (selectedChatType === "channel" && selectedChatData._id) {
        const response = await apiClient.get(`/api/channel/${selectedChatData._id}/events`, {
          withCredentials: true,
        });
        if (response.data.events) setEvents(response.data.events);
      }
    };
    fetchEvents();
  }, [selectedChatData, selectedChatType]);

  // Add event handler
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventTime) return;
    const response = await apiClient.post(
      `/api/channel/${selectedChatData._id}/events`,
      {
        title: eventTitle,
        description: eventDescription,
        time: eventTime,
      },
      { withCredentials: true }
    );
    if (response.data.events) {
      setEvents(response.data.events);
      setEventTitle("");
      setEventDescription("");
      setEventTime("");
    }
  };

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatMessages]);

  const checkIfImage = (filePath) => {
    const imageRegex =
      /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
    return imageRegex.test(filePath);
  };

  const downloadFile = async (url) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    const response = await apiClient.get(`${HOST}/${url}`, {
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;
        const percentCompleted = Math.round((loaded * 100) / total);
        setDownloadProgress(percentCompleted);
      },
    });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = urlBlob;
    link.setAttribute("download", url.split("/").pop()); // Optional: Specify a file name for the download
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob); // Clean up the URL object
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  const renderMessages = () => {
    let lastDate = null;
    return selectedChatMessages.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <div key={index} className="">
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.timestamp).format("LL")}
            </div>
          )}
          {selectedChatType === "contact" && renderPersonalMessages(message)}
          {selectedChatType === "channel" && renderChannelMessages(message)}
        </div>
      );
    });
  };

  const renderPersonalMessages = (message) => {
    return (
      <div
        className={`message  ${
          message.sender === selectedChatData._id ? "text-left" : "text-right"
        }`}
      >
        {message.messageType === MESSAGE_TYPES.TEXT && (
          <div
            className={`${
              message.sender !== selectedChatData._id
                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                : "bg-[#2a2b33]/50 text-white/80 border-[#ffffff]/20"
            } border inline-block p-4 rounded my-1 max-w-[50%] break-words`}
          >
            {message.content}
          </div>
        )}
        {message.messageType === MESSAGE_TYPES.FILE && (
          <div
            className={`${
              message.sender !== selectedChatData._id
                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                : "bg-[#2a2b33]/50 text-white/80 border-[#ffffff]/20"
            } border inline-block p-4 rounded my-1 lg:max-w-[50%] break-words`}
          >
            {checkIfImage(message.fileUrl) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImageURL(message.fileUrl);
                }}
              >
                <img
                  src={`${HOST}/${message.fileUrl}`}
                  alt=""
                  height={300}
                  width={300}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-5">
                <span className="text-white/80 text-3xl bg-black/20 rounded-full p-3">
                  <MdFolderZip />
                </span>
                <span>{message.fileUrl.split("/").pop()}</span>
                <span
                  className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                  onClick={() => downloadFile(message.fileUrl)}
                >
                  <IoMdArrowRoundDown />
                </span>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-600">
          {moment(message.timestamp).format("LT")}
        </div>
      </div>
    );
  };

  const renderChannelMessages = (message) => {
    const isAnon = message.isAnonymous;
    return (
      <div
        className={`mt-5  ${
          message.sender._id !== userInfo.id ? "text-left" : "text-right"
        }`}
      >
        {message.messageType === MESSAGE_TYPES.TEXT && (
          <div
            className={`${
              message.sender._id === userInfo.id
                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                : "bg-[#2a2b33]/50 text-white/80 border-[#ffffff]/20"
            } border inline-block p-4 rounded my-1 max-w-[50%] break-words ml-9`}
          >
            {message.content}
          </div>
        )}
        {message.messageType === MESSAGE_TYPES.FILE && (
          <div
            className={`${
              message.sender._id === userInfo.id
                ? "bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50"
                : "bg-[#2a2b33]/50 text-white/80 border-[#ffffff]/20"
            } border inline-block p-4 rounded my-1 max-w-[50%] break-words ml-9`}
          >
            {checkIfImage(message.fileUrl) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImageURL(message.fileUrl);
                }}
              >
                <img
                  src={`${HOST}/${message.fileUrl}`}
                  alt=""
                  height={300}
                  width={300}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-center gap-5">
              <span className="text-white/80 text-3xl bg-black/20 rounded-full p-3">
                <MdFolderZip />
              </span>
              <span>{message.fileUrl.split("/").pop()}</span>
              <span
                className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                onClick={() => downloadFile(message.fileUrl)}
              >
                <IoMdArrowRoundDown />
              </span>
            </div>
          </div>
        )}
        {/* Sender info */}
        {!isAnon && message.sender._id !== userInfo.id ? (
          <div className="flex items-center justify-start gap-3">
            <Avatar className="h-8 w-8">
              {message.sender.image && (
                <AvatarImage
                  src={`${HOST}/${message.sender.image}`}
                  alt="profile"
                  className="rounded-full"
                />
              )}
              <AvatarFallback
                className={`uppercase h-8 w-8 flex ${getColor(
                  message.sender.color
                )} items-center justify-center rounded-full`}
              >
                {message.sender.firstName.split("").shift()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/60">{`${message.sender.firstName} ${message.sender.lastName}`}</span>
            <div className="text-xs text-white/60">
              {moment(message.timestamp).format("LT")}
            </div>
          </div>
        ) : isAnon && message.sender._id !== userInfo.id ? (
          <div className="flex items-center justify-start gap-3">
            <Avatar className="h-8 w-8 bg-gray-500">
              <AvatarFallback className="uppercase h-8 w-8 flex items-center justify-center rounded-full bg-gray-500 text-white">?</AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/60 font-semibold">Anonymous</span>
            <div className="text-xs text-white/60">
              {moment(message.timestamp).format("LT")}
            </div>
          </div>
        ) : (
          <div className="text-xs text-white/60 mt-1">
            {moment(message.timestamp).format("LT")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
      {/* Event List and Add Form for Channels */}
      {selectedChatType === "channel" && (
        <div className="mb-6 p-4 bg-[#23243a] rounded-lg shadow-lg border border-[#33344a]">
          <h3 className="text-lg font-semibold mb-4 text-white">Group Events</h3>
          <form className="flex flex-col md:flex-row md:items-end gap-4 mb-4" onSubmit={handleAddEvent}>
            <div className="flex flex-col flex-1">
              <label className="text-sm text-gray-300 mb-1" htmlFor="event-title">Title</label>
              <input
                id="event-title"
                type="text"
                placeholder="Event Title"
                className="rounded p-2 bg-[#181920] border border-[#444] text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1" htmlFor="event-time">Time</label>
              <input
                id="event-time"
                type="datetime-local"
                className="rounded p-2 bg-[#181920] border border-[#444] text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={eventTime}
                onChange={e => setEventTime(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-sm text-gray-300 mb-1" htmlFor="event-desc">Description</label>
              <input
                id="event-desc"
                type="text"
                placeholder="Description (optional)"
                className="rounded p-2 bg-[#181920] border border-[#444] text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={eventDescription}
                onChange={e => setEventDescription(e.target.value)}
              />
            </div>
            <Button type="submit" className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition-all">Add</Button>
          </form>
          <ul className="space-y-2">
            {events.length === 0 && <li className="text-gray-400">No events yet.</li>}
            {events.map((event, idx) => (
              <li key={idx} className="bg-[#1c1d25] p-3 rounded flex flex-col md:flex-row md:items-center gap-2 border border-[#33344a]">
                <span className="font-semibold text-white">{event.title}</span>
                <span className="text-gray-400">{event.description}</span>
                <span className="text-gray-500 ml-auto">{new Date(event.time).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Existing message rendering */}
      {renderMessages()}
      <div ref={messageEndRef} />
      {showImage && (
        <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-lg flex-col">
          <div>
            <img
              src={`${HOST}/${imageURL}`}
              className="h-[80vh] w-full bg-cover"
              alt=""
            />
          </div>
          <div className="flex gap-5 fixed top-0 mt-5">
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => downloadFile(imageURL)}
            >
              <IoMdArrowRoundDown />
            </button>
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => {
                setShowImage(false);
                setImageURL(null);
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContainer;
