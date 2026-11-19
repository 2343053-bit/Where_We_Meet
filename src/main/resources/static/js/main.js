import { readAppData } from './appData.js';
import { createMap } from './map/createMap.js';
import { showCurrentLocation } from './map/currentLocation.js';
import { drawResult } from './map/resultMarkers.js';
import { searchNearbyPlaces } from './map/places.js';
import { initParticipantList } from "./participants/participantList.js";
import { initAddressSearch } from "./participants/addressSearch.js";
import { initSubmit } from "./participants/submit.js";

var appData = readAppData();
var meetingPoint = appData.meetingPoint;
var meetingLat = meetingPoint ? meetingPoint.meetingLatitude : null;
var meetingLng = meetingPoint ? meetingPoint.meetingLongitude : null;
var participantList = appData.participants;

const participantsEl = document.getElementById("participants");
initParticipantList(participantsEl, 
    document.getElementById("addParticipant"), 
    document.getElementById("removeParticipant"),
    document.getElementById("participant-template"));
initAddressSearch(participantsEl);
initSubmit(document.getElementById("participantForm"), participantsEl);

// 지도 생성 및 반환.
var map = createMap(document.getElementById('map'));

// 지도 생성 직후 현재 위치를 한 번 요청한다.
showCurrentLocation(map, document.getElementById('current-location-status')); // 지도와 안내 문구 요소를 위치 처리 함수에 전달한다.

// ── 지도에 참가자 마커와 중간 지점 마커를 표시하고, 지도 범위를 참가자와 중간 지점이 다 보이게 맞춘다. ───────────────────────
drawResult(map, meetingLat, meetingLng, participantList);

// ── 중간 지점 주변 장소 검색 ───────────────────────
if (meetingLat != null) {
    searchNearbyPlaces(map, meetingLat, meetingLng, participantList); // 장소 검색 함수 호출. (map, 중간 지점 위도, 중간 지점 경도, 참가자 목록)
}

