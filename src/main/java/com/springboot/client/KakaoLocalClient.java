package com.springboot.client;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;

@Component
public class KakaoLocalClient {

    private final RestClient kakaoLocalClient;

    public KakaoLocalClient(@Value("${kakao.rest-api-key}") String restApiKey) {
        this.kakaoLocalClient = RestClient.builder()
                .baseUrl("https://dapi.kakao.com")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + restApiKey)
                .build();
    }

    // 카카오 장소 검색 결과 하나를 담는 그릇.
    // name : 장소 이름, latitude/longitude : 위도/경도, distance : 기준점에서 거리(m),
    // categoryName : 분류 ("교통,수송 > 기차,철도 > 기차역")
    public record KakaoPlace(String name, double latitude, double longitude, int distance, String categoryName) {
    }


    // 좌표에 주소가 있는지 알려 준다. 바다 위 좌표는 주소가 없어서 false.
    public boolean hasAddress(double lat, double lng) {
        JsonNode json = kakaoLocalClient.get()
                .uri(uri -> uri.path("/v2/local/geo/coord2address.json")
                        .queryParam("x", lng) // 카카오는 x = 경도
                        .queryParam("y", lat) // y = 위도
                        .build())
                .retrieve()
                .body(JsonNode.class);

        // 응답 모양: { "meta": { "total_count": 1 }, "documents": [ { "address": {...} } ]
        // }
        // 바다면 documents 가 빈 배열 [] 로 온다.
        return json.path("documents").size() > 0;
    }


    // 기준 좌표 반경 radius(m) 안에 있는 카테고리(code) 장소의 개수를 돌려준다.
    // code 예: FD6 = 음식점, CE7 = 카페, SW8 = 지하철역
    public int countByCategory(String code, double lat, double lng, int radius) {
        JsonNode json = kakaoLocalClient.get()
                .uri(uri -> uri.path("/v2/local/search/category.json")
                        .queryParam("category_group_code", code)
                        .queryParam("x", lng)
                        .queryParam("y", lat)
                        .queryParam("radius", radius) // 0 ~ 20000
                        .queryParam("size", 1) // 개수만 필요하므로 장소는 1개만 받는다.
                        .build())
                .retrieve()
                .body(JsonNode.class);

        // 응답 모양: { "meta": { "total_count": 128, "pageable_count": 45, ... },
        // "documents": [ ... ] }
        // pageable_count 는 최대 45 까지만 세므로 total_count 를 쓴다.
        return json.path("meta").path("total_count").asInt();
    }


    // 기준 좌표에서 가장 가까운 카테고리(code) 장소 하나를 돌려준다. 없으면 Optional.empty().
    public Optional<KakaoPlace> findNearestByCategory(String code, double lat, double lng, int radius) {
        JsonNode json = kakaoLocalClient.get()
                .uri(uri -> uri.path("/v2/local/search/category.json")
                        .queryParam("category_group_code", code)
                        .queryParam("x", lng)
                        .queryParam("y", lat)
                        .queryParam("radius", radius)
                        .queryParam("sort", "distance") // 가까운 순서로 정렬
                        .queryParam("size", 1) // 제일 가까운 1개만
                        .build())
                .retrieve()
                .body(JsonNode.class);

        JsonNode documents = json.path("documents");
        if (documents.size() == 0) { // 반경 안에 하나도 없다.
            return Optional.empty();
        }
        return Optional.of(toPlace(documents.get(0))); // 첫 번째 = 가장 가까운 곳
    }


    // 키워드(query)로 반경 안의 장소를 가까운 순서로 최대 15개 돌려준다. 없으면 빈 목록.
    // "역" 처럼 검색하면 가게 이름도 섞여 나오므로, 거르는 일은 부르는 쪽(Adjuster)에서 한다.
    public List<KakaoPlace> searchKeywordByDistance(String query, double lat, double lng, int radius) {
        JsonNode json = kakaoLocalClient.get()
                .uri(uri -> uri.path("/v2/local/search/keyword.json")
                        .queryParam("query", query) // 한글도 알아서 인코딩된다.
                        .queryParam("x", lng)
                        .queryParam("y", lat)
                        .queryParam("radius", radius)
                        .queryParam("sort", "distance")
                        .queryParam("size", 15) // 최대 15
                        .build())
                .retrieve()
                .body(JsonNode.class);

        List<KakaoPlace> places = new ArrayList<>();
        JsonNode documents = json.path("documents");
        for (int i = 0; i < documents.size(); i++) {
            places.add(toPlace(documents.get(i)));
        }
        return places;
    }

    
    // 카카오 응답의 장소 하나(documents[i])를 KakaoPlace 로 바꾼다.
    // 카카오는 x, y, distance 를 숫자가 아니라 문자열("129.06")로 보내서 직접 숫자로 바꿔야 한다.
    private KakaoPlace toPlace(JsonNode doc) {
        String distance = doc.path("distance").asString(); // 요청에 x,y 가 없으면 "" 로 온다.
        return new KakaoPlace(
                doc.path("place_name").asString(),
                Double.parseDouble(doc.path("y").asString()), // y = 위도
                Double.parseDouble(doc.path("x").asString()), // x = 경도
                distance.isEmpty() ? 0 : Integer.parseInt(distance),
                doc.path("category_name").asString());
    }

}
