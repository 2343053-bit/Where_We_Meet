package com.springboot.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;

// 출발지 → 도착지 이동시간을 알려 주는 서비스.
// 지금은 승용차(카카오모빌리티 자동차 길찾기)만 있고, 도보·대중교통(ODsay)은 나중에 메서드를 추가한다.
@Service
public class RouteService {

    private final RestClient kakaoMobilityClient;

    // @Value 는 application-secret.properties 의 kakao.rest-api-key 값을 넣어 준다.
    public RouteService(@Value("${kakao.rest-api-key}") String restApiKey) {
        this.kakaoMobilityClient = RestClient.builder()
                .baseUrl("https://apis-navi.kakaomobility.com")             // 요청 보낼 기본 주소.
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + restApiKey)  // 인증 헤더. (curl 의 -H "Authorization: KakaoAK 키")
                .build();
    }

    // 승용차 이동시간(초)을 돌려준다. 길찾기에 실패하면 -1.
    public int getCarDurationSeconds(double originLat, double originLng, double destLat, double destLng) {
        JsonNode json = kakaoMobilityClient.get()                                   // GET 요청. (curl 의 -G)
                .uri(uri -> uri.path("/v1/directions")
                        .queryParam("origin", originLng + "," + originLat)
                        .queryParam("destination", destLng + "," + destLat)
                        .queryParam("summary", true)                // 요약만 받기. (세부 도로 목록 생략)
                        .build())
                .retrieve()                                                         // 요청을 보내고 응답을 받는다.
                .body(JsonNode.class);                                              // 응답 JSON 을 JSON 나무로 받는다.

        // 응답 모양: { "routes": [ { "result_code": 0, "summary": { "duration": 1984, ... } } ] }
        // path("이름") 은 { } 안의 이름으로, get(0) 은 [ ] 배열의 첫 번째로 들어간다.
        JsonNode route = json.path("routes").get(0);                               // routes 배열의 첫 번째 경로.
        if (route.path("result_code").asInt() != 0) {                               // 0 이 아니면 길찾기 실패. (이유는 result_msg 에 있음)
            return -1;
        }
        return route.path("summary").path("duration").asInt();                      // 소요 시간(초).
    }
}
