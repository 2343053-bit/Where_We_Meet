package com.springboot.domain;

public class MeetingPoint {
    private Double meetingLatitude;
    private Double meetingLongitude;

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
}
