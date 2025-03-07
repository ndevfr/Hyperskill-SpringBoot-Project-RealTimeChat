package chat.controller;

import chat.dto.JsonData;
import chat.dto.User;
import chat.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/user/connect")
    @ResponseBody
    public JsonData connect(@RequestParam("username") String username, HttpSession session) {
        String savedUsername = username;
        int i = 1;
        while( userRepository.existUser(savedUsername) ){
            savedUsername = username + i;
            i++;
        }
        userRepository.addUser(savedUsername);
        session.setAttribute("username", savedUsername);
        return new JsonData(1, savedUsername);
    }

    @PostMapping("/user/disconnect")
    @ResponseBody
    public JsonData disconnect(@RequestParam("username") String username, HttpSession session) {
        if( userRepository.existUser(username) ){
            userRepository.removeUser(username);
            session.invalidate();
            return new JsonData(1, "User %s disconnected".formatted(username));
        } else {
            return new JsonData(0, "User %s not found".formatted(username));
        }
    }

    @GetMapping("/user/getActiveUsers")
    @ResponseBody
    public List<User> getActiveUsers() {
        return userRepository.getActiveUsers();
    }
}