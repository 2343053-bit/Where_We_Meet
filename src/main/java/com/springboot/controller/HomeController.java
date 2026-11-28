package com.springboot.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// 첫 주소(/where-we-meet/)로 들어오면 메인 화면으로 보낸다.
// 공통 경로(/where-we-meet)는 application.properties 의 server.servlet.context-path 가 붙여 준다.
@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "redirect:/main";
    }
}