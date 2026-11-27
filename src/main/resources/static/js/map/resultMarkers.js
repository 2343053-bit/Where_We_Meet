import { t } from '../util/i18n.js';   // 다국어 처리. t('키') → 지금 언어의 문장 (messages.properties)

var resultMarkers = []; // 지금 지도에 있는 중간 지점·평균 지점·참가자 마커들.
var resultWindows = []; // 그 말풍선들.

// 이전 결과의 마커와 말풍선을 모두 지운다. (다시 제출할 때)
export function clearResult() {
    resultMarkers.forEach(function (m) { m.setMap(null); });
    resultWindows.forEach(function (w) { w.close(); });
    resultMarkers = [];
    resultWindows = [];
}

export function drawResult(map, meetingLat, meetingLng, participantList, averagePoint) {
    // 마커 위치들을 모아 둘 범위 상자. 나중에 이 범위가 다 보이게 지도를 맞춘다.
    var bounds = new kakao.maps.LatLngBounds();

    var meetingWindow = null; // 중간 지점 말풍선. 반환해서 main.js 가 주소를 넣는다.

    // 제출해서 중간 지점이 계산된 경우에만 마커를 찍는다.
    if (meetingLat != null) {
        var markerPosition = new kakao.maps.LatLng(meetingLat, meetingLng);  // 마커 위치. (위도, 경도 순) ← 마커보다 먼저 만들어야 한다.

        // 중간 지점은 노란 마커 이미지로 표시해서 참가자 마커(기본 파란 마커)와 구분한다.
        var imageSrc = 'https://t1.kakaocdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; // 마커 이미지 주소. (카카오 샘플의 노란 별 마커) 
        // 다른 그림을 쓰려면 위 줄과 아래 두 줄(크기, offset)을 그림에 맞게 바꾼다.
        var imageSize = new kakao.maps.Size(24, 35);                    // 마커 이미지 크기. (가로, 세로 px)
        var imageOption = { offset: new kakao.maps.Point(12, 35) };     // 이미지의 어느 점을 좌표에 맞출지. (가로 가운데 12, 맨 아래 35 = 핀의 뾰족한 끝)
        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);           // 마커 이미지 생성.
        var meetingMarker = new kakao.maps.Marker({ position: markerPosition, image: markerImage, zIndex: 10 });     // 마커 생성. (참가자 마커 marker 와 이름이 겹치면 안 된다 — var 는 함수 안에서 하나만 있다)

        meetingMarker.setMap(map);                                           // 지도 위에 올리기.
        map.setCenter(markerPosition);                                       // 지도 중심도 중간 지점으로 이동.
        bounds.extend(markerPosition);                                       // 범위 상자에 중간 지점 추가.

        // 중간 지점 마커 위에 "중간 지점" 말풍선 표시.
        meetingWindow = new kakao.maps.InfoWindow({
            position: markerPosition,
            content: '<div class="info-window">' + t('result.meetingPoint') + '</div>',
            disableAutoPan: true   // 말풍선이 화면 밖으로 나가도 지도 이동하지 않음.
        });
        // 처음에는 닫아 두고, 마우스를 올리거나 누를 때만 보여 준다. (회색 원래 중간 지점 마커와 같은 방식)
        kakao.maps.event.addListener(meetingMarker, 'mouseover', function () { meetingWindow.open(map, meetingMarker); });
        kakao.maps.event.addListener(meetingMarker, 'click', function () { meetingWindow.open(map, meetingMarker); });   // 휴대폰처럼 마우스가 없는 화면용.
        kakao.maps.event.addListener(meetingMarker, 'mouseout', function () { meetingWindow.close(); });
        resultMarkers.push(meetingMarker); // 나중에 지우려고 모아 둔다.
        resultWindows.push(meetingWindow); // 나중에 지우려고 모아 둔다.
    }

    // 조정 전 평균 지점(회색). 중간 지점이 옮겨졌을 때만 표시한다.
    if (averagePoint) {
        var averagePosition = new kakao.maps.LatLng(averagePoint.lat, averagePoint.lng);
        var averageMarker = new kakao.maps.Marker({
            map: map,
            position: averagePosition,
            zIndex: -1,   // 다른 마커보다 아래에.
            image: new kakao.maps.MarkerImage(
                '/images/markers/average-point.svg',
                new kakao.maps.Size(24, 35),
                { offset: new kakao.maps.Point(12, 35) })
        });
        bounds.extend(averagePosition);

        var averageWindow = new kakao.maps.InfoWindow({
            position: averagePosition,
            content: '<div class="info-window">' + t('result.averagePoint') + '</div>',
            disableAutoPan: true   // 말풍선이 화면 밖으로 나가도 지도 이동하지 않음.
        });
        // 중간 지점 말풍선을 가리지 않게, 마우스를 올리거나 누를 때만 보여 준다.
        kakao.maps.event.addListener(averageMarker, 'mouseover', function () { averageWindow.open(map, averageMarker); });
        kakao.maps.event.addListener(averageMarker, 'click', function () { averageWindow.open(map, averageMarker); });
        kakao.maps.event.addListener(averageMarker, 'mouseout', function () { averageWindow.close(); });
        resultMarkers.push(averageMarker); // 나중에 지우려고 모아 둔다.
        resultWindows.push(averageWindow); // 나중에 지우려고 모아 둔다.
    }

    // ── 참가자 위치 마커 ───────────────────────
    //   참가자 목록을 JS 배열로 받는다.
    //   participantForm 은 컨트롤러의 @ModelAttribute 가 화면에 자동으로 넘겨 주는 폼 객체를 사용했음.
    //   나중에 컨트롤러 40번 줄 주석을 풀면, 화면의 participantForm?.participants를 participants로 바꾸기만 하면 됨.
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
        var nameBox = document.createElement('div');
        nameBox.className = 'info-window';
        nameBox.textContent = participantList[i].participantName;
        var infowindow = new kakao.maps.InfoWindow({
            position: marker.getPosition(),
            content: nameBox
        });
        infowindow.open(map, marker); // marker 위에 말풍선 열기.
        resultMarkers.push(marker); // 나중에 지우려고 모아 둔다.
        resultWindows.push(infowindow); // 나중에 지우려고 모아 둔다.
    }
    // 범위 상자에 좌표가 하나라도 있으면 그 좌표들이 다 보이게 지도 범위를 맞춘다.
    // 처음 접속하면 상자가 비어 있으므로 건너뛴다.
    if (!bounds.isEmpty()) {
        map.setBounds(bounds); // 지도의 중심과 확대 레벨이 자동으로 바뀐다.
    }
    return meetingWindow;
}