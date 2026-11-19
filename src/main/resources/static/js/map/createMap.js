export function createMap(container) {
    var options = {
        center: new kakao.maps.LatLng(35.117, 128.968), // 동아대 위치
        level: 3
    };

    return new kakao.maps.Map(container, options); //지도 생성 및 반환.
}