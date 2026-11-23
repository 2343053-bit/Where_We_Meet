package com.springboot.controller;

import com.springboot.repository.MemberRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.springboot.domain.Member;
import com.springboot.service.MemberService;


@Controller
public class MemberController {
    private final MemberRepository memberRepository;
    private final MemberService memberService;
    
    public MemberController(MemberService memberService, MemberRepository memberRepository) {
        this.memberService = memberService;
        this.memberRepository = memberRepository;
    }

    // 회원가입 폼
    @GetMapping("/signup")
    public String showSignupForm(Model model) {
        model.addAttribute("memberForm", new Member());
        return "signup";
    }

    // 회원가입 처리
    @PostMapping("/signup")
    public String processSignup(@ModelAttribute("memberForm") Member memberForm, Model model) {
        try {
            memberService.signup(memberForm);
            return "redirect:/login";
        } catch (IllegalArgumentException exception) {
            //회원가입에 실패했을 때 처리하는 코드
            memberForm.setPassword(null);
            model.addAttribute("errorMessage", exception.getMessage());
            return "signup";
        }
    }

    //로그인 폼
    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }

    //로그인 실패 처리
    @GetMapping("/fail")
    public String showFailPage() {
        return "fail";
    }

    //Q. 왜 회원가입 기능은 성공했을 때, 실패했을 때 코드가 나뉘어져 있고 로그인은 실패처리만 하나요?
    //A. SecurityConfig(SecurityFilterChain)에서 로그인 성공처리는 설정할 수 있으나, 회원가입 성공 처리는 할 수 없어서.

    //마이페이지 폼
    @GetMapping("/mypage")
    public String showMypage(Authentication authentication, Model model) {
        Member member = memberService.findById(authentication.getName());
        model.addAttribute("member", member);
        return "mypage";
    }

    //회원정보 수정 폼
    @GetMapping("/mypage/edit")
    public String showEditMypage(Authentication authentication, Model model) {
        model.addAttribute("memberForm", memberService.findById(authentication.getName()));
        return "edit_mypage";
    }

    //회원정보 수정 처리
    @PostMapping("/mypage/edit")
    public String updateMypage(
            @ModelAttribute("memberForm") Member memberForm,
            @RequestParam(name = "profileImage", required = false) MultipartFile profileImage,
            Authentication authentication,
            Model model) {
        try {
            memberService.updateProfile(authentication.getName(), memberForm, profileImage);
            return "redirect:/mypage";
        } catch (IllegalArgumentException exception) {
            model.addAttribute("errorMessage", exception.getMessage());
            return "edit_mypage";
        }
    }

    //회원탈퇴 처리
    @PostMapping("/mypage/delete")
    public String DeleteAccount(Authentication authentication, HttpServletRequest request,
        HttpServletResponse response) {
        memberRepository.deleteById(authentication.getName());
        new SecurityContextLogoutHandler()
        .logout(request, response, authentication);
        return "account_deleted";
    }
    
}
