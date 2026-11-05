package com.springboot.domain;


public class ParticipantLocation {

    private String participantName;
    private Double latitude;
    private Double longitude;

    protected ParticipantLocation() {
    }

    public ParticipantLocation(String participantName, Double latitude, Double longitude) {
        this.participantName = participantName;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getParticipantName() {
        return participantName;
    }

    public void setParticipantName(String participantName) {
        this.participantName = participantName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}
