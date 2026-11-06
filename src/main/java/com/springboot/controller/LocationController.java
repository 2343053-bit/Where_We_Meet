package com.springboot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import com.springboot.domain.MeetingPoint;
import com.springboot.service.MeetingPointService;


@Controller 
@RequestMapping("/main")
public class LocationController {
    
    @Value("${kakao.js-key}")
    private String kakaoJsKey;

    @GetMapping
    public String getLocations(Model model) {
        model.addAttribute("participantForm", new ParticipantForm());
        model.addAttribute("kakaoJsKey", kakaoJsKey);
        return "main";
    }

    private final MeetingPointService meetingPointService;

    public LocationController(MeetingPointService meetingPointService) {
        this.meetingPointService = meetingPointService;
    }

    @PostMapping
    public String postLocations(@ModelAttribute ParticipantForm participantForm, Model model) {
        MeetingPoint result = meetingPointService.findMeetingPoint(participantForm.getParticipants());
        model.addAttribute("meetingPoint", result); // 중간 지점 정보를 모델에 추가
        //model.addAttribute("participants", participantForm.getParticipants()); // 참가자 위치 정보를 모델에 추가
        model.addAttribute("kakaoJsKey", kakaoJsKey); // Kakao JavaScript 키를 모델에 추가
        return "main";
    }
}