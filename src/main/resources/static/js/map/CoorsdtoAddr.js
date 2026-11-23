import { t } from '../util/i18n.js';   // 다국어 처리. t('키', 값) → 지금 언어의 문장 (messages.properties)

// 기존 마커 위치의 주소를 조회해 연결된 말풍선에 표시한다.
export function showAddressInInfoWindow(map, marker, infoWindow) {
    // 마커가 표시된 좌표와 카카오 주소 변환 객체를 준비한다.
    var coords = marker.getPosition();
    var geocoder = new kakao.maps.services.Geocoder();

    // 주소 조회가 끝나기 전에도 말풍선을 먼저 보여준다.
    infoWindow.setContent('<div>' + t('location.addressLoading') + '</div>');
    infoWindow.open(map, marker);

    // 경도, 위도 순으로 좌표를 전달하고 조회 결과는 비동기 콜백으로 받는다.
    geocoder.coord2Address(coords.getLng(), coords.getLat(), function(result, status) {
        // 조회 실패 또는 결과가 없으면 안내 문구를 표시하고 종료한다.
        if (status !== kakao.maps.services.Status.OK || !result.length) {
            infoWindow.setContent('<div>' + t('location.addressNotFound') + '</div>');
            infoWindow.open(map, marker);
            return;
        }

        // 주소 문자열을 안전하게 표시할 말풍선 콘텐츠 요소를 만든다.
        var content = document.createElement('div');
        content.className = 'bAddr';

        // 말풍선 제목을 추가한다.
        var title = document.createElement('div');
        title.textContent = t('location.here');   // 현위치 / Current location. (아래 주소 줄들과 같은 방식)
        content.appendChild(title);

        // 도로명 주소나 지번 주소가 없는 경우를 대비해 기본 문구를 둔다.
        var roadAddress = result[0].road_address
            ? result[0].road_address.address_name
            : t('location.none');
        var jibunAddress = result[0].address
            ? result[0].address.address_name
            : t('location.none');

        // 조회된 도로명 주소와 지번 주소를 각각 한 줄씩 추가한다.
        var roadLine = document.createElement('div');
        roadLine.textContent = t('location.roadAddress', roadAddress);    // 사전 "도로명주소: {0}" 의 {0} 자리에 주소
        content.appendChild(roadLine);

        var jibunLine = document.createElement('div');
        jibunLine.textContent = t('location.jibunAddress', jibunAddress); // 사전 "지번 주소: {0}"
        content.appendChild(jibunLine);

        // 완성한 주소 콘텐츠로 말풍선을 갱신한다.
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    });
}

export function addressFromCoordinates(latitude, longitude, callback) {
    var geocoder = new kakao.maps.services.Geocoder();

    // Kakao Geocoder에는 경도, 위도 순으로 전달한다.
    geocoder.coord2Address(longitude, latitude, callback);
}