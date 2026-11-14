package com.springboot.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.service.RouteService;

// 브라우저(main.html 의 JS)가 이동시간을 물어보는 주소를 담당하는 컨트롤러.
// @RestController : 화면(HTML) 이름 대신 "데이터(JSON)"를 돌려주는 컨트롤러라는 표시.
//                   (LocationController 처럼 @Controller 를 쓰면 return 값을 HTML 파일 이름으로 해석한다.)
// @RequestMapping("/api/route") : 이 클래스의 주소는 모두 /api/route 로 시작한다.
@RestController
@RequestMapping("/api/route")
public class RouteController {

    private final RouteService routeService; // 실제로 카카오모빌리티에 물어보는 서비스.

    // Spring 이 서버를 켤 때 만들어 둔 RouteService 를 자동으로 넣어 준다.
    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    // 승용차 이동시간 조회.
    // 요청 예) GET /api/route/car?originLat=37.4979&originLng=127.0276&destLat=37.5572&destLng=126.9245
    // 응답 예) { "seconds": 2346 }   (실패하면 { "seconds": -1 })
    // @RequestParam : 주소 뒤 ?이름=값 부분을 같은 이름의 매개변수로 받는다. (문자 "37.4979" 를 double 로 자동 변환)
    @GetMapping("/car")
    public Map<String, Integer> getCarDuration(@RequestParam double originLat,
                                               @RequestParam double originLng,
                                               @RequestParam double destLat,
                                               @RequestParam double destLng) {
        int seconds = routeService.getCarDurationSeconds(originLat, originLng, destLat, destLng);

        // Map.of("seconds", 값) 을 돌려주면 Spring 이 자동으로 JSON { "seconds": 값 } 으로 바꿔서 보낸다.
        return Map.of("seconds", seconds);
    }
}
