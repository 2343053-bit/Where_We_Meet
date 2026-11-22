import { showCarRoutes } from './carRoutes.js';
import { renderPlaceList, showPlaceStatus } from './placePanel.js';
import { t } from '../util/i18n.js';

export function searchNearbyPlaces(map, meetingLat, meetingLng, participantList, keyword) {
    var placeInfowindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 장소 마커를 클릭하면 장소 이름을 보여 줄 말풍선. (하나를 돌려 씀) zIndex 는 다른 말풍선보다 위에 보이게.
    var ps = new kakao.maps.services.Places();                       // 장소 검색 객체 생성.
    var markers = [];                                                // 검색된 장소의 마커들. 검색 결과와 같은 순서라 data[i] 의 마커 = markers[i].

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
                markers.push(displayMarker(data[i]));      // i 번째 장소의 마커를 만들고, 카드와 짝을 지으려고 저장해 둔다.
            }
            // 오른쪽 패널에 장소 카드 목록을 그린다. (placePanel.js)
            // 카드 i 번을 누르면 i 번째 장소와 i 번째 마커로 selectPlace 를 실행한다.
            renderPlaceList(data, function (i) {
                selectPlace(data[i], markers[i]);
            });
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {   // 검색은 됐는데 결과가 0개.
             showPlaceStatus(t('panel.noResult', keyword));
        } else {                                                          // 그 밖의 오류. (Status.ERROR)
            showPlaceStatus(t('panel.loadFailed'));
        }
    }

    // 장소 하나를 골랐을 때 하는 일. 마커 클릭과 카드 클릭이 둘 다 이 함수를 불러서 항상 같은 동작을 한다.
    function selectPlace(place, marker) {
        map.panTo(marker.getPosition());   // 지도 중심을 그 마커로 부드럽게 옮긴다. (바로 옮기려면 setCenter)
        // 참가자별 승용차 경로를 지도에 선으로 그리고, 이동시간을 말풍선에 보여 준다. (carRoutes.js의 showCarRoutes)
        showCarRoutes(map, placeInfowindow, place, marker, participantList);
    }

    // 장소 하나(place)를 받아 지도에 마커를 표시하고, 만든 마커를 돌려주는 함수.
    function displayMarker(place) {
        var marker = new kakao.maps.Marker({
            map: map,                                                // 마커를 표시할 지도.
            position: new kakao.maps.LatLng(place.y, place.x)        // 장소 위치. y 가 위도, x 가 경도라서 y 를 먼저 넣는다. LatLng 얘 위도부터받음.
        });

        // 마커를 클릭하면 그 장소를 고른 것으로 처리한다. (지도 이동 + 경로 표시, 위의 selectPlace)
        kakao.maps.event.addListener(marker, 'click', function () {
            selectPlace(place, marker);
        });

        return marker;   // 카드와 짝을 지으려고 만든 마커를 돌려준다.
    }


}