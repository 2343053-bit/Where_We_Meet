// 주소 하나를 좌표로 바꾼다. 성공하면 { lat, lng }, 실패하면 reject.
export function addressToCoords(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
            if (status === kakao.maps.services.Status.OK) {
                resolve({ lat: result[0].y, lng: result[0].x });   // y = 위도, x = 경도
            } else {
                reject(new Error(status));
            }
        });
    });
}
