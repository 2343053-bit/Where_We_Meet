import { t } from '../util/i18n.js';   // 다국어 처리. t('키') → 지금 언어의 문장 (messages.properties)

export function drawResult(map, meetingLat, meetingLng, participantList, averagePoint) {
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
        var marker = new kakao.maps.Marker({ position: markerPosition, image: markerImage, zIndex: 10 });     // 마커 생성.

        marker.setMap(map);                                                  // 지도 위에 올리기.
        map.setCenter(markerPosition);                                       // 지도 중심도 중간 지점으로 이동.
        bounds.extend(markerPosition);                                       // 범위 상자에 중간 지점 추가.

        // 중간 지점 마커 위에 "중간 지점" 말풍선 표시.
        var infowindow = new kakao.maps.InfoWindow({
            position: markerPosition,                             // 말풍선 위치.
            content: '<div class="info-window">' + t('result.meetingPoint') + '</div>' // 말풍선 내용. (중간 지점 / Midpoint) -----------------------추후 html 태그로 바꿔서 참가자 이름과 평균 위치를 표시하도록 수정 가능.
        });
        infowindow.open(map, marker);                             // marker 위에 말풍선 열기.
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
            content: '<div class="info-window">' + t('result.averagePoint') + '</div>'
        });
        // 중간 지점 말풍선을 가리지 않게, 마우스를 올리거나 누를 때만 보여 준다.
        kakao.maps.event.addListener(averageMarker, 'mouseover', function () { averageWindow.open(map, averageMarker); });
        kakao.maps.event.addListener(averageMarker, 'click', function () { averageWindow.open(map, averageMarker); });
        kakao.maps.event.addListener(averageMarker, 'mouseout', function () { averageWindow.close(); });    
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

}