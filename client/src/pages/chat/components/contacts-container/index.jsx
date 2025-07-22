import ContactList from "@/components/common/contact-list";
import Logo from "@/components/common/logo";
import ProfileInfo from "./components/profile-info";
import apiClient from "@/lib/api-client";
import {
  GET_CONTACTS_WITH_MESSAGES_ROUTE,
  GET_ALL_CHANNELS,
  JOIN_CHANNEL,
} from "@/lib/constants";
import { useEffect } from "react";
import { useAppStore } from "@/store";
import NewDM from "./components/new-dm/new-dm";
import CreateChannel from "./components/create-channel/create-channel";
import { Button } from "@/components/ui/button";

const ContactsContainer = () => {
  const {
    setDirectMessagesContacts,
    directMessagesContacts,
    channels,
    setChannels,
    userInfo,
    setSelectedChatType,
    setSelectedChatData,
    setSelectedChatMessages,
  } = useAppStore();

  useEffect(() => {
    const getContactsWithMessages = async () => {
      const response = await apiClient.get(GET_CONTACTS_WITH_MESSAGES_ROUTE, {
        withCredentials: true,
      });
      if (response.data.contacts) {
        setDirectMessagesContacts(response.data.contacts);
      }
    };
    getContactsWithMessages();
  }, [setDirectMessagesContacts]);

  useEffect(() => {
    const getChannels = async () => {
      const response = await apiClient.get(GET_ALL_CHANNELS, {
        withCredentials: true,
      });
      if (response.data.channels) {
        setChannels(response.data.channels);
      }
    };
    getChannels();
  }, [setChannels]);

  // Helper to check if user is a member
  const isMember = (channel) =>
    channel.members && channel.members.some((m) => m === userInfo.id || (m._id && m._id === userInfo.id));

  // Join channel handler
  const joinChannel = async (channelId) => {
    const response = await apiClient.post(
      `${JOIN_CHANNEL}/${channelId}`,
      {},
      { withCredentials: true }
    );
    if (response.status === 200 && response.data.channel) {
      setChannels((prev) =>
        prev.map((ch) => (ch._id === channelId ? response.data.channel : ch))
      );
    }
  };

  return (
    <div className="relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full">
      <div className=" pt-3">
        <Logo />
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Direct Messages" />
          <NewDM />
        </div>
        <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
          <ContactList contacts={directMessagesContacts} />
        </div>
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Channels" />
          <CreateChannel />
        </div>
        <div className="max-h-[37vh] overflow-y-auto scrollbar-hidden pb-5">
          {channels.map((channel) => {
            const member = isMember(channel);
            return (
              <div
                key={channel._id}
                className={`flex items-center justify-between pl-10 pr-4 py-2 hover:bg-[#f1f1f111] transition-all duration-300 ${member ? 'cursor-pointer' : ''}`}
                style={{ opacity: member ? 1 : 0.5 }}
                onClick={() => {
                  if (member) {
                    setSelectedChatType("channel");
                    setSelectedChatData(channel);
                    setSelectedChatMessages([]);
                  }
                }}
              >
                <div className="flex-1">
                  <span>{channel.name}</span>
                </div>
                {!member ? (
                  <Button size="sm" onClick={e => { e.stopPropagation(); joinChannel(channel._id); }}>
                    Join
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <ProfileInfo />
    </div>
  );
};

export default ContactsContainer;

const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm">
      {text}
    </h6>
  );
};
