import { readAppData } from "./appData.js";
import { createMap } from "./map/createMap.js";
import { showCurrentLocation } from "./map/currentLocation.js";
import { drawResult } from "./map/resultMarkers.js";
import { searchNearbyPlaces } from "./map/places.js";
import { initParticipantList } from "./participants/participantList.js";
import { initAddressSearch } from "./participants/addressSearch.js";
import { initFriendSelect } from "./participants/friendSelect.js";
import { initSubmit } from "./participants/submit.js";
import { coordsToAddress } from "./api/geocoder.js";
import { initMessages, t } from "./util/i18n.js"; // { 이름1, 이름2 } : 한 파일에서 여러 개를 한 번에 가져온다.
import { initLangSwitch } from "./util/langSwitch.js";

var appData = readAppData();
initMessages(appData.messages, appData.lang); // 번역 문장과 지금 언어 넣기. 다른 모듈이 t('키') 를 쓰기 전에.
var meetingPoint = appData.meetingPoint;
var meetingLat = meetingPoint ? meetingPoint.meetingLatitude : null;
var meetingLng = meetingPoint ? meetingPoint.meetingLongitude : null;

var participantList = appData.participants;

var keyword = document.getElementById("keyword").value.trim() || "카페";

const participantsEl = document.getElementById("participants");
initParticipantList(
  participantsEl,
  document.getElementById("addParticipant"),
  document.getElementById("removeParticipant"),
  document.getElementById("participant-template"),
);
initAddressSearch(participantsEl);
initFriendSelect(participantsEl, appData.friends);
initSubmit(document.getElementById("participantForm"), participantsEl);
// 결과 화면에서 언어를 바꾸면 폼을 다시 제출해서 결과를 유지한다. (처음 화면에서는 링크 그대로)
initLangSwitch(
  document.querySelector(".lang-switch"),
  document.getElementById("participantForm"),
  meetingPoint != null,
);

// 지도 생성 및 반환.
var map = createMap(document.getElementById("map"));

// 입력 화면을 열거나 새로고침할 때 현재 위치를 찾는다.
// 결과 화면에서는 중간 지점 지도를 유지하기 위해 현재 위치를 다시 요청하지 않는다.
if (meetingPoint == null) {
  showCurrentLocation(map, document.getElementById("current-location-status"));
}

// 중간 지점이 옮겨졌을 때만 원래 평균 좌표를 넘긴다.
var averagePoint = meetingPoint && meetingPoint.adjusted ? { lat: meetingPoint.averageLatitude, lng: meetingPoint.averageLongitude } : null;
// ── 지도에 참가자 마커와 중간 지점 마커를 표시하고, 지도 범위를 참가자와 중간 지점이 다 보이게 맞춘다. ───────────────────────
var meetingWindow = drawResult(map, meetingLat, meetingLng, participantList, averagePoint);

// ── 중간 지점 말풍선에 주소 표시 ───────────────────────
// 말풍선 내용을 "중간 지점" + 둘째 줄(주소 또는 안내 문구)로 바꾼다.
// textContent 로 넣어서 주소에 특수문자가 있어도 안전하다. (.bAddr 은 현위치 말풍선과 같은 스타일)
function setMeetingWindowText(text) {
  var content = document.createElement("div");
  content.className = "bAddr";

  var title = document.createElement("div");
  title.textContent = t("result.meetingPoint");
  content.appendChild(title);

  var line = document.createElement("div");
  line.textContent = text;
  content.appendChild(line);

  meetingWindow.setContent(content);
}

// 중간 지점 말풍선이 있을 때만 (= 제출한 결과 화면) 주소를 찾는다.
if (meetingWindow) {
  setMeetingWindowText(t("location.addressLoading"));   // 주소 확인 중...
  coordsToAddress(meetingLat, meetingLng)
    .then((address) => setMeetingWindowText(address))
    .catch((error) => {
      setMeetingWindowText(t("location.addressNotFound"));
      console.error(error);
    });
}

// ── 중간 지점 주변 장소 검색 ───────────────────────
if (meetingLat != null) {
  searchNearbyPlaces(map, meetingLat, meetingLng, participantList, keyword);
}
