import { showCarRoutes } from './carRoutes.js';
import { renderPlaceList, showPlaceStatus } from './placePanel.js';

export function searchNearbyPlaces(map, meetingLat, meetingLng, participantList, keyword) {
    var placeInfowindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 장소 마커를 클릭하면 장소 이름을 보여 줄 말풍선. (하나를 돌려 씀) zIndex 는 다른 말풍선보다 위에 보이게.
    var ps = new kakao.maps.services.Places();                       // 장소 검색 객체 생성.

    // 검색어 주변 장소를 찾고, 검색이 끝나면 placesSearchCB 함수가 실행된다.
    ps.keywordSearch(keyword, placesSearchCB, {
        location: new kakao.maps.LatLng(meetingLat, meetingLng),     // 검색 기준 위치. (중간 지점)
        radius: 1000,                                                // 기준 위치에서 1000m 안에서만 찾는다.
        sort: kakao.maps.services.SortBy.DISTANCE                    // 가까운 순서로 정렬한다.
    });

    // 검색이 끝나면 카카오가 호출해 주는 함수. data = 검색된 장소 목록, status = 검색 결과 상태.
    function placesSearchCB(data, status, pagination) {
        if (status === kakao.maps.services.Status.OK) {   // 검색 결과가 있을 때만.
            for (var i = 0; i < data.length; i++) {        // 검색된 장소 수만큼 반복.
                displayMarker(data[i]);                    // i 번째 장소의 마커를 만든다.
            }
            renderPlaceList(data);                         // 오른쪽 패널에 장소 카드 목록을 그린다. (placePanel.js)
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {   // 검색은 됐는데 결과가 0개.
            showPlaceStatus('중간 지점 1km 안에 "' + keyword + '" 검색 결과가 없습니다.');
        } else {                                                          // 그 밖의 오류. (Status.ERROR)
            showPlaceStatus('장소를 불러오지 못했습니다.');
        }
    }

    // 장소 하나(place)를 받아 지도에 마커를 표시하는 함수.
    function displayMarker(place) {
        var marker = new kakao.maps.Marker({
            map: map,                                                // 마커를 표시할 지도.
            position: new kakao.maps.LatLng(place.y, place.x)        // 장소 위치. y 가 위도, x 가 경도라서 y 를 먼저 넣는다. LatLng 얘 위도부터받음.
        });

        // 마커를 클릭하면 참가자별 승용차 경로를 지도에 선으로 그리고, 이동시간을 말풍선에 보여 준다. (carRoutes.js의 showCarRoutes)
        kakao.maps.event.addListener(marker, 'click', function () {
            showCarRoutes(map, placeInfowindow, place, marker, participantList);
        });
    }


}