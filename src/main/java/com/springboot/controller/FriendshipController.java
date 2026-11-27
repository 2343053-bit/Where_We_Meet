package com.springboot.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.springboot.domain.Friendship;
import com.springboot.domain.Member;
import com.springboot.service.FriendshipService;
import org.springframework.ui.Model;



@Controller
@RequestMapping("/friends")
public class FriendshipController {

    @Autowired
	FriendshipService friendshipService;

    //친구 목록 보여줄 페이지
    @GetMapping
    public String showFriendList(Authentication authentication, Model model) {
        String myId = authentication.getName();
        List<Member> friendsList = friendshipService.getFriends(myId);
        
        model.addAttribute("friends", friendsList);
        return "friends/friendList";
    }

    //친구 삭제 버튼
    @PostMapping("/delete")
    public String deleteFriend(Authentication authentication, @RequestParam String friendId) {
        String myId = authentication.getName();
        friendshipService.deleteFriend(myId, friendId);
        return "redirect:/friends";
    }
    
    //받은 친구 요청 보여줄 페이지
    @GetMapping("/requests/received")
    public String receivedRequestList(Authentication authentication, Model model) {
        String myId = authentication.getName();
        List<Friendship> received = friendshipService.getReceivedRequests(myId);

        model.addAttribute("received", received);
        return "friends/receivedRequestList";
    }

        //친구 수락 버튼
    @PostMapping("/accept")
    public String acceptRequest(Authentication authentication, @RequestParam Long requestId) {
        friendshipService.acceptRequest(requestId);
        return "redirect:/friends/requests/received";
    }

    //친구 거절 버튼
    @PostMapping("/reject")
    public String rejectRequest(Authentication authentication, @RequestParam Long requestId) {
        friendshipService.rejectRequest(requestId);
        return "redirect:/friends/requests/received";
    }

    //친구 요청 보내는 페이지
    @GetMapping("/requests/new")
    public String sendRequestForm() {
        return "friends/sendRequest";
    }

    //친구 요청 보내기 버튼
    @PostMapping("/requests/new")
    public String sendRequest(Authentication authentication, @RequestParam String friendId, RedirectAttributes redirectAttributes) {
        String myId = authentication.getName();
        
    try {
            friendshipService.sendRequest(myId, friendId);
            redirectAttributes.addFlashAttribute("successMessageKey", "friend.request.send.success");
        } catch (IllegalArgumentException e) {
            String messageKey = (e.getMessage() != null && e.getMessage().startsWith("friend."))
                    ? e.getMessage()
                    : "friend.error.invalidRequest";
            redirectAttributes.addFlashAttribute("errorMessageKey", messageKey);
        }

        return "redirect:/friends/requests/new";
    }
}
