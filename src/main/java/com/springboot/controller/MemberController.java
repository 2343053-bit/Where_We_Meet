package com.springboot.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import com.springboot.domain.Member;
import com.springboot.service.MemberService;

@Controller
public class MemberController {
    private final MemberService memberService;
    
    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    // 회원 가입 폼을 보여주는 메서드입니다. GET 요청이 들어오면 회원 가입 폼을 반환합니다.
    @GetMapping("/signup")
    public String showSignupForm(Model model) {
        model.addAttribute("memberForm", new Member());
        return "signup";
    }

    // 회원 가입을 처리하는 메서드입니다. POST 요청이 들어오면 회원 정보를 저장합니다.
    @PostMapping("/signup")
    public String processSignup(@ModelAttribute("memberForm") Member memberForm) {
        memberService.signup(memberForm); // 회원 가입 로직을 호출하여 회원 정보를 저장합니다.
        
        return "redirect:/login"; // 회원 가입 후 로그인 페이지로 리다이렉트합니다.
    }


    @GetMapping("/login")
    public String showLoginForm() {
        return "login"; // 로그인 폼을 보여주는 뷰 이름을 반환합니다.
    }
}
