package chat.controller;

import chat.dto.ChatMessage;
import chat.repository.ChatRepository;
import chat.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDateTime;
import java.util.List;

@Controller
public class ChatController {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/chat/history")
    @ResponseBody
    public List<ChatMessage> history() {
        return chatRepository.getPublicChatHistory();
    }

    @GetMapping("/chat/history/{username}")
    @ResponseBody
    public List<ChatMessage> historyUser(@PathVariable("username") String username, HttpSession httpSession) {
        String currentUsername = (String) httpSession.getAttribute("username");
        return chatRepository.getPrivateChatHistory(currentUsername, username);
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());
        if (chatMessage.getType() == ChatMessage.MessageType.CHAT) {
            chatRepository.addMessage(chatMessage);
        }
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = chatMessage.getSender();
        headerAccessor.getSessionAttributes().put("username", username);
        if( !userRepository.existUser(username) ){
            userRepository.addUser(username);
        }
        return chatMessage;
    }

    @MessageMapping("/chat.sendPrivate")
    public void sendPrivate(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setType(ChatMessage.MessageType.PRIVATE);
        chatRepository.addMessage(chatMessage);
        System.out.println("Receiver: %s".formatted(chatMessage.getReceiver()));
        System.out.println("Sender: %s".formatted(chatMessage.getSender()));
        System.out.println(chatMessage.getContent());
        messagingTemplate.convertAndSendToUser(chatMessage.getReceiver(), "/private", chatMessage);
        messagingTemplate.convertAndSendToUser(chatMessage.getSender(), "/private", chatMessage);
    }
}