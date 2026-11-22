package com.springboot.service;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import com.springboot.client.KakaoLocalClient;
import com.springboot.client.KakaoLocalClient.KakaoPlace;
import com.springboot.domain.MeetingPoint;

// 중간 지점이 바다나 산처럼 놀 곳이 없는 곳이면, 가까운 역(거점)으로 옮겨 주는 클래스.
// "언제 옮길지, 어디로 옮길지" 판단만 하고, 카카오에 묻는 일은 KakaoLocalClient 가 한다.
@Service
public class MeetingPointAdjuster {

    private static final Logger log = LoggerFactory.getLogger(MeetingPointAdjuster.class);

    // 카카오 카테고리 코드
    private static final String RESTAURANT = "FD6";
    private static final String CAFE = "CE7";
    private static final String SUBWAY_STATION = "SW8";

    // 빈 곳 판정 기준: 반경 1km 안에 음식점 + 카페가 10개 미만이면 빈 곳
    private static final int DENSITY_RADIUS = 1000;
    private static final int MIN_PLACE_COUNT = 10;

    // 거점 찾기 기준
    private static final int ANCHOR_RADIUS = 20000;                  // 카카오 최대 반경 20km
    private static final String TRAIN_KEYWORD = "기차역";
    private static final String TRAIN_CATEGORY = "기차,철도 > 기차역";
    private static final String CLOSED_STATION = "폐역";

    private final KakaoLocalClient kakaoLocalClient;

    public MeetingPointAdjuster(KakaoLocalClient kakaoLocalClient) {
        this.kakaoLocalClient = kakaoLocalClient;
    }

    // 중간 지점을 검사해서, 필요하면 거점으로 옮긴 뒤 돌려준다.
    // 옮기지 않으면 받은 그대로 돌려준다. (adjusted = false)
    public MeetingPoint adjust(MeetingPoint point) {
        double lat = point.getMeetingLatitude();
        double lng = point.getMeetingLongitude();

        try {
            if (!needsAdjust(lat, lng)) {                 // 놀 곳이 충분하면 그대로.
                return point;
            }
            findAnchor(lat, lng).ifPresentOrElse(
                    anchor -> moveTo(point, anchor),        // 거점이 있으면 옮긴다.
                    () -> point.setAnchorMissing(true));    // 없으면 못 찾았다고 표시한다.
        } catch (RestClientException e) {
            // 카카오 호출이 실패해도 제출은 되어야 하므로, 조정하지 않고 평균 좌표를 그대로 쓴다.
            log.warn("중간 지점 조정 실패, 평균 좌표를 그대로 사용합니다. ({}, {})", lat, lng, e);
        }
        return point;
    }

    // 옮겨야 하는 곳인지 판단한다. 바다이거나, 주변에 음식점·카페가 거의 없으면 true.
    private boolean needsAdjust(double lat, double lng) {
        if (!kakaoLocalClient.hasAddress(lat, lng)) {     // 주소가 없다 = 바다.
            return true;
        }
        int count = kakaoLocalClient.countByCategory(RESTAURANT, lat, lng, DENSITY_RADIUS)
                  + kakaoLocalClient.countByCategory(CAFE, lat, lng, DENSITY_RADIUS);
        return count < MIN_PLACE_COUNT;
    }

    // 옮겨 갈 거점을 찾는다. 지하철역 → 기차역 순서로 찾고, 둘 다 없으면 Optional.empty().
    private Optional<KakaoPlace> findAnchor(double lat, double lng) {
        Optional<KakaoPlace> subway =
                kakaoLocalClient.findNearestByCategory(SUBWAY_STATION, lat, lng, ANCHOR_RADIUS);
        if (subway.isPresent()) {
            return subway;
        }
        // 지하철이 없으면 기차역. 키워드 검색은 "○○역점" 가게도 섞여 나오므로 진짜 기차역만 고른다.
        // 결과가 이미 가까운 순서라서, 조건에 맞는 첫 번째가 가장 가까운 기차역이다.
        return kakaoLocalClient.searchKeywordByDistance(TRAIN_KEYWORD, lat, lng, ANCHOR_RADIUS)
                .stream()
                .filter(this::isTrainStation)
                .findFirst();
    }

    // 운영 중인 기차역인지 확인한다. (가게, 주차장, 폐역 제외)
    private boolean isTrainStation(KakaoPlace place) {
        String category = place.categoryName();
        return category.contains(TRAIN_CATEGORY) && !category.contains(CLOSED_STATION);
    }

    // 중간 지점을 거점으로 옮긴다. 원래 평균 좌표(average*)는 MeetingPointService 가 이미 넣어 두었으므로 건드리지 않는다.
    private void moveTo(MeetingPoint point, KakaoPlace anchor) {
        point.setMeetingLatitude(anchor.latitude());
        point.setMeetingLongitude(anchor.longitude());
        point.setAdjusted(true);
        point.setAnchorName(anchor.name());
    }
}
