package com.springboot.controller;

import com.springboot.domain.ParticipantLocation;
import java.util.ArrayList;
import java.util.List;

// 이 클래스는 ParticipantLocation 객체 목록을 담는 데 사용됩니다.
public class ParticipantForm {
    private List<ParticipantLocation> participantList = new ArrayList<>(); // 참가자 위치 목록을 저장하는 리스트

    public ParticipantForm() {
        participantList.add(new ParticipantLocation("", null, null));
        participantList.add(new ParticipantLocation("", null, null));
    }

    // 이 이하는 getter와 setter 메서드입니다.
    public List<ParticipantLocation> getParticipants() {
        return participantList;
    }

    public void setParticipants(List<ParticipantLocation> participants) {
        this.participantList = participants;
    }
}