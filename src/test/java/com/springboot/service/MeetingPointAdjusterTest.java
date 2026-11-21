package com.springboot.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;

import com.springboot.client.KakaoLocalClient;
import com.springboot.client.KakaoLocalClient.KakaoPlace;
import com.springboot.domain.MeetingPoint;

// 가짜 KakaoLocalClient 로 MeetingPointAdjuster 의 판단만 검증한다. (실제 카카오 API 호출 없음)
@ExtendWith(MockitoExtension.class)   // 스프링 없이 Mockito 만 사용 → 빠르다.
class MeetingPointAdjusterTest {

    @Mock
    KakaoLocalClient client;          // 가짜 Client. 답을 우리가 정해 준다.

    @InjectMocks
    MeetingPointAdjuster adjuster;    // 가짜 Client 를 넣어서 만든 진짜 Adjuster.

    // 테스트용 장소들 (2단계 실제 결과에서 가져옴)
    KakaoPlace subway = new KakaoPlace("서면역 부산1호선", 35.1579, 129.0593, 65, "교통,수송 > 지하철,전철 > 부산1호선");
    KakaoPlace train  = new KakaoPlace("김천(구미)역", 36.1137, 128.1812, 403, "교통,수송 > 기차,철도 > 기차역 > KTX정차역");
    KakaoPlace closed = new KakaoPlace("대신역 (폐역)", 36.10, 128.20, 300, "교통,수송 > 기차,철도 > 기차역 > 폐역");
    KakaoPlace shop   = new KakaoPlace("던킨 김천구미역점", 36.11, 128.18, 100, "음식점 > 간식 > 도넛 > 던킨");

    // Service 가 만드는 것처럼 meeting* 과 average* 에 같은 평균을 넣은 MeetingPoint.
    MeetingPoint point(double lat, double lng) {
        MeetingPoint p = new MeetingPoint();
        p.setMeetingLatitude(lat);
        p.setMeetingLongitude(lng);
        p.setAverageLatitude(lat);
        p.setAverageLongitude(lng);
        return p;
    }

    @Test
    void 도심이면_조정하지_않는다() {
        when(client.hasAddress(anyDouble(), anyDouble())).thenReturn(true);
        when(client.countByCategory(anyString(), anyDouble(), anyDouble(), anyInt())).thenReturn(100);

        MeetingPoint result = adjuster.adjust(point(35.15, 129.06));

        assertThat(result.isAdjusted()).isFalse();
        assertThat(result.getMeetingLatitude()).isEqualTo(35.15);
    }

    @Test
    void 바다면_가까운_지하철역으로_옮긴다() {
        when(client.hasAddress(anyDouble(), anyDouble())).thenReturn(false);
        when(client.findNearestByCategory(anyString(), anyDouble(), anyDouble(), anyInt()))
                .thenReturn(Optional.of(subway));

        MeetingPoint result = adjuster.adjust(point(35.14, 129.20));

        assertThat(result.isAdjusted()).isTrue();
        assertThat(result.getAnchorName()).isEqualTo("서면역 부산1호선");
        assertThat(result.getMeetingLatitude()).isEqualTo(subway.latitude());
        assertThat(result.getAverageLatitude()).isEqualTo(35.14);   // 원래 평균은 그대로.
    }

    @Test
    void 지하철이_없으면_폐역과_가게를_건너뛰고_기차역으로_옮긴다() {
        when(client.hasAddress(anyDouble(), anyDouble())).thenReturn(true);
        when(client.countByCategory(anyString(), anyDouble(), anyDouble(), anyInt())).thenReturn(0);
        when(client.findNearestByCategory(anyString(), anyDouble(), anyDouble(), anyInt()))
                .thenReturn(Optional.empty());
        when(client.searchKeywordByDistance(anyString(), anyDouble(), anyDouble(), anyInt()))
                .thenReturn(List.of(shop, closed, train));   // 가까운 순서. 진짜 역은 세 번째.

        MeetingPoint result = adjuster.adjust(point(36.0, 128.0));

        assertThat(result.isAdjusted()).isTrue();
        assertThat(result.getAnchorName()).isEqualTo("김천(구미)역");
    }

    @Test
    void 거점이_없으면_조정하지_않는다() {
        when(client.hasAddress(anyDouble(), anyDouble())).thenReturn(false);
        when(client.findNearestByCategory(anyString(), anyDouble(), anyDouble(), anyInt()))
                .thenReturn(Optional.empty());
        when(client.searchKeywordByDistance(anyString(), anyDouble(), anyDouble(), anyInt()))
                .thenReturn(List.of());

        MeetingPoint result = adjuster.adjust(point(34.0, 128.0));   // 먼 바다

        assertThat(result.isAdjusted()).isFalse();
        assertThat(result.getMeetingLatitude()).isEqualTo(34.0);
    }

    @Test
    void 카카오_호출이_실패해도_예외없이_평균좌표를_유지한다() {
        when(client.hasAddress(anyDouble(), anyDouble())).thenThrow(new RestClientException("카카오 장애"));

        MeetingPoint result = adjuster.adjust(point(35.15, 129.06));

        assertThat(result.isAdjusted()).isFalse();
        assertThat(result.getMeetingLatitude()).isEqualTo(35.15);
    }
}
