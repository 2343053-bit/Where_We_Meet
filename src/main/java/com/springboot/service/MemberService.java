package com.springboot.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.springboot.domain.Member;
import com.springboot.repository.MemberRepository;

@Service
public class MemberService {

    // 서버 로그를 남기는 도구. (System.out.println 대신 쓴다. 사진 삭제 실패처럼 "알아만 두면 되는" 일을 기록)
    private static final Logger log = LoggerFactory.getLogger(MemberService.class);

    // 프로필 사진을 저장하는 폴더. 저장(updateProfile)과 삭제(deleteAccount)가 같은 폴더를 써야 해서 한 곳에 모았다.
    // static final : 바뀌지 않는 값(상수). 클래스 전체에서 하나만 있다.
    private static final String UPLOAD_DIR = "C:\\Users\\user\\OneDrive\\Desktop\\project\\img";

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
            File saveFile = new File(UPLOAD_DIR + fileName);
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

    // 회원탈퇴 : 회원 정보를 지우고, 올린 프로필 사진 파일도 지운다.
    @Transactional
    public void deleteAccount(String id) {
        Member member = findById(id);
        String imagePath = member.getProfileImagePath(); // 예) "/images/abc_profile". 기본 사진이면 비어 있다.

        memberRepository.delete(member); // 1) DB 에서 회원 삭제 (Service → Repository)
        deleteProfileImage(imagePath, id); // 2) 사진 파일 삭제
    }

    // 업로드 폴더에서 그 회원의 사진 파일을 지운다. 사진이 없거나 지우지 못해도 탈퇴는 막지 않는다.
    private void deleteProfileImage(String imagePath, String id) {
        if (imagePath == null || !imagePath.startsWith("/images/")) {
            return; // 기본 사진을 쓰는 회원. 지울 파일이 없다.
        }
        String fileName = imagePath.substring("/images/".length()); // "/images/abc_profile" → "abc_profile"

        // 이 회원의 사진 이름(아이디_profile)일 때만 지운다. 다른 파일을 실수로 지우지 않게.
        if (!fileName.startsWith(id + "_profile")) {
            log.warn("프로필 사진 이름이 회원 아이디와 맞지 않아 삭제하지 않습니다. id={}, path={}", id, imagePath);
            return;
        }

        try {
            // Files.deleteIfExists : 파일이 있으면 지우고 true, 없으면 아무 일 없이 false.
            Files.deleteIfExists(Path.of(UPLOAD_DIR, fileName));
        } catch (IOException e) {
            // 사진을 못 지워도 탈퇴는 이미 끝났으니, 서버 로그에만 남긴다.
            log.warn("프로필 사진을 삭제하지 못했습니다. id={}, file={}", id, fileName, e);
        }
    }
}
