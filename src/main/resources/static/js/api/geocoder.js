import { fetchCoords, fetchAddress } from './geoApi.js';

// 주소 하나를 좌표로 바꾼다. 성공하면 { lat, lng }, 실패하면 reject.
// 실제 변환은 서버(/api/geo/coords → KakaoLocalService.addressToCoords)가 한다.
export function addressToCoords(address) {
    return fetchCoords(address);   // 서버 답이 이미 { lat, lng } 모양이라 그대로 돌려준다. (y = 위도, x = 경도 변환은 서버가 함)
}
// 위도와 경도를 주소로 바꾼다. 성공하면 주소 문자열을 반환하고, 실패하면 reject.
// 실제 변환은 서버(/api/geo/address → KakaoLocalService.coordsToAddress)가 한다.
export function coordsToAddress(latitude, longitude) {
    // 경도, 위도 순서 맞추기는 서버가 하므로 여기서는 위도, 경도 순으로 넘긴다.
    return fetchAddress(latitude, longitude).then((result) => {
        // 도로명 주소가 있으면 도로명 주소, 없으면 지번 주소를 쓴다.
        const address = result.roadAddress ?? result.jibunAddress;

        if (!address) {
            throw new Error('해당 좌표의 주소 정보가 없습니다.');
        }

        return address;
    });
}
