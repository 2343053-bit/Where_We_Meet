import { searchNearbyPlaces } from './map/places.js';
import { drawResult } from './map/resultMarkers.js';

var appData = window.APP_DATA || {};
var meetingPoint = appData.meetingPoint;
var meetingLat = meetingPoint ? meetingPoint.meetingLatitude : null;
var meetingLng = meetingPoint ? meetingPoint.meetingLongitude : null;
var participantList = appData.participants || [];

var container = document.getElementById('map');
var options = {
	center: new kakao.maps.LatLng(35.117, 128.968), // 동아대 위치
	level: 3
};

var map = new kakao.maps.Map(container, options); //지도 생성.

// 지도 생성 직후 현재 위치를 한 번 요청한다.
// 별도 함수 범위로 감싸 참가자 입력 폼의 변수와 충돌하지 않게 한다.
(function showCurrentLocationOnMap(locationMap, statusElement) {
	// 브라우저에서 위치를 받으면 좌표로 마커와 안내창을 만들고 지도 중심을 이동한다.
	function displayCurrentLocation(position) {
		var currentLocationPosition = new kakao.maps.LatLng(
			position.coords.latitude,
			position.coords.longitude
		);
		var currentLocationMarker = new kakao.maps.Marker({
			map: locationMap,
			position: currentLocationPosition
		});
		var currentLocationInfoWindow = new kakao.maps.InfoWindow({
			content: '<div class="info-window">여기에 계신가요?!</div>',
			removable: true
		});

		currentLocationInfoWindow.open(locationMap, currentLocationMarker);
		locationMap.setCenter(currentLocationPosition);
	}

	// 위치 권한 거부, 응답 시간 초과 등 실패 사유를 지도 아래에 표시한다.
	function displayLocationError(error) {
		statusElement.hidden = false;
		if (error.code === error.PERMISSION_DENIED) {
			statusElement.textContent = '현재 위치 권한을 허용해주세요.';
		} else if (error.code === error.TIMEOUT) {
			statusElement.textContent = '현재 위치 확인 시간이 초과되었습니다.';
		} else {
			statusElement.textContent = '현재 위치를 가져오지 못했습니다.';
		}
	}

	// Geolocation API는 보안 연결에서만 사용할 수 있으므로 실행 전에 환경을 확인한다.
	if (!window.isSecureContext) {
		statusElement.hidden = false;
		statusElement.textContent = '현재 위치 기능은 HTTPS 또는 localhost에서 사용할 수 있습니다.';
	} else if (!navigator.geolocation) {
		statusElement.hidden = false;
		statusElement.textContent = '이 브라우저는 현재 위치 기능을 지원하지 않습니다.';
	} else {
		// 위치 조회는 비동기이므로 지도는 먼저 표시되고, 좌표를 받으면 마커와 중심이 갱신된다.
		navigator.geolocation.getCurrentPosition(
			displayCurrentLocation,
			displayLocationError
		);
	}
})(map, document.getElementById('current-location-status')); // 지도와 안내 문구 요소를 위치 처리 함수에 전달한다.

// ── 지도에 참가자 마커와 중간 지점 마커를 표시하고, 지도 범위를 참가자와 중간 지점이 다 보이게 맞춘다. ───────────────────────
drawResult(map, meetingLat, meetingLng, participantList);

// ── 중간 지점 주변 장소 검색 ───────────────────────
if (meetingLat != null) {
	searchNearbyPlaces(map, meetingLat, meetingLng, participantList); // 장소 검색 함수 호출. (map, 중간 지점 위도, 중간 지점 경도, 참가자 목록)
}