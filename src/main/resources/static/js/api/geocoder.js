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
// 위도와 경도를 주소로 바꾼다. 성공하면 주소 문자열을 반환하고, 실패하면 reject.
export function coordsToAddress(latitude, longitude) {
    return new Promise((resolve, reject) => {
        const geocoder = new kakao.maps.services.Geocoder();

        // Kakao Geocoder에는 경도, 위도 순으로 전달한다.
        geocoder.coord2Address(longitude, latitude, (result, status) => {
            if (status !== kakao.maps.services.Status.OK || !result.length) {
                reject(new Error('좌표를 주소로 변환하지 못했습니다.'));
                return;
            }

            const address =
                result[0].road_address?.address_name ??
                result[0].address?.address_name;

            if (!address) {
                reject(new Error('해당 좌표의 주소 정보가 없습니다.'));
                return;
            }

            resolve(address);
        });
    });
}
