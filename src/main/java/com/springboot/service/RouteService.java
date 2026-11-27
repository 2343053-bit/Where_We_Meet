package com.springboot.service;

import java.util.List;

// 길찾기 기능 목록 (인터페이스).
//   실제 코드는 service/impl/RouteServiceImpl.java 에 있다. (카카오모빌리티 자동차 길찾기)
//   지금은 승용차만 있다. 다른 이동 수단이 생기면 여기에 메서드를 추가하고 구현체에서 만든다.
public interface RouteService {

    // 승용차 길찾기 결과를 담는 그릇.
    // seconds : 이동시간(초), 실패하면 -1
    // path    : 경로를 따라가는 점들. 점 하나 = [위도, 경도]
    // (인터페이스 안에 두면 컨트롤러가 RouteService.CarRoute 라는 이름으로 그대로 쓸 수 있다)
    record CarRoute(int seconds, List<double[]> path) {
    }

    // 출발지 → 도착지 승용차 이동시간(초)만 돌려준다. 길찾기에 실패하면 -1.
    int getCarDurationSeconds(double originLat, double originLng, double destLat, double destLng);

    // 출발지 → 도착지 승용차 이동시간과 경로 좌표를 함께 돌려준다. (지도에 경로 선을 그리기 위해)
    // 길찾기에 실패하면 seconds = -1, path = 빈 목록.
    CarRoute getCarRoute(double originLat, double originLng, double destLat, double destLng);
}
