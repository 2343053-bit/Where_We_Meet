import { readAppData } from "./appData.js";
import { createMap } from "./map/createMap.js";
import { showCurrentLocation } from "./map/currentLocation.js";
import { drawResult, clearResult } from "./map/resultMarkers.js";
import { searchNearbyPlaces } from "./map/places.js";
import { showPlaceStatus } from "./map/placePanel.js";
import { initParticipantList } from "./participants/participantList.js";
import { initAddressSearch } from "./participants/addressSearch.js";
import { initFriendSelect } from "./participants/friendSelect.js";
import { initSubmit } from "./participants/submit.js";
import { coordsToAddress } from "./api/geocoder.js";
import { fetchMeetingPoint } from "./api/meetingPointApi.js";
import { initMessages, t } from "./util/i18n.js";
import { initLangSwitch, rememberResult, takeSavedResult } from "./util/langSwitch.js";
import { initGameHub } from "./game/gameHub.js";

var appData = readAppData();
initMessages(appData.messages, appData.lang); // 다른 모듈이 t('키') 를 쓰기 전에.

// ── 참가자 입력칸 ───────────────────────
const participantsEl = document.getElementById("participants");
const participantInputs = initParticipantList(
  participantsEl,
  document.getElementById("addParticipant"),
  document.getElementById("removeParticipant"),
  document.getElementById("participant-template"),
);
initAddressSearch(participantsEl);
initFriendSelect(participantsEl);   // 친구를 고르면 이름·주소 칸을 채운다. (친구 목록은 HTML 의 <option> 에서 읽는다)

// 언어를 바꿀 때 마지막 결과를 저장해서 새 언어 화면에서 다시 그린다. (util/langSwitch.js)
initLangSwitch(document.querySelector(".lang-switch"));

// ── 게임으로 정하기 창 (game/gameHub.js) ───────────────────────
initGameHub();

// ── 지도 ───────────────────────
var map = createMap(document.getElementById("map"));

// ── 제출: 서버에 중간 지점을 묻고, 받은 결과로 지도만 다시 그린다 ───────────────────────
initSubmit(document.getElementById("participantForm"), participantsEl, function (participants) {
  var keyword = document.getElementById("keyword").value.trim() || "카페";
  showPlaceStatus(t("panel.searching"));

  return fetchMeetingPoint(participants)   // return : submit.js 가 끝날 때까지 버튼을 잠가 둔다.
    .then(function (meetingPoint) {
      showResult(meetingPoint, participants, keyword);
    })
    .catch(function (error) {
      console.error(error);
      alert(t("submit.failed"));
    });
});

// ── 처음 열 때: 언어를 바꿔서 다시 열린 거면 이전 결과를 복원, 아니면 현재 위치 표시 ───────────────────────
var saved = takeSavedResult();
if (saved) {
  fillForm(saved.participants, saved.keyword);
  showResult(saved.meetingPoint, saved.participants, saved.keyword);
} else {
  showCurrentLocation(map, document.getElementById("current-location-status"));
}

// 중간 지점 결과 하나를 화면에 그린다. (이전 결과는 먼저 지운다)
function showResult(meetingPoint, participants, keyword) {
  var lat = meetingPoint.meetingLatitude;
  var lng = meetingPoint.meetingLongitude;

  rememberResult({ meetingPoint: meetingPoint, participants: participants, keyword: keyword });
  clearResult();
  showMeetingNotice(meetingPoint);
  showPlaceStatus(t("panel.searching"));

  // 중간 지점이 옮겨졌을 때만 원래 평균 좌표를 넘긴다. (회색 마커)
  var averagePoint = meetingPoint.adjusted
    ? { lat: meetingPoint.averageLatitude, lng: meetingPoint.averageLongitude }
    : null;
  var meetingWindow = drawResult(map, lat, lng, participants, averagePoint);

  // 중간 지점 말풍선에 주소 표시
  setMeetingWindowText(meetingWindow, t("location.addressLoading"));
  coordsToAddress(lat, lng)
    .then(function (address) { setMeetingWindowText(meetingWindow, address); })
    .catch(function (error) {
      setMeetingWindowText(meetingWindow, t("location.addressNotFound"));
      console.error(error);
    });

  searchNearbyPlaces(map, lat, lng, participants, keyword);
}

// 저장해 둔 결과로 입력칸(이름, 주소, 검색어)을 다시 채운다.
function fillForm(participants, keyword) {
  document.getElementById("keyword").value = keyword;
  participantInputs.setCount(participants.length);

  var fieldsets = participantsEl.querySelectorAll("fieldset");
  participants.forEach(function (p, i) {
    fieldsets[i].querySelector('input[name$=".participantName"]').value = p.participantName;
    fieldsets[i].querySelector(".address").value = p.address;
  });
}

// 상단 안내 문구. (옮겨졌을 때 / 옮길 곳을 못 찾았을 때)
function showMeetingNotice(meetingPoint) {
  var adjustedEl = document.getElementById("meeting-notice-adjusted");
  adjustedEl.hidden = !meetingPoint.adjusted;
  if (meetingPoint.adjusted) {
    adjustedEl.textContent = t("meeting.adjusted", meetingPoint.anchorName);
  }
  document.getElementById("meeting-notice-missing").hidden = !meetingPoint.anchorMissing;
}

// 말풍선 내용을 "중간 지점" + 둘째 줄(주소 또는 안내 문구)로 바꾼다. textContent 라 특수문자도 안전하다.
function setMeetingWindowText(meetingWindow, text) {
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