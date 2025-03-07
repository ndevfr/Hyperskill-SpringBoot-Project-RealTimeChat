package chat.dto;

import java.time.LocalDateTime;

public class User {
    private String username;
    private LocalDateTime joined;

    public User(String username, LocalDateTime joined) {
        this.username = username;
        this.joined = joined;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public LocalDateTime getJoined() {
        return joined;
    }

    public void setJoined(LocalDateTime joined) {
        this.joined = joined;
    }
}