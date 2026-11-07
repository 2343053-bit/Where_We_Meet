package com.springboot.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.springboot.domain.Member;
import com.springboot.repository.MemberRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    public CustomUserDetailsService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    // UserDetailsService 인터페이스의 메서드를 구현하여 사용자 정보를 로드합니다.
    @Override
    public UserDetails loadUserByUsername(String username) // 사용자 이름을 기반으로 사용자 정보를 로드합니다.
            throws UsernameNotFoundException {
        Member member = memberRepository.findByUsername(username) // 사용자 이름으로 회원 정보를 조회합니다.
                .orElseThrow(() -> new UsernameNotFoundException( // 사용자 이름으로 회원 정보를 찾을 수 없는 경우 예외를 발생시킵니다.
                        "사용자를 찾을 수 없습니다: " + username));

        return User.builder() // User 객체를 생성하여 반환합니다. 이 객체는 Spring Security에서 인증 및 권한 부여에 사용됩니다.
                .username(member.getUsername())
                .password(member.getPassword())
                .roles("USER")
                .build();
    }
}
