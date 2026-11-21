package com.springboot.domain;

public class MeetingPoint {
    private Double meetingLatitude; // 기존: 최종 중간지점 (조정됐으면 거점 좌표)
    private Double meetingLongitude; // 기존
    private boolean adjusted; // 추가: 조정 여부
    private Double averageLatitude; // 추가: 원래 평균 좌표
    private Double averageLongitude; // 추가
    private String anchorName; // 추가: 옮겨간 거점 이름
    
    public Double getMeetingLatitude() {
        return meetingLatitude;
    }
    public void setMeetingLatitude(Double meetingLatitude) {
        this.meetingLatitude = meetingLatitude;
    }
    public Double getMeetingLongitude() {
        return meetingLongitude;
    }
    public void setMeetingLongitude(Double meetingLongitude) {
        this.meetingLongitude = meetingLongitude;
    }
    public boolean isAdjusted() {
        return adjusted;
    }
    public void setAdjusted(boolean adjusted) {
        this.adjusted = adjusted;
    }
    public Double getAverageLatitude() {
        return averageLatitude;
    }
    public void setAverageLatitude(Double averageLatitude) {
        this.averageLatitude = averageLatitude;
    }
    public Double getAverageLongitude() {
        return averageLongitude;
    }
    public void setAverageLongitude(Double averageLongitude) {
        this.averageLongitude = averageLongitude;
    }
    public String getAnchorName() {
        return anchorName;
    }
    public void setAnchorName(String anchorName) {
        this.anchorName = anchorName;
    }

    
}
