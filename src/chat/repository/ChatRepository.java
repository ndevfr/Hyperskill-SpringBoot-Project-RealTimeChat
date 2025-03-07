package chat.repository;

import chat.dto.ChatMessage;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Repository
public class ChatRepository {
    private final CopyOnWriteArrayList<ChatMessage> messageHistory = new CopyOnWriteArrayList<>();

    public void addMessage(ChatMessage chatMessage) {
        messageHistory.add(chatMessage);
    }

    public List<ChatMessage> getPrivateChatHistory(String currentUsername, String username) {
        return messageHistory.stream()
                .filter(message -> message.getType() == ChatMessage.MessageType.PRIVATE)
                .filter(message -> (message.getSender().equals(username) && message.getReceiver().equals(currentUsername)) ||
                        (message.getSender().equals(currentUsername) && message.getReceiver().equals(username)))
                .toList();
    }

    public List<ChatMessage> getPublicChatHistory() {
        return messageHistory.stream()
                .filter(message -> message.getType() == ChatMessage.MessageType.CHAT)
                .toList();
    }
}