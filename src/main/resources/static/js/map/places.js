import { showCarRoutes, clearRouteLines } from './carRoutes.js';
import { renderPlaceList, showPlaceStatus, highlightPlaceCard } from './placePanel.js';
import { t } from '../util/i18n.js';
import { addCandidate, clearCandidates, setGameResultHandler } from '../game/gameHub.js';

var placeMarkers = []; // 지금 지도에 있는 장소 마커들. (다시 제출하면 지운다)
var placeInfowindow = null; // 장소 말풍선. (하나를 돌려 씀)
var searchId = 0; // 몇 번째 검색인지. 늦게 도착한 이전 검색 결과를 버리는 데 쓴다.

// 이전 검색의 장소 마커, 말풍선, 경로 선을 모두 지운다.
export function clearPlaces() {
    for (var k = 0; k < placeMarkers.length; k++) {
        placeMarkers[k].setMap(null); // 지도에서 지우기. (마커를 지울 때와 같은 방식)
    }
    placeMarkers = []; // 마커 배열을 비운다.
    if (placeInfowindow) placeInfowindow.close(); // 말풍선 닫기. (open 안 했으면 close 해도 아무 일 없음)
    clearRouteLines(); // carRoutes.js 의 함수. 지도에 그려진 경로 선을 모두 지운다.
    clearCandidates(); // 게임 후보도 비운다. 새 검색에서는 i 번째가 다른 장소라서 옛 후보가 엉뚱한 장소를 가리키게 된다.
}

export function searchNearbyPlaces(map, meetingLat, meetingLng, participantList, keyword) {
    clearPlaces(); // 이전 검색 결과를 지운다.
    var mySearchId = ++searchId; // 이번 검색의 id. (늦게 온 이전 검색 결과를 버리는 데 쓴다)
    // zIndex 20 : 금별 마커(zIndex 10)보다 위에 보이게.
    if (!placeInfowindow) placeInfowindow = new kakao.maps.InfoWindow({ zIndex: 20 });
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
        if (mySearchId !== searchId) return; // 그사이 다시 제출했으면 늦게 온 이전 검색 결과는 버린다.  

        if (status === kakao.maps.services.Status.OK) {   // 검색 결과가 있을 때만.
            for (var i = 0; i < data.length; i++) {        // 검색된 장소 수만큼 반복.
                markers.push(displayMarker(data[i], i));   // i 번째 장소의 마커를 만들고, 카드와 짝을 지으려고 저장해 둔다.
            }
            // 오른쪽 패널에 장소 카드 목록을 그린다. (placePanel.js)
            // 카드 i 번을 누르면 i 번째 장소와 i 번째 마커로 selectPlace 를 실행한다.
            // 카드의 🎯 버튼을 누르면 i 번째 장소를 게임 후보에 넣는다. (결과 'added' 등을 돌려줘서 버튼에 안내 글자를 띄운다)
            renderPlaceList(data, function (i) {
                selectPlace(data[i], markers[i], i);
            }, function (i) {
                return addCandidate(i, data[i]);
            });
            // 게임에서 당첨된 장소로 [여기로 가기]를 누르면, 카드를 누른 것과 똑같이 지도 이동 + 경로 표시.
            setGameResultHandler(function (i) {
                selectPlace(data[i], markers[i], i);
            });
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {   // 검색은 됐는데 결과가 0개.
             showPlaceStatus(t('panel.noResult', keyword));
        } else {                                                          // 그 밖의 오류. (Status.ERROR)
            showPlaceStatus(t('panel.loadFailed'));
        }
    }

    // 장소 하나를 골랐을 때 하는 일. 마커 클릭·카드 클릭·게임 당첨이 모두 이 함수를 불러서 항상 같은 동작을 한다.
    // index : 검색 결과에서 몇 번째 장소인지. 패널에서 같은 번호의 카드를 강조하는 데 쓴다.
    function selectPlace(place, marker, index) {
        map.panTo(marker.getPosition());   // 지도 중심을 그 마커로 부드럽게 옮긴다. (바로 옮기려면 setCenter)
        highlightPlaceCard(index);         // 패널에서도 그 카드를 강조하고 보이는 곳까지 스크롤한다. (placePanel.js)
        // 참가자별 승용차 경로를 지도에 선으로 그리고, 이동시간을 말풍선에 보여 준다. (carRoutes.js의 showCarRoutes)
        showCarRoutes(map, placeInfowindow, place, marker, participantList);
    }

    // 장소 하나(place)를 받아 지도에 마커를 표시하고, 만든 마커를 돌려주는 함수. index = 검색 결과에서 몇 번째인지.
    function displayMarker(place, index) {
        var marker = new kakao.maps.Marker({
            map: map,                                                // 마커를 표시할 지도.
            position: new kakao.maps.LatLng(place.y, place.x)        // 장소 위치. y 가 위도, x 가 경도라서 y 를 먼저 넣는다. LatLng 얘 위도부터받음.
        });

        // 마커를 클릭하면 그 장소를 고른 것으로 처리한다. (지도 이동 + 경로 표시, 위의 selectPlace)
        kakao.maps.event.addListener(marker, 'click', function () {
            selectPlace(place, marker, index);
        });

        placeMarkers.push(marker); // 다음 검색 때 지우려고 모아 둔다.
        return marker;   // 카드와 짝을 지으려고 만든 마커를 돌려준다.
    }


}