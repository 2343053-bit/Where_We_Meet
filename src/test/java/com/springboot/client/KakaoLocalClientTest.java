package com.springboot.client;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.springboot.client.KakaoLocalClient.KakaoPlace;

// 실제 카카오 API를 호출하는 임시 확인용 테스트. 확인이 끝나면 삭제하거나 @Disabled 를 붙인다.
@Disabled("실제 카카오 API 호출 - 수동 확인할 때만 이 줄을 지우고 실행")   // ← 추가
@SpringBootTest
class KakaoLocalClientTest {

    @Autowired
    KakaoLocalClient client;   // 스프링이 만들어 둔 Client 를 주입받는다. (키도 secret 파일에서 들어감)

    @Test
    void 서면_도심() {
        double lat = 35.1578, lng = 129.0600;
        System.out.println("[서면] 주소 있음? " + client.hasAddress(lat, lng));
        System.out.println("[서면] 음식점 수 " + client.countByCategory("FD6", lat, lng, 1000));
        System.out.println("[서면] 카페 수 " + client.countByCategory("CE7", lat, lng, 1000));
        System.out.println("[서면] 가까운 지하철역 " + client.findNearestByCategory("SW8", lat, lng, 20000));
    }

    @Test
    void 해운대_앞바다() {
        System.out.println("[바다] 주소 있음? " + client.hasAddress(35.1400, 129.2000));
    }

    @Test
    void 지리산() {
        double lat = 35.3370, lng = 127.7307;
        System.out.println("[지리산] 주소 있음? " + client.hasAddress(lat, lng));
        System.out.println("[지리산] 음식점 수 " + client.countByCategory("FD6", lat, lng, 1000));
        Optional<KakaoPlace> subway = client.findNearestByCategory("SW8", lat, lng, 20000);
        System.out.println("[지리산] 가까운 지하철역 " + subway);
    }

    @Test
    void 김천_키워드() {
        List<KakaoPlace> places = client.searchKeywordByDistance("역", 36.1100, 128.1800, 20000);
        for (KakaoPlace p : places) {
            System.out.println("[김천] " + p.name() + " / " + p.distance() + "m / " + p.categoryName());
        }
    }
}
