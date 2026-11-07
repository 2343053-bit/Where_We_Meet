package com.springboot.controller;
    
@Controller
public class MemberController {
    
    // 회원 가입 폼을 보여주는 메서드입니다. GET 요청이 들어오면 회원 가입 폼을 반환합니다.
    @GetMapping("/signup")
    public String showSignupForm(Model model) {
        model.addAttribute("memberForm", new Member());
        return "signup";
    }
}
