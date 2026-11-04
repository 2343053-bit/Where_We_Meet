package com.springboot.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

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