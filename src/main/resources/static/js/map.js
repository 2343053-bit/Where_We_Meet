import { showCarRoutes } from './map/carRoutes.js';

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

// 마커 위치들을 모아 둘 범위 상자. 나중에 이 범위가 다 보이게 지도를 맞춘다.
var bounds = new kakao.maps.LatLngBounds();



// 제출해서 중간 지점이 계산된 경우에만 마커를 찍는다.
if (meetingLat != null) {
	var markerPosition = new kakao.maps.LatLng(meetingLat, meetingLng);  // 마커 위치. (위도, 경도 순) ← 마커보다 먼저 만들어야 한다.

	// 중간 지점은 노란 마커 이미지로 표시해서 참가자 마커(기본 파란 마커)와 구분한다.
	var imageSrc = 'https://t1.kakaocdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; // 마커 이미지 주소. (카카오 샘플의 노란 별 마커) 
	// 다른 그림을 쓰려면 위 줄과 아래 두 줄(크기, offset)을 그림에 맞게 바꾼다.
	var imageSize = new kakao.maps.Size(24, 35);                    // 마커 이미지 크기. (가로, 세로 px)
	var imageOption = { offset: new kakao.maps.Point(12, 35) };     // 이미지의 어느 점을 좌표에 맞출지. (가로 가운데 12, 맨 아래 35 = 핀의 뾰족한 끝)
	var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);           // 마커 이미지 생성.
	var marker = new kakao.maps.Marker({ position: markerPosition, image: markerImage });     // 마커 생성.

	marker.setMap(map);                                                  // 지도 위에 올리기.
	map.setCenter(markerPosition);                                       // 지도 중심도 중간 지점으로 이동.
	bounds.extend(markerPosition);                                       // 범위 상자에 중간 지점 추가.

	// 중간 지점 마커 위에 "중간 지점" 말풍선 표시.
	var infowindow = new kakao.maps.InfoWindow({
		position: markerPosition,                             // 말풍선 위치.
		content: '<div class="info-window">중간 지점</div>' // 말풍선 내용. -----------------------추후 html 태그로 바꿔서 참가자 이름과 평균 위치를 표시하도록 수정 가능.
	});
	infowindow.open(map, marker);                             // marker 위에 말풍선 열기.
}
// ── 참가자 위치 마커 ───────────────────────
//   참가자 목록을 JS 배열로 받는다.
//   participantForm 은 컨트롤러의 @ModelAttribute 가 화면에 자동으로 넘겨 주는 폼 객체를 사용했음.
//   나중에 컨트롤러 39번 줄 주석을 풀면, 화면의 participantForm?.participants를 participants로 바꾸기만 하면 됨.
//   서버가 처리하면 [{"participantName":"철수","latitude":37.5,"longitude":127.0}, ...] 모양이 된다.


// 참가자 수만큼 반복.
for (var i = 0; i < participantList.length; i++) { // participantList.length 는 참가자 수, participantList[i] 는 i 번째 참가자. (0부터 셈.)

	// 처음 접속하면 빈 입력칸(위도·경도 null)이 2개 있으므로 건너뛴다.
	if (participantList[i].latitude == null || participantList[i].longitude == null) {
		continue;
	}

	// 마커 생성. map: map 으로 바로 지도에 올린다.
	var marker = new kakao.maps.Marker({
		map: map,                                                                              // 마커를 표시할 지도.
		position: new kakao.maps.LatLng(participantList[i].latitude, participantList[i].longitude),  // 참가자 위치. (위도, 경도 순.)
		title: participantList[i].participantName                                                    // 마우스를 올리면 이름 표시.
	});

	bounds.extend(marker.getPosition()); // 범위 상자에 방금 만든 마커의 위치 추가.

	// 참가자 마커 위에 이름 말풍선 표시.
	var infowindow = new kakao.maps.InfoWindow({
		position: marker.getPosition(),                                                         // 말풍선 위치.
		content: '<div class="info-window">' + participantList[i].participantName + '</div>'  // 말풍선 내용. 이름을 글자 사이에 끼워 넣음.
	});
	infowindow.open(map, marker);                                                               // marker 위에 말풍선 열기.
}
// 범위 상자에 좌표가 하나라도 있으면 그 좌표들이 다 보이게 지도 범위를 맞춘다.
// 처음 접속하면 상자가 비어 있으므로 건너뛴다.
if (!bounds.isEmpty()) {
	map.setBounds(bounds); // 지도의 중심과 확대 레벨이 자동으로 바뀐다.
}

// ── 중간 지점 주변 장소 검색 ───────────────────────
if (meetingLat != null) {
	var placeInfowindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 장소 마커를 클릭하면 장소 이름을 보여 줄 말풍선. (하나를 돌려 씀) zIndex 는 다른 말풍선보다 위에 보이게.
	var ps = new kakao.maps.services.Places();                       // 장소 검색 객체 생성.

	// '카페' 를 검색한다. 검색이 끝나면 placesSearchCB 함수가 실행된다. (콜백)
	ps.keywordSearch('카페', placesSearchCB, {                       // 지금은 '카페' 고정. 폼에 장소 종류 입력칸(keyword)이 생기면 '카페' 대신 participantForm 의 keyword 값을 넣도록 바꾼다.
		// (주의: th:inline 안에서는 주석 속에 서버 값 넣는 대괄호 두 개 문법을 쓰면 Thymeleaf 가 실제로 실행해서 에러가 난다.)
		location: new kakao.maps.LatLng(meetingLat, meetingLng),     // 검색 기준 위치. (중간 지점)
		radius: 1000,                                                // 기준 위치에서 1000m 안에서만 찾는다.
		sort: kakao.maps.services.SortBy.DISTANCE                    // 가까운 순서로 정렬한다.
	});
}

// 검색이 끝나면 카카오가 호출해 주는 함수. data = 검색된 장소 목록, status = 검색 결과 상태.
function placesSearchCB(data, status, pagination) {
	if (status === kakao.maps.services.Status.OK) {   // 검색 결과가 있을 때만.
		for (var i = 0; i < data.length; i++) {        // 검색된 장소 수만큼 반복.
			displayMarker(data[i]);                    // i 번째 장소의 마커를 만든다.
		}
	}
}

// 장소 하나(place)를 받아 지도에 마커를 표시하는 함수.
function displayMarker(place) {
	var marker = new kakao.maps.Marker({
		map: map,                                                // 마커를 표시할 지도.
		position: new kakao.maps.LatLng(place.y, place.x)        // 장소 위치. y 가 위도, x 가 경도라서 y 를 먼저 넣는다. LatLng 얘 위도부터받음.
	});

	// 마커를 클릭하면 참가자별 승용차 경로를 지도에 선으로 그리고, 이동시간을 말풍선에 보여 준다. (아래 showCarRoutes)
	kakao.maps.event.addListener(marker, 'click', function () {
		showCarRoutes(map, placeInfowindow, place, marker, participantList);
	});
}

