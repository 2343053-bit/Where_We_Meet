package com.springboot.service;

import java.io.File;
import java.io.IOException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.domain.Member;
import com.springboot.repository.MemberRepository;

@Service
public class MemberService {
    
    private final MemberRepository memberRepository; // 회원 정보를 관리하는 Repository
    private final PasswordEncoder passwordEncoder; // 비밀번호 암호화를 위한 PasswordEncoder
    
    public MemberService(MemberRepository memberRepository,
            PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 회원 가입을 처리하는 메서드입니다. 회원 정보를 저장합니다.
    @Transactional
    public void signup(Member member) {
        if (memberRepository.existsById(member.getId())) {
            throw new IllegalArgumentException("member.idTaken");
        }

        if (memberRepository.existsByNickname(member.getNickname())) {
            throw new IllegalArgumentException("member.nicknameTaken"); // 사전 키. (이미 사용 중인 닉네임)
        }

        // 비밀번호를 암호화하여 저장합니다.
        member.setPassword(passwordEncoder.encode(member.getPassword()));
        memberRepository.save(member); // 회원 정보를 데이터베이스에 저장.
    }

    @Transactional(readOnly = true)
    public Member findById(String id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "회원 정보를 찾을 수 없습니다: " + id));
    }

    //회원정보 수정
    @Transactional
    public void updateProfile(String id, Member changes, MultipartFile profileImage) {
        Member member = findById(id);// 현재 로그인한 사용자의 정보를 조회합니다.

        if (memberRepository.existsByNicknameAndIdNot(changes.getNickname(), id)) {
            throw new IllegalArgumentException("member.nicknameTaken"); // 사전 키. (이미 사용 중인 닉네임)
        }

        member.setUsername(changes.getUsername()); // 변경된 사용자 이름을 설정합니다.
        member.setNickname(changes.getNickname());// 변경된 닉네임을 설정합니다.
        member.setPhoneNumber(changes.getPhoneNumber()); // 변경된 전화번호를 설정합니다.
        member.setEmail(changes.getEmail()); // 변경된 이메일을 설정합니다.
        member.setAddress(changes.getAddress()); // 변경된 주소를 설정합니다.

        if (profileImage != null && !profileImage.isEmpty()) {
            String fileName = member.getId() + "_profile"; // 업로드할 파일 이름을 회원 ID 기반으로 설정합니다.
            File saveFile = new File("C:\\Users\\user\\OneDrive\\Desktop\\project\\img\\" + fileName); 
            // 업로드된 파일을 저장할 경로를 지정합니다.

            // 파일 업로드 처리
            try {
                profileImage.transferTo(saveFile); // 업로드된 파일을 지정된 경로에 저장합니다.
                member.setProfileImagePath("/images/" + fileName); // 프로필 이미지 경로를 설정합니다.
            } catch (IOException e) {
                throw new RuntimeException("프로필 이미지 업로드에 실패했습니다.", e);
            }
        }
        memberRepository.save(member);
    }
}
