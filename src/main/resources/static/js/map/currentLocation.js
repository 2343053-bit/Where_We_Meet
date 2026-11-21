import { showAddressInInfoWindow } from './CoorsdtoAddr.js';
import { t } from '../util/i18n.js';   // 다국어 처리. t('키') → 지금 언어의 문장 (messages.properties)
export function showCurrentLocation(locationMap, statusElement) {
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
			removable: true
		});

		showAddressInInfoWindow(
			locationMap,
			currentLocationMarker,
			currentLocationInfoWindow
		);

		locationMap.setCenter(currentLocationPosition);
	}

	// 위치 권한 거부, 응답 시간 초과 등 실패 사유를 지도 아래에 표시한다.
	function displayLocationError(error) {
		statusElement.hidden = false;
		if (error.code === error.PERMISSION_DENIED) {
			statusElement.textContent = t('location.denied');
		} else if (error.code === error.TIMEOUT) {
			statusElement.textContent = t('location.timeout');
		} else {
			statusElement.textContent = t('location.failed');
		}
	}

	// Geolocation API는 보안 연결에서만 사용할 수 있으므로 실행 전에 환경을 확인한다.
	if (!window.isSecureContext) {
		statusElement.hidden = false;
		statusElement.textContent = t('location.insecure');
	} else if (!navigator.geolocation) {
		statusElement.hidden = false;
		statusElement.textContent = t('location.unsupported');
	} else {
		// 위치 조회는 비동기이므로 지도는 먼저 표시되고, 좌표를 받으면 마커와 중심이 갱신된다.
		navigator.geolocation.getCurrentPosition(
			displayCurrentLocation,
			displayLocationError
		);
	}
}
