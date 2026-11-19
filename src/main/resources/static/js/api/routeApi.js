// 출발 → 도착 승용차 경로. 응답: { seconds, path: [[위도, 경도], ...] } (실패 시 seconds = -1)
export function fetchCarRoute(origin, dest) {
    const params = new URLSearchParams({
        originLat: origin.lat, originLng: origin.lng,
        destLat: dest.lat, destLng: dest.lng
    });
    return fetch(`/api/route/car/path?${params}`).then((response) => {
        if (!response.ok) throw new Error(`경로 API 오류: ${response.status}`);
        return response.json();
    });
}
//  참가자마다 서버(/api/route/car/path)에 "이 참가자 → 이 카페 경로"를 물어본다.
//  fetch : 브라우저 JS 가 서버 주소에 요청을 보내는 기능. (터미널의 curl 과 같은 역할) 답은 나중에 온다.