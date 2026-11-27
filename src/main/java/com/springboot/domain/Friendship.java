package com.springboot.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity 
public class Friendship {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; //id 숫자로 자동 생성

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private Member requester; // 요청을 보낸 회원

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private Member receiver; // 요청을 받을 회원

    @Column(nullable = false)
    private boolean accepted; // false: 요청 대기 중, true: 친구 요청 수락됨

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Member getRequester() {
        return requester;
    }

    public void setRequester(Member requester) {
        this.requester = requester;
    }

    public Member getReceiver() {
        return receiver;
    }

    public void setReceiver(Member receiver) {
        this.receiver = receiver;
    }

    public boolean isAccepted() {
        return accepted;
    }

    public void setAccepted(boolean accepted) {
        this.accepted = accepted;
    }
}
