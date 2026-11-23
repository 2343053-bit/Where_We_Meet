package com.springboot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import com.springboot.domain.MeetingPoint;
import com.springboot.domain.ParticipantLocation;
import com.springboot.repository.ParticipantForm;
import com.springboot.service.MeetingPointService;
import org.springframework.security.core.Authentication;
import com.springboot.domain.Member;
import com.springboot.service.MemberService;


@Controller 
@RequestMapping("/main")
public class LocationController {
    
    //카카오 API키
    @Value("${kakao.js-key}")
    private String kakaoJsKey;

    
    @GetMapping
    public String getLocations(Model model, Authentication authentication) {
        ParticipantForm participantForm = new ParticipantForm();

        if (authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            Member member = memberService.findById(authentication.getName());
            ParticipantLocation first = participantForm.getParticipants().get(0);
            first.setParticipantName(member.getUsername());
            first.setAddress(member.getAddress());
        }

        model.addAttribute("participantForm", participantForm);
        model.addAttribute("kakaoJsKey", kakaoJsKey);
        return "main";
    }

    private final MeetingPointService meetingPointService;
    private final MemberService memberService;

    public LocationController(
            MeetingPointService meetingPointService,
            MemberService memberService) {
        this.meetingPointService = meetingPointService;
        this.memberService = memberService;
    }

    @PostMapping
    public String postLocations(@ModelAttribute ParticipantForm participantForm, Model model) {
        MeetingPoint result = meetingPointService.findMeetingPoint(participantForm.getParticipants());
        model.addAttribute("meetingPoint", result); // 중간 지점 정보를 모델에 추가
        //model.addAttribute("participants", participantForm.getParticipants()); // 참가자 위치 정보를 모델에 추가
        //model.addAttribute("kakaoJsKey", kakaoJsKey); // Kakao JavaScript 키를 모델에 추가
        return "main";
    }

    @ModelAttribute 
    public void addAttributes(Model model) {
        model.addAttribute("kakaoJsKey", kakaoJsKey);
    }
}