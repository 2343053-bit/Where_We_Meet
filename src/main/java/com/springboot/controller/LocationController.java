package com.springboot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;

import com.springboot.domain.Member;
import com.springboot.domain.ParticipantLocation;
import com.springboot.dto.ParticipantForm;
import com.springboot.service.FriendshipService;
import com.springboot.service.MemberService;

@Controller
@RequestMapping("/main")
public class LocationController {

    // 카카오 API키
    @Value("${kakao.js-key}")
    private String kakaoJsKey;

    private final MemberService memberService;
    private final FriendshipService friendshipService;

    public LocationController(
            MemberService memberService,
            FriendshipService friendshipService) {
        this.memberService = memberService;
        this.friendshipService = friendshipService;
    }

    @GetMapping
    public String getLocations(Model model, Authentication authentication) {
        ParticipantForm participantForm = new ParticipantForm();

        if (isAuthenticatedUser(authentication)) {
            String userId = authentication.getName();
            Member member = memberService.findById(userId);

            if (member != null && !participantForm.getParticipants().isEmpty()) {
                ParticipantLocation first = participantForm.getParticipants().get(0);
                first.setParticipantName(member.getUsername());
                first.setAddress(member.getAddress());
            }

            model.addAttribute("friends", friendshipService.getFriends(userId));
        }

        model.addAttribute("participantForm", participantForm);
        return "main";
    }

    @ModelAttribute
    public void addAttributes(Model model) {
        model.addAttribute("kakaoJsKey", kakaoJsKey);
    }

    private boolean isAuthenticatedUser(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}