package com.springboot.service;

import java.util.List;

import com.springboot.domain.MeetingPoint;
import com.springboot.domain.ParticipantLocation;

// 중간 지점 계산 기능 목록 (인터페이스).
public interface MeetingPointService {

    // 참가자들의 위치로 중간 지점을 구한다.
    //   1) 참가자 좌표의 평균을 낸다.
    //   2) 평균 지점이 바다·산처럼 만나기 어려운 곳이면 가까운 역으로 옮긴다. (MeetingPointAdjuster)
    //      옮겼으면 adjusted = true, 원래 평균 좌표는 averageLatitude / averageLongitude 에 남는다.
    // 참가자가 2명 미만·5명 초과이거나, 좌표가 빈 참가자가 있으면 IllegalArgumentException.
    MeetingPoint findMeetingPoint(List<ParticipantLocation> participants);
}
