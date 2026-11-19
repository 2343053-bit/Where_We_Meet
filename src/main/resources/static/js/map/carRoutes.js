import { fetchCarRoute } from '../api/routeApi.js';

// ── 카페 클릭 → 참가자별 승용차 경로 선 + 이동시간 ───────────────────────
var routeColors = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA']; // 참가자별 선 색. (빨강, 파랑, 초록, 주황, 보라 / 최대 5명)
var routeLines = [];            // 지금 지도에 그려져 있는 경로 선들. (다른 카페를 누르면 지우려고 모아 둔다)
var lastClickedPlaceId = null;  // 마지막으로 누른 카페의 id. (늦게 온 답이 다른 카페 결과를 덮어쓰지 않게)

// 지도에 그려져 있는 경로 선을 모두 지운다.
function clearRouteLines() {
	for (var k = 0; k < routeLines.length; k++) {
		routeLines[k].setMap(null);   // setMap(null) : 지도에서 지우기. (마커를 지울 때와 같은 방식)
	}
	routeLines = [];
}

// place(카페)까지 참가자별 승용차 경로를 선으로 그리고, 이동시간을 말풍선에 보여 준다.
export function showCarRoutes(map, placeInfowindow, place, marker, participantList) {
	// 1) 이전 카페의 경로 선을 지우고, "계산 중" 문구를 먼저 띄운다. (서버 답이 오기까지 1~2초 걸림)
	clearRouteLines();
	lastClickedPlaceId = place.id;
	placeInfowindow.setContent('<div class="info-window info-window--place">' + place.place_name + '<br>승용차 경로 계산 중...</div>');
	placeInfowindow.open(map, marker);

	var names = [];     // 참가자 이름 목록. (답 순서와 같은 순서로 쌓는다)
	var requests = [];  // 서버 요청 목록.
	for (var i = 0; i < participantList.length; i++) {
		if (participantList[i].latitude == null || participantList[i].longitude == null) {
			continue; // 빈 입력칸은 건너뛴다.
		}
		names.push(participantList[i].participantName);
		requests.push(fetchCarRoute(
			{ lat: participantList[i].latitude, lng: participantList[i].longitude },  // 출발: 참가자
			{ lat: place.y, lng: place.x }                                            // 도착: 카페 (y = 위도)
		));
	}

	// 3) Promise.all : 모든 참가자의 답이 다 오면 한 번에 처리한다.
	Promise.all(requests)
		.then(function (results) { // results[j] = j 번째 참가자의 답. seconds = 이동시간(초), path = 점 목록 (점 하나 = [위도, 경도])
			if (lastClickedPlaceId !== place.id) {
				return; // 그사이 다른 카페를 눌렀으면 이 결과는 버린다.
			}
			var html = '<div class="info-window info-window--place">' + place.place_name;
			for (var j = 0; j < results.length; j++) {
				var color = routeColors[j % routeColors.length]; // j 번째 참가자의 선 색. (% : 5명을 넘으면 색을 처음부터 다시 씀)

				if (results[j].seconds < 0) {                     // 길찾기 실패.
					html += '<br>' + names[j] + ': 경로 없음';
					continue;
				}

				// 서버가 준 점들([위도, 경도])을 카카오 좌표 객체(LatLng) 목록으로 바꾼다. (카카오 샘플의 linePath)
				var linePath = [];
				for (var p = 0; p < results[j].path.length; p++) {
					linePath.push(new kakao.maps.LatLng(results[j].path[p][0], results[j].path[p][1]));
				}

				// 지도에 선을 그린다. (카카오 샘플: 원, 선, 사각형, 다각형 표시하기)
				var polyline = new kakao.maps.Polyline({
					path: linePath,       // 선을 구성하는 좌표 목록.
					strokeWeight: 5,      // 선 두께.
					strokeColor: color,   // 선 색. (참가자마다 다름)
					strokeOpacity: 0.8,   // 불투명도. (0~1, 0에 가까울수록 투명)
					strokeStyle: 'solid'  // 실선.
				});
				polyline.setMap(map);
				routeLines.push(polyline); // 다음에 지우려고 모아 둔다.

				// 말풍선에 "■ 이름: 승용차 N분" 을 선과 같은 색 네모와 함께 쓴다.
				html += '<br><span style="color:' + color + ';">■</span> ' + names[j] + ': 승용차 ' + Math.round(results[j].seconds / 60) + '분';
			}
			html += '</div>';
			placeInfowindow.setContent(html);
		})
		.catch(function () { // 서버나 네트워크 오류.
			placeInfowindow.setContent('<div class="info-window info-window--place">' + place.place_name + '<br>경로를 불러오지 못했습니다.</div>');
		});
}
