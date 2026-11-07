package com.springboot.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

// 해당 도메인은 회원 정보를 나타내는 클래스입니다. 회원의 ID, 닉네임, 비밀번호를 속성으로 합니다.
@Entity // 데이터베이스 엔티티 설정
public class Member {
    
    @Id // 기본 키 설정
    private String id;
    
    private String nickname;
    private String password;


    // getter와 setter 메서드입니다.
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getNickname() {
        return nickname;
    }
    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    
}
