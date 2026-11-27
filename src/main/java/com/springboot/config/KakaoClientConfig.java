package com.springboot.config;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class KakaoClientConfig {
    // 연결 3초, 응답 5초를 넘기면 포기한다. (없으면 카카오가 응답하지 않을 때 화면이 무한정 멈춘다)
    // 시간이 초과되면 RestClientException 이 나서, 중간 지점은 평균 좌표로, 경로는 "불러오지 못함" 으로 처리된다.
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(5);

    private final String restApiKey;

    public KakaoClientConfig(@Value("${kakao.rest-api-key}") String restApiKey) {
        this.restApiKey = restApiKey;
    }

    // 장소 검색·주소 확인용. (client/KakaoLocalClient 가 사용)
    // @Bean 의 이름은 메서드 이름(kakaoLocalRestClient)이 된다. 주입받는 쪽은 @Qualifier 로 이 이름을 지정한다.
    @Bean
    RestClient kakaoLocalRestClient() {
        return createKakaoClient("https://dapi.kakao.com");
    }

    // 자동차 길찾기용. (service/RouteService 가 사용)
    @Bean
    RestClient kakaoMobilityRestClient() {
        return createKakaoClient("https://apis-navi.kakaomobility.com");
    }

    // 주소만 다르고 나머지(인증 헤더, 타임아웃)는 같아서 하나의 메서드로 만든다.
    private RestClient createKakaoClient(String baseUrl) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(CONNECT_TIMEOUT)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(READ_TIMEOUT);

        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + restApiKey) // curl 의 -H "Authorization: KakaoAK 키"
                .requestFactory(requestFactory)
                .build();
    }
}
