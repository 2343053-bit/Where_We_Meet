package com.springboot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    // application-secret.properties 의 kakao.js-key (없으면 빈 문자열 → 화면에서 안내 문구 표시)
    @Value("${kakao.js-key:}")
    private String kakaoJsKey;

    @GetMapping("/")
    public String main(Model model) {
        model.addAttribute("kakaoJsKey", kakaoJsKey);
        return "main";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/signup")
    public String signup() {
        return "signup";
    }

    @GetMapping("/result")
    public String result() {
        return "result";
    }

    @GetMapping("/meetings")
    public String meetings() {
        return "meetings/list";
    }

    @GetMapping("/meetings/{id}")
    public String meetingDetail() {
        return "meetings/detail";
    }

    @GetMapping("/places/saved")
    public String savedPlaces() {
        return "places/saved";
    }

    @GetMapping("/mypage")
    public String mypage() {
        return "mypage";
    }
}