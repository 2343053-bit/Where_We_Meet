package com.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springboot.domain.Member;

// Member 엔티티를 데이터베이스에서 조회·저장·수정·삭제하는 Repository.
// JpaRepository가 기본 CRUD 메서드를 제공하므로 SQL을 직접 작성하지 않아도 된다.
// <Member, String>은 관리할 엔티티와 그 엔티티의 기본 키 타입을 의미한다.
public interface MemberRepository extends JpaRepository<Member, String>{
    // 닉네임이 이미 사용 중인지 확인해 중복 가입을 막는다.
    boolean existsByNickname(String nickname);
    boolean existsByNicknameAndIdNot(String nickname, String id);
}
