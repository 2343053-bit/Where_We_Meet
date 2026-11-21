package com.springboot.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;

// 카카오 로컬 API(장소 검색, 주소 ↔ 좌표 변환)를 서버에서 대신 불러 주는 서비스.
// 예전에는 브라우저 JS 가 kakao.maps.services(Places, Geocoder)로 직접 불렀는데, 이제는 서버(자바)가 REST API 로 부른다.
// (RouteService 와 같은 방식. 키는 브라우저에 보이지 않는 REST 키를 쓴다.)
@Service
public class KakaoLocalService {

    private final RestClient kakaoLocalClient;

    // @Value 는 application-secret.properties 의 kakao.rest-api-key 값.
    public KakaoLocalService(@Value("${kakao.rest-api-key}") String restApiKey) {
        this.kakaoLocalClient = RestClient.builder()
                .baseUrl("https://dapi.kakao.com")                                  // 요청 보낼 기본 주소. (카카오 로컬 API)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + restApiKey)  // 인증 헤더. (curl 의 -H "Authorization: KakaoAK 키")
                .build();
    }

    // 좌표 하나를 담는 그릇. JSON 으로 바뀌면 { "lat": 위도, "lng": 경도 } 모양. (예전 JS 의 { lat, lng } 와 같은 모양)
    public record Coords(double lat, double lng) {
    }

    // 주소 두 종류를 담는 그릇. 없는 주소는 null.
    // roadAddress  : 도로명 주소
    // jibunAddress : 지번 주소
    public record Address(String roadAddress, String jibunAddress) {
    }

    // 검색어 주변 장소를 찾는다. (예전 places.js 의 ps.keywordSearch)
    // 돌려주는 값은 카카오가 준 장소 목록(documents) 그대로. 장소 하나 = { id, place_name, x, y, ... }
    // JS SDK 결과와 필드 이름이 같아서 places.js, carRoutes.js 는 place.id, place.place_name, place.x, place.y 를 그대로 쓸 수 있다.
    public JsonNode searchKeyword(String keyword, double latitude, double longitude) {
        JsonNode json = kakaoLocalClient.get()                                      // GET 요청. (curl 의 -G)
                .uri(uri -> uri.path("/v2/local/search/keyword.json")
                        .queryParam("query", keyword)                               // 검색어.
                        .queryParam("x", longitude)                                 // 검색 기준 위치. (중간 지점) x 가 경도,
                        .queryParam("y", latitude)                                  //                              y 가 위도.
                        .queryParam("radius", 1000)                                 // 기준 위치에서 1000m 안에서만 찾는다.
                        .queryParam("sort", "distance")                             // 가까운 순서로 정렬한다.
                        .build())
                .retrieve()                                                         // 요청을 보내고 응답을 받는다.
                .body(JsonNode.class);                                              // 응답 JSON 을 JSON 나무로 받는다.

        // 응답 모양: { "documents": [ { "id": "...", "place_name": "...", "x": "경도", "y": "위도" }, ... ], "meta": { ... } }
        // 검색 결과가 없으면 documents 는 빈 배열 [ ].
        return json.path("documents");
    }

    // 주소 하나를 좌표로 바꾼다. (예전 geocoder.js 의 geocoder.addressSearch)
    // 성공하면 Coords, 찾지 못하면 null.
    public Coords addressToCoords(String address) {
        JsonNode json = kakaoLocalClient.get()
                .uri(uri -> uri.path("/v2/local/search/address.json")
                        .queryParam("query", address)                               // 찾을 주소.
                        .build())
                .retrieve()
                .body(JsonNode.class);

        // 응답 모양: { "documents": [ { "x": "경도", "y": "위도", ... } ] }  (못 찾으면 documents 가 빈 배열)
        JsonNode documents = json.path("documents");
        if (documents.isEmpty()) {
            return null;
        }
        JsonNode first = documents.get(0);                                          // 가장 잘 맞는 첫 번째 결과.
        return new Coords(first.path("y").asDouble(), first.path("x").asDouble());  // y = 위도, x = 경도
    }

    // 위도와 경도를 주소로 바꾼다. (예전 geocoder.js, CoorsdtoAddr.js 의 geocoder.coord2Address)
    // 결과가 없으면 null.
    public Address coordsToAddress(double latitude, double longitude) {
        JsonNode json = kakaoLocalClient.get()
                .uri(uri -> uri.path("/v2/local/geo/coord2address.json")
                        .queryParam("x", longitude)                                 // 카카오에는 경도(x), 위도(y) 순으로 전달한다.
                        .queryParam("y", latitude)
                        .build())
                .retrieve()
                .body(JsonNode.class);

        // 응답 모양: { "documents": [ { "road_address": { "address_name": "..." }, "address": { "address_name": "..." } } ] }
        // 도로명 주소가 없는 곳은 road_address 가 null 로 온다.
        JsonNode documents = json.path("documents");
        if (documents.isEmpty()) {
            return null;
        }
        JsonNode first = documents.get(0);
        return new Address(
                textOrNull(first.path("road_address").path("address_name")),
                textOrNull(first.path("address").path("address_name")));
    }

    // JSON 값이 없거나(null, 빈 글자) 하면 null, 있으면 글자를 돌려준다.
    private String textOrNull(JsonNode node) {
        if (node.isMissingNode() || node.isNull() || node.asString().isEmpty()) {
            return null;
        }
        return node.asString();
    }
}
