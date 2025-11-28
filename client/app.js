const PORT = 8080;
const socket = io(`http://localhost:${PORT}`);

const chatForm = document.getElementById("chatForm");
const usernameInput = document.getElementById("usernameInput");
const messageInput = document.getElementById("messageInput");
const messagesList = document.getElementById("messagesList");
const roomButtons = document.querySelectorAll(".room-btn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const currentRoomName = document.getElementById("currentRoomName");

let currentRoom = null;

leaveRoomBtn.disabled = true;

roomButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const room = btn.dataset.room;
    joinRoom(room);
  });
});

leaveRoomBtn.addEventListener("click", () => {
  if (currentRoom) {
    leaveRoom(currentRoom);
  }
});

function joinRoom(room) {
  const username = usernameInput.value.trim();

  if (!username) {
    alert("Please enter your username first!");
    usernameInput.focus();
    return;
  }

  if (currentRoom) {
    socket.emit("leaveRoom", { room: currentRoom, username });
  }

  currentRoom = room;
  socket.emit("joinRoom", { room, username });

  updateRoomUI(room);

  messagesList.innerHTML = "";
  fetchMessagesByRoom(room);
}

function leaveRoom(room) {
  const username = usernameInput.value.trim();

  if (username) {
    socket.emit("leaveRoom", { room, username });
  }

  currentRoom = null;
  messagesList.innerHTML = "";

  updateRoomUI(null);
}

function updateRoomUI(room) {
  roomButtons.forEach((btn) => {
    if (btn.dataset.room === room) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  currentRoomName.textContent = room
    ? room.charAt(0).toUpperCase() + room.slice(1)
    : "None";

  leaveRoomBtn.disabled = !room;
}

async function fetchMessagesByRoom(room) {
  try {
    const response = await fetch(
      `http://localhost:${PORT}/api/chat/room/${room}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const messages = await response.json();

    if (Array.isArray(messages)) {
      messages.reverse().forEach((msg) => {
        displayMessage(msg);
      });
    } else {
      console.error("Received non-array response:", messages);
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const message = messageInput.value.trim();

  if (!username || !message) {
    alert("Please enter both username and message!");
    return;
  }

  if (!currentRoom) {
    alert("Please join a room first!");
    return;
  }

  socket.emit("sendMessage", {
    username,
    message,
    room: currentRoom,
  });

  messageInput.value = "";
  messageInput.focus();
});

socket.on("newMessage", (data) => {
  displayMessage(data);
});

socket.on("systemMessage", (data) => {
  displaySystemMessage(data.message);
});

function displayMessage(msg) {
  const li = document.createElement("li");

  const usernameSpan = document.createElement("span");
  usernameSpan.className = "message-username";
  usernameSpan.textContent = msg.username + ": ";

  const messageSpan = document.createElement("span");
  messageSpan.className = "message-text";
  messageSpan.textContent = msg.message;

  const timeSpan = document.createElement("span");
  timeSpan.className = "message-time";
  const messageTime = new Date(msg.createdAt || msg.timestamp || Date.now());
  timeSpan.textContent = messageTime.toLocaleTimeString();

  li.appendChild(usernameSpan);
  li.appendChild(messageSpan);
  li.appendChild(timeSpan);

  messagesList.appendChild(li);
}

function displaySystemMessage(text) {
  const li = document.createElement("li");
  li.className = "system-message";
  li.textContent = text;
  messagesList.appendChild(li);
}

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
  displaySystemMessage("Disconnected from server");
});
