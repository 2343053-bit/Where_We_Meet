package com.springboot.domain;


public class ParticipantLocation {

    private String participantName;
    private Double latitude;
    private Double longitude;
    private String address;

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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
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
