package com.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.springboot.domain.Member;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, String>{ // Member: 관리할 엔티티, String: 엔티티의 기본 키(username) 타입
    Optional<Member> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByNickname(String nickname);
}
