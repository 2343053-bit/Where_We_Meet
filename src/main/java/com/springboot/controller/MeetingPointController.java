package com.springboot.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.domain.MeetingPoint;
import com.springboot.domain.ParticipantLocation;
import com.springboot.service.MeetingPointService;

@RestController 
@RequestMapping("/api/meeting-points")
public class MeetingPointController {

    private final MeetingPointService meetingPointService;

    public MeetingPointController(MeetingPointService meetingPointService) {
        this.meetingPointService = meetingPointService;
    }

    // @RequestBody : 요청 본문의 JSON 을 자바 객체 목록으로 바꿔 받는다.
    @PostMapping
    public MeetingPoint create(@RequestBody List<ParticipantLocation> participants) {
        return meetingPointService.findMeetingPoint(participants);
    }
    
    // 참가자 수(2~5명)가 맞지 않거나 좌표가 비었을 때 서비스가 던지는 예외 → 500 대신 400 + 메시지
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleBadRequest(IllegalArgumentException e) {
        return Map.of("message", e.getMessage());
    }
    
}
