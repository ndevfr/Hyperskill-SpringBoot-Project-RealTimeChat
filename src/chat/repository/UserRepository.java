package chat.repository;

import chat.dto.User;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Repository
public class UserRepository {
    private final CopyOnWriteArrayList<User> users = new CopyOnWriteArrayList<>();

    public void addUser(String username) {
        users.add(new User(username, LocalDateTime.now()));
    }

    public void removeUser(String username) {
        users.removeIf(user -> user.getUsername().equals(username));
    }

    public boolean existUser(String username) {
        return users.stream().anyMatch(user -> user.getUsername().equals(username));
    }

    public List<User> getActiveUsers() {
        return users.stream()
                .filter(user -> !user.getUsername().isEmpty())
                .sorted(Comparator.comparing(User::getJoined))
                .toList();
    }
}