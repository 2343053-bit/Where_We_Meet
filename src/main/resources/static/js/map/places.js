import { showCarRoutes } from './carRoutes.js';
import { fetchPlaces } from '../api/geoApi.js';   // map/ 에서 한 칸 위로

export function searchNearbyPlaces(map, meetingLat, meetingLng, participantList, keyword) {
    var placeInfowindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 장소 마커를 클릭하면 장소 이름을 보여 줄 말풍선. (하나를 돌려 씀) zIndex 는 다른 말풍선보다 위에 보이게.

    // 검색어 주변 장소를 서버(/api/geo/places)에 물어보고, 답이 오면 placesSearchCB 함수가 실행된다.
    // 검색 기준 위치(중간 지점), 반경 1000m, 가까운 순서 정렬은 서버(KakaoLocalService.searchKeyword)가 정한다.
    fetchPlaces(keyword, meetingLat, meetingLng)
        .then(placesSearchCB)
        .catch(function (error) {                     // 서버나 네트워크 오류. (예전처럼 장소 마커 없이 넘어간다)
            console.error(error);
        });

    // 서버 답이 오면 실행되는 함수. data = 검색된 장소 목록. (결과가 없으면 빈 배열이라 반복을 한 번도 안 한다)
    function placesSearchCB(data) {
        for (var i = 0; i < data.length; i++) {        // 검색된 장소 수만큼 반복.
            displayMarker(data[i]);                    // i 번째 장소의 마커를 만든다.
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