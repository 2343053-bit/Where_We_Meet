package com.springboot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.service.KakaoLocalService;

import tools.jackson.databind.JsonNode;

// 브라우저(main.html 의 JS)가 장소 검색, 주소 ↔ 좌표 변환을 물어보는 주소를 담당하는 컨트롤러.
// @RestController : 화면(HTML) 이름 대신 "데이터(JSON)"를 돌려주는 컨트롤러라는 표시. (RouteController 와 같음)
// @RequestMapping("/api/geo") : 이 클래스의 주소는 모두 /api/geo 로 시작한다.
@RestController
@RequestMapping("/api/geo")
public class GeoController {

    private final KakaoLocalService kakaoLocalService; // 실제로 카카오 로컬 API 에 물어보는 서비스.

    // Spring 이 서버를 켤 때 만들어 둔 KakaoLocalService 를 자동으로 넣어 준다.
    public GeoController(KakaoLocalService kakaoLocalService) {
        this.kakaoLocalService = kakaoLocalService;
    }

    // 중간 지점 주변 장소 검색.
    // 요청 예) GET /api/geo/places?keyword=카페&lat=35.117&lng=128.968
    // 응답 예) [ { "id": "123", "place_name": "OO카페", "x": "128.96", "y": "35.11", ... }, ... ]  (없으면 [ ])
    @GetMapping("/places")
    public JsonNode searchPlaces(@RequestParam String keyword,
                                 @RequestParam double lat,
                                 @RequestParam double lng) {
        return kakaoLocalService.searchKeyword(keyword, lat, lng);
    }

    // 주소 → 좌표.
    // 요청 예) GET /api/geo/coords?address=부산 사하구 낙동대로 550
    // 응답 예) { "lat": 35.11, "lng": 128.96 }   (못 찾으면 404)
    // ResponseEntity : 응답 내용과 함께 상태 코드(200 성공, 404 없음 등)도 정할 수 있는 그릇.
    @GetMapping("/coords")
    public ResponseEntity<KakaoLocalService.Coords> getCoords(@RequestParam String address) {
        KakaoLocalService.Coords coords = kakaoLocalService.addressToCoords(address);
        if (coords == null) {
            return ResponseEntity.notFound().build();   // 404. JS 쪽에서 "주소를 찾을 수 없음"으로 처리한다.
        }
        return ResponseEntity.ok(coords);               // 200 + { "lat": ..., "lng": ... }
    }

    // 좌표 → 주소.
    // 요청 예) GET /api/geo/address?lat=35.117&lng=128.968
    // 응답 예) { "roadAddress": "부산 사하구 낙동대로 550", "jibunAddress": "부산 사하구 하단동 840" }
    //          (도로명 주소가 없으면 roadAddress 는 null, 결과가 아예 없으면 404)
    @GetMapping("/address")
    public ResponseEntity<KakaoLocalService.Address> getAddress(@RequestParam double lat,
                                                                @RequestParam double lng) {
        KakaoLocalService.Address address = kakaoLocalService.coordsToAddress(lat, lng);
        if (address == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(address);
    }
}
