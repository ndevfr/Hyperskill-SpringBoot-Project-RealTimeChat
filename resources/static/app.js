let stompClient = null;

const loginContainer = document.getElementById('login-app-container');
const loginInput = document.getElementById('input-username');
const loginBtn = document.getElementById('send-username-btn');
const chatContainer = document.getElementById('app-container');
const messageInput = document.getElementById('input-msg')
const sendBtn = document.getElementById('send-msg-btn');
const messages = document.getElementById('messages');
const chatTitle = document.getElementById('current-chat');
const usersList = document.getElementById('users-list');
const switchToPublicBtn = document.getElementById('public-chat-btn');
const exitBtn = document.getElementById('leave-chat-btn');
let privateChatBtn = undefined;
let selectedChat = "public";

const getUsername = () => {
    return sessionStorage.getItem("username");
}

const setUsername = async () => {
    const username = document.getElementById('input-username').value.trim();
    try {
        const response = await fetch('/user/connect?username=' + encodeURIComponent(username), {
            method: 'POST'
        });
        const json = await response.json();
        if(json.status === 1) {
            sessionStorage.setItem("username", json.message);
            loginContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            connectWebSocket();
        }
    } catch (error) {
        console.error('Error connecting user:', error);
    }
}

const disconnect = async () => {
    const username = document.getElementById('input-username').value.trim();
    try {
        const response = await fetch('/user/disconnect?username=' + encodeURIComponent(username), {
            method: 'POST'
        });
        const json = await response.json();
        console.log(json);
        if(json.status === 1){
            sessionStorage.removeItem('username');
            loginContainer.classList.remove('hidden');
            chatContainer.classList.add('hidden');
            disconnectWebSocket();
        }
    } catch (error) {
        console.error('Error disconnecting user:', error);
        return null;
    }
}

const reconnect = () => {
    if(getUsername()){
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        connectWebSocket();
    }
}

const connectWebSocket = () => {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, onWebSocketConnected, onWebSocketError);
}

const disconnectWebSocket = () => {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    stompClient = null;
}

const fetchData = (url, callback) => {
    fetch(url, { method: 'GET' })
        .then(response => response.json())
        .then(callback);
};

const onWebSocketConnected = () => {
    const currentUsername = getUsername();
    stompClient.subscribe('/topic/public', handleMessageReceived);
    stompClient.subscribe(`/user/${currentUsername}/private`, handleMessageReceived);
    stompClient.subscribe('/topic/users', handleActiveUsersReceived);
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({sender: currentUsername, type: 'JOIN'}));
    fetchData('/chat/history', handleHistoryReceived);
    fetchData('/user/getActiveUsers', handleActiveUsersReceived);
}

const onWebSocketError = (error) => {
    console.error('WebSocket connection error:', error);
    if (error.indexOf("Whoops! Lost connection") === 0) {
        sessionStorage.removeItem('username');
        loginContainer.classList.remove('hidden');
        chatContainer.classList.add('hidden');
    }
}

const switchToPrivateChat = (username) => {
    if (privateChatBtn) privateChatBtn.classList.remove('selected-chat');
    switchToPublicBtn.classList.remove('selected-chat');
    privateChatBtn = document.getElementById(username);
    const counterElement = privateChatBtn.querySelector('.counter');
    counterElement.classList.add('hidden');
    counterElement.innerText = '';
    privateChatBtn.classList.add('selected-chat');
    selectedChat = username;
    chatTitle.textContent = `Private chat with ${username}`;
    messages.innerHTML = '';
    fetchData(`/chat/history/${username}`, handleHistoryReceived);
}

const switchToPublicChat = () => {
    if (!privateChatBtn) return;
    chatTitle.textContent = "Public chat";
    privateChatBtn.classList.remove('selected-chat');
    switchToPublicBtn.classList.add('selected-chat');
    messages.innerHTML = '';
    fetchData('/chat/history', handleHistoryReceived);
    selectedChat = "public";
    privateChatBtn = undefined;
}

const handleActiveUsersReceived = (payload) => {
    document.getElementById('users-list').innerHTML = '';
    payload.filter(user => user.username !== getUsername() && user.username != null)
        .forEach(user => addUser(user.username));
}

const addUser = (user) => {
    const userButton = document.createElement('div');
    userButton.classList.add('user-container');
    userButton.setAttribute('id', user);
    userButton.onclick = () => switchToPrivateChat(user);
    const usernameElement = document.createElement('div');
    usernameElement.classList.add('user');
    usernameElement.innerText = user;
    const counterElement = document.createElement('div');
    counterElement.classList.add('counter');
    counterElement.classList.add('hidden');
    userButton.appendChild(usernameElement);
    userButton.appendChild(counterElement);
    usersList.appendChild(userButton);
}

const removeUser = (user) => {
    const userElement = document.getElementById(user);
    if (userElement.classList.contains('selected-chat')) {
        switchToPublicChat();
    }
    userElement.remove();
}

const handleHistoryReceived = (payload) => {
    payload.forEach(message => {
        addMessage(message);
    });
}

const sendMessage = () => {
    const currentUsername = getUsername();
    const messageContent = messageInput.value.trim();
    if (selectedChat === "public") {
        if (messageContent && stompClient && currentUsername) {
            const chatMessage = {
                sender: currentUsername,
                content: messageContent,
                type: 'CHAT'
            };
            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
            messageInput.value = '';
        }
    } else {
        if (messageContent && stompClient && currentUsername) {
            const chatMessage = {
                sender: currentUsername,
                receiver: selectedChat,
                content: messageContent,
                type: 'PRIVATE'
            };
            stompClient.send("/app/chat.sendPrivate", {}, JSON.stringify(chatMessage));
            messageInput.value = '';
        }
    }
}

const handleMessageReceived = (payload) => {
    const currentUsername = getUsername();
    const message = JSON.parse(payload.body);
    if (message.type === 'JOIN' && currentUsername !== message.sender) {
        addUser(message.sender)
    } else if (message.type === 'LEAVE') {
        removeUser(message.sender)
    } else if (message.type === 'CHAT' && selectedChat === "public") {
        addMessage(message);
    } else if (message.type === 'PRIVATE') {
        if (selectedChat === message.sender || message.sender === currentUsername) {
            addMessage(message);
        } else {
            incCounter(message.sender);
        }
    }
}

const incCounter = (username) => {
    const counterElement = document.getElementById(username).querySelector('.counter');
    counterElement.classList.remove('hidden');
    if (counterElement.innerText === '') {
        counterElement.innerText = 1;
    } else {
        counterElement.innerText = parseInt(counterElement.innerText) + 1;
    }
}

const addMessage = (message) => {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');

    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    const content = document.createElement('div');
    content.innerText = message.content;
    messageElement.appendChild(content);

    const headerElement = document.createElement('div');
    headerElement.classList.add('message-header');

    const senderElement = document.createElement('div');
    senderElement.classList.add('sender');
    senderElement.innerText = message.sender;
    headerElement.appendChild(senderElement);
    const dateElement = document.createElement('div');
    dateElement.classList.add('date');
    dateElement.innerText = getCurrentDate();
    headerElement.appendChild(dateElement);

    messageContainer.appendChild(headerElement);
    messageContainer.appendChild(messageElement);
    messages.appendChild(messageContainer);
    messageContainer.scrollIntoView()
}

const getCurrentDate = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const month = now.getMonth().toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `le ${day}/${month} à ${hours}h${minutes}`;
}

document.addEventListener("DOMContentLoaded", () => {
    loginBtn.addEventListener('click', setUsername);
    sendBtn.addEventListener('click', sendMessage);
    exitBtn.addEventListener('click', disconnect);
    switchToPublicBtn.addEventListener('click', switchToPublicChat);
    loginInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            setUsername();
        }
    });
    messageInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    })
    reconnect();
});