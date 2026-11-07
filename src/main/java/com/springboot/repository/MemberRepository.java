package com.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.springboot.domain.Member;


public interface MemberRepository extends JpaRepository<Member, String>{ // Member: 관리할 엔티티, String: 엔티티의 기본 키(id) 타입
    boolean existsByNickname(String nickname);
}
