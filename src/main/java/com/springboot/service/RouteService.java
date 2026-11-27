package com.springboot.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;

// 출발지 → 도착지 이동시간을 알려 주는 서비스.
// 지금은 승용차(카카오모빌리티 자동차 길찾기)만 있고, 도보·대중교통(ODsay)은 나중에 메서드를 추가한다.
@Service
public class RouteService {

    private final RestClient kakaoMobilityClient;

    // 카카오모빌리티용 RestClient 는 config/KakaoClientConfig 가 만들어서 넣어 준다. (키·헤더·타임아웃 설정 포함)
    public RouteService(@Qualifier ("kakaoMobilityRestClient") RestClient kakaoMobilityClient) {
        this.kakaoMobilityClient = kakaoMobilityClient;
    }

    // 승용차 이동시간(초)을 돌려준다. 길찾기에 실패하면 -1.
    public int getCarDurationSeconds(double originLat, double originLng, double destLat, double destLng) {  //출발위도, 출발경도, 도착위도, 도착경도
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

    // 승용차 길찾기 결과를 담는 그릇.  
    // seconds : 이동시간(초), 실패하면 -1
    // path    : 경로를 따라가는 점들. 점 하나 = [위도, 경도]
    public record CarRoute(int seconds, List<double[]> path) {
    }

    // 승용차 이동시간과 경로 좌표를 함께 돌려준다. (지도에 경로 선을 그리기 위해)
    // getCarDurationSeconds 와 같은 API 를 부르지만, summary 를 빼서 도로별 좌표(vertexes)까지 받는다.
    public CarRoute getCarRoute(double originLat, double originLng, double destLat, double destLng) {
        JsonNode json = kakaoMobilityClient.get()
                .uri(uri -> uri.path("/v1/directions")
                        .queryParam("origin", originLng + "," + originLat)     // 카카오모빌리티는 "경도,위도" 순서.
                        .queryParam("destination", destLng + "," + destLat)
                        .build())                                                   // summary 를 안 붙이면 경로 좌표까지 전부 온다.
                .retrieve()
                .body(JsonNode.class);

        JsonNode route = json.path("routes").get(0);
        if (route.path("result_code").asInt() != 0) {                  // 길찾기 실패.
            return new CarRoute(-1, List.of());                                     // List.of() : 빈 목록.
        }

        // 응답 모양: routes[0].sections[ ].roads[ ].vertexes = [경도, 위도, 경도, 위도, ...]
        // 모든 구간(sections)의 모든 도로(roads)의 좌표를 순서대로 이어 붙이면 경로 전체가 된다.
        List<double[]> path = new ArrayList<>();                                    // 경로 점들을 담을 빈 목록.
        JsonNode sections = route.path("sections");
        for (int s = 0; s < sections.size(); s++) {                                 // 구간마다. (경유지가 없으면 1개)
            JsonNode roads = sections.get(s).path("roads");
            for (int r = 0; r < roads.size(); r++) {                                // 도로 조각마다.
                JsonNode vertexes = roads.get(r).path("vertexes");
                for (int i = 0; i + 1 < vertexes.size(); i += 2) {                  // 2칸씩 건너뛴다. (경도, 위도 한 쌍)
                    double lng = vertexes.get(i).asDouble();                        // 짝수 칸 = 경도
                    double lat = vertexes.get(i + 1).asDouble();                    // 홀수 칸 = 위도
                    path.add(new double[] { lat, lng });                            // [위도, 경도] 로 뒤집어 저장. (지도 LatLng 순서에 맞춤)
                }
            }
        }

        int seconds = route.path("summary").path("duration").asInt();   // 이동시간(초)은 summary 에 그대로 있다.
        return new CarRoute(seconds, path);
    }
}
