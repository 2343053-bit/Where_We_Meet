package com.springboot.service;

import org.springframework.web.multipart.MultipartFile;

import com.springboot.domain.Member;

// 회원 기능 목록 (인터페이스).
//   - 컨트롤러는 이 인터페이스(MemberService)만 알고 쓰고, Spring 이 구현체(MemberServiceImpl)를 알아서 넣어 준다.
//   - 오류 문구는 문장 대신 사전 키(member.*)로 던진다. 화면이 #{${errorMessage}} 로 번역한다. (docs/다국어_가이드.md)
public interface MemberService {

    // 회원가입. 비밀번호를 암호화해서 저장한다.
    // 아이디가 이미 있으면 "member.idTaken", 닉네임이 이미 있으면 "member.nicknameTaken" 키로 IllegalArgumentException.
    void signup(Member member);

    // 아이디로 회원 한 명 조회. 없으면 UsernameNotFoundException.
    Member findById(String id);

    // 회원정보 수정 (이름, 닉네임, 휴대전화, 이메일, 주소).
    // profileImage 가 있으면 업로드 폴더(resource_path)에 "아이디_profile" 로 저장하고 사진 경로도 바꾼다.
    // 다른 회원이 쓰는 닉네임이면 "member.nicknameTaken" 키로 IllegalArgumentException.
    void updateProfile(String id, Member changes, MultipartFile profileImage);

    // 회원탈퇴. 회원 정보를 지우고, 올린 프로필 사진 파일도 지운다. (사진을 못 지워도 탈퇴는 진행)
    void deleteAccount(String id);
}
