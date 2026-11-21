// 서버(GeoController, /api/geo)에 장소 검색과 주소 ↔ 좌표 변환을 물어보는 함수들. (routeApi.js 와 같은 방식)
// fetch : 브라우저 JS 가 서버 주소에 요청을 보내는 기능. (터미널의 curl 과 같은 역할) 답은 나중에 온다.

// 기준 위치 주변에서 검색어로 장소를 찾는다. 응답: [ { id, place_name, x, y, ... }, ... ] (없으면 [ ])
export function fetchPlaces(keyword, lat, lng) {
    const params = new URLSearchParams({ keyword, lat, lng });
    return fetch(`/api/geo/places?${params}`).then((response) => {
        if (!response.ok) throw new Error(`장소 검색 API 오류: ${response.status}`);
        return response.json();
    });
}

// 주소 → 좌표. 응답: { lat, lng } (못 찾으면 404 → reject)
export function fetchCoords(address) {
    const params = new URLSearchParams({ address });
    return fetch(`/api/geo/coords?${params}`).then((response) => {
        if (!response.ok) throw new Error(`주소 → 좌표 API 오류: ${response.status}`);
        return response.json();
    });
}

// 좌표 → 주소. 응답: { roadAddress, jibunAddress } (없는 주소는 null, 결과가 없으면 404 → reject)
export function fetchAddress(lat, lng) {
    const params = new URLSearchParams({ lat, lng });
    return fetch(`/api/geo/address?${params}`).then((response) => {
        if (!response.ok) throw new Error(`좌표 → 주소 API 오류: ${response.status}`);
        return response.json();
    });
}
