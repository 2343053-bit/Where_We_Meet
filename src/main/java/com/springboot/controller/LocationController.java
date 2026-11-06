package com.springboot.controller;

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

    @GetMapping
    public String getLocations(Model model) {
    model.addAttribute("participantForm", new ParticipantForm());
    return "main";
}

    private final MeetingPointService meetingPointService;

    public LocationController(MeetingPointService meetingPointService) {
        this.meetingPointService = meetingPointService;
    }

    @PostMapping
    public String postLocations(@ModelAttribute ParticipantForm participantForm, Model model) {
        MeetingPoint result = meetingPointService.findMeetingPoint(participantForm.getParticipants());
        model.addAttribute("meetingPoint", result);
        model.addAttribute("participants", participantForm.getParticipants());
        return "main2";
    }
}