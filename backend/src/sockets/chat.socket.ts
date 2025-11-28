import { Server, Socket } from "socket.io";
import { Chat } from "../models/chat.model";

const setupChatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    // On connect
    console.log(`User connected: ${socket.id}`);

    socket.on("joinRoom", (data) => {
      const { room, username } = data;
      socket.join(room);
      console.log(`${username} joined room: ${room}`);

      socket.to(room).emit("systemMessage", {
        message: `${username} joined the room`,
      });

      socket.emit("systemMessage", {
        message: `You joined ${room} room`,
      });
    });

    socket.on("leaveRoom", (data) => {
      const { room, username } = data;
      socket.leave(room);
      console.log(`${username} left room: ${room}`);

      socket.to(room).emit("systemMessage", {
        message: `${username} left the room`,
      });
    });

    socket.on("sendMessage", async (data) => {
      const { username, message, room } = data;

      try {
        const chat = new Chat({ username, message, room });
        await chat.save();

        if (room) {
          io.to(room).emit("newMessage", chat);
        } else {
          io.emit("newMessage", chat);
        }
      } catch (error) {
        console.error("Error saving chat:", error);
      }
    });

    // On disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export default setupChatSocket;
