export function showAddressInInfoWindow(map, marker, infoWindow) {
    var coords = marker.getPosition();
    var geocoder = new kakao.maps.services.Geocoder();

    infoWindow.setContent('<div>주소 확인 중...</div>');
    infoWindow.open(map, marker);

    geocoder.coord2Address(coords.getLng(), coords.getLat(), function(result, status) {
        if (status !== kakao.maps.services.Status.OK || !result.length) {
            infoWindow.setContent('<div>주소를 찾을 수 없습니다.</div>');
            infoWindow.open(map, marker);
            return;
        }

        var content = document.createElement('div');
        content.className = 'bAddr';

        var title = document.createElement('div');
        title.textContent = '현위치';
        content.appendChild(title);

        var roadAddress = result[0].road_address
            ? result[0].road_address.address_name
            : '없음';
        var jibunAddress = result[0].address
            ? result[0].address.address_name
            : '없음';

        var roadLine = document.createElement('div');
        roadLine.textContent = '도로명주소: ' + roadAddress;
        content.appendChild(roadLine);

        var jibunLine = document.createElement('div');
        jibunLine.textContent = '지번 주소: ' + jibunAddress;
        content.appendChild(jibunLine);

        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    });
}