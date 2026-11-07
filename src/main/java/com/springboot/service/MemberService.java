package com.springboot.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (memberRepository.existsByUsername(member.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (memberRepository.existsByNickname(member.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // 비밀번호를 암호화하여 저장합니다.
        member.setPassword(passwordEncoder.encode(member.getPassword()));
        memberRepository.save(member); // 회원 정보를 데이터베이스에 저장.
    }
}
