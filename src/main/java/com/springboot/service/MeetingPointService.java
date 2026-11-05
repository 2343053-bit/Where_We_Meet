package com.springboot.service;

import com.springboot.domain.ParticipantLocation;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MeetingPointService {

    private static final int MIN_PARTICIPANTS = 2;
    private static final int MAX_PARTICIPANTS = 5;

    public ParticipantLocation findMeetingPoint(List<ParticipantLocation> participants) {
        validateParticipants(participants);

        double latitudeSum = 0;
        double longitudeSum = 0;

        for (ParticipantLocation participant : participants) {
            latitudeSum += participant.getLatitude();
            longitudeSum += participant.getLongitude();
        }

        return new ParticipantLocation(
                "중간지점",
                latitudeSum / participants.size(),
                longitudeSum / participants.size()
        );
    }

    private void validateParticipants(List<ParticipantLocation> participants) {
        if (participants == null
                || participants.size() < MIN_PARTICIPANTS
                || participants.size() > MAX_PARTICIPANTS) {
            throw new IllegalArgumentException("참가자는 2명 이상 5명 이하로 입력해야 합니다.");
        }

        for (ParticipantLocation participant : participants) {
            if (participant == null
                    || participant.getLatitude() == null
                    || participant.getLongitude() == null) {
                throw new IllegalArgumentException("모든 참가자의 위도와 경도를 입력해야 합니다.");
            }
        }
    }
}
