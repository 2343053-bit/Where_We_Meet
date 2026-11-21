package com.springboot.service;

import com.springboot.domain.MeetingPoint;
import com.springboot.domain.ParticipantLocation;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MeetingPointService {

    // 최소 및 최대 참가자 수를 정의
    private static final int MIN_PARTICIPANTS = 2;
    private static final int MAX_PARTICIPANTS = 5;

    private final MeetingPointAdjuster meetingPointAdjuster;

    public MeetingPointService(MeetingPointAdjuster meetingPointAdjuster) {
        this.meetingPointAdjuster = meetingPointAdjuster;
    }

    // 참가자들의 위치를 기반으로 중간 지점을 계산하는 메서드
    public MeetingPoint findMeetingPoint(List<ParticipantLocation> participants) {

        // 참가자 수와 각 참가자의 위도 및 경도를 검증
        validateParticipants(participants);

        // 참가들 인원 수를 가져옴
        int participantCount = participants.size();

        // 참가자들의 위도와 경도를 합산하여 평균을 계산
        double latitudeSum = 0;
        double longitudeSum = 0;

        // 각 참가자의 위도와 경도를 합산
        for (ParticipantLocation participant : participants) {
            latitudeSum += participant.getLatitude();
            longitudeSum += participant.getLongitude();
        }

        // MeetingPoint 객체 생성
        MeetingPoint meetingPoint = new MeetingPoint();

        // 평균 위도와 경도를 계산
        double averageLatitude = latitudeSum / participantCount;
        double averageLongitude = longitudeSum / participantCount;

        // 최종 중간 지점은 일단 평균으로 두고, 원래 평균 좌표도 따로 보관한다. (조정되면 회색 마커로 표시)
        meetingPoint.setMeetingLatitude(averageLatitude);
        meetingPoint.setMeetingLongitude(averageLongitude);
        meetingPoint.setAverageLatitude(averageLatitude);
        meetingPoint.setAverageLongitude(averageLongitude);

        // 바다나 산이면 가까운 역으로 옮긴다. (MeetingPointAdjuster)
        return meetingPointAdjuster.adjust(meetingPoint);
    }

    // 참가자 수와 각 참가자의 위도 및 경도를 검증하는 메서드
    private void validateParticipants(List<ParticipantLocation> participants) {
        // 참가자 수가 최소 및 최대 범위 내에 있는지 확인
        if (participants == null
                || participants.size() < MIN_PARTICIPANTS
                || participants.size() > MAX_PARTICIPANTS) {
            throw new IllegalArgumentException("참가자는 2명 이상 5명 이하로 입력해야 합니다.");
        }
        // 각 참가자의 위도와 경도가 null이 아닌지 확인
        for (ParticipantLocation participant : participants) {
            if (participant == null
                    || participant.getLatitude() == null
                    || participant.getLongitude() == null) {
                throw new IllegalArgumentException("모든 참가자의 위도와 경도를 입력해야 합니다.");
            }
        }
    }
}
