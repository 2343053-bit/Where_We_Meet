import { readAppData } from './appData.js';
import { createMap } from './map/createMap.js';
import { showCurrentLocation } from './map/currentLocation.js';
import { drawResult } from './map/resultMarkers.js';
import { searchNearbyPlaces } from './map/places.js';
import { initParticipantList } from "./participants/participantList.js";
import { initAddressSearch } from "./participants/addressSearch.js";
import { initSubmit } from "./participants/submit.js";
import { coordsToAddress } from './api/geocoder.js';
import { initMessages } from './util/i18n.js';

var appData = readAppData();
initMessages(appData.messages);   // 번역 문장 넣기. 다른 모듈이 t('키') 를 쓰기 전에.
var meetingPoint = appData.meetingPoint;
var meetingLat = meetingPoint ? meetingPoint.meetingLatitude : null;
var meetingLng = meetingPoint ? meetingPoint.meetingLongitude : null;
// 중간 지점 좌표가 있을 때만 해당 좌표를 주소로 변환한다.
if (meetingLat != null && meetingLng != null) {
    // 주소 조회는 비동기이므로 Promise가 완료된 뒤 화면을 갱신한다.
    coordsToAddress(meetingLat, meetingLng)
        .then(address => {
            // 변환된 주소를 평균 위치 주소 영역에 표시한다.
            document.getElementById('meeting-address').textContent = address;
        })
        .catch(error => {
            // 변환에 실패하면 사용자에게 안내하고 오류 원인은 콘솔에 기록한다.
            document.getElementById('meeting-address').textContent = '주소를 찾을 수 없습니다.';
            console.error(error);
        });
}
var participantList = appData.participants;

var keyword = document.getElementById('keyword').value.trim() || '카페';

const participantsEl = document.getElementById("participants");
initParticipantList(participantsEl, 
    document.getElementById("addParticipant"), 
    document.getElementById("removeParticipant"),
    document.getElementById("participant-template"));
initAddressSearch(participantsEl);
initSubmit(document.getElementById("participantForm"), participantsEl);

// 지도 생성 및 반환.
var map = createMap(document.getElementById('map'));

// 입력 화면을 열거나 새로고침할 때 현재 위치를 찾는다.
// 결과 화면에서는 중간 지점 지도를 유지하기 위해 현재 위치를 다시 요청하지 않는다.
if (meetingPoint == null) {
    showCurrentLocation(map, document.getElementById('current-location-status'));
}
// ── 지도에 참가자 마커와 중간 지점 마커를 표시하고, 지도 범위를 참가자와 중간 지점이 다 보이게 맞춘다. ───────────────────────
drawResult(map, meetingLat, meetingLng, participantList);

// ── 중간 지점 주변 장소 검색 ───────────────────────
if (meetingLat != null) {
    searchNearbyPlaces(map, meetingLat, meetingLng, participantList, keyword);
}

