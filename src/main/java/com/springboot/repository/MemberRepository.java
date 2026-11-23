package com.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springboot.domain.Member;

public interface MemberRepository extends JpaRepository<Member, String>{
    
    // 닉네임이 이미 사용 중인지 확인해 중복 가입을 막는다.
    boolean existsByNickname(String nickname);
    boolean existsByNicknameAndIdNot(String nickname, String id);
}
