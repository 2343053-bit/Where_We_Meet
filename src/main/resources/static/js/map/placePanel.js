// 지도 오른쪽 "주변 장소" 패널(fragments/placePanel.html)을 채우는 함수들.
// 값은 전부 textContent 로 넣는다. (innerHTML 을 쓰면 장소 이름 속 <, > 같은 글자가 HTML 로 실행될 수 있다)
import { copyText } from '../util/clipboard.js';   // map/ 에서 한 칸 위로
import { t, getLang } from '../util/i18n.js';      // 다국어 처리. t('키') → 지금 언어의 문장, getLang() → 지금 언어 코드

// 안내 문구를 보여 주고 목록은 비운다. (결과 없음, 오류 등)
export function showPlaceStatus(message) {
    var statusEl = document.getElementById('place-status');
    statusEl.textContent = message;
    statusEl.hidden = false;
    document.getElementById('place-list').replaceChildren();   // 이전 카드 지우기.
}

// 장소 목록(places)을 카드로 만들어 패널에 넣는다. place 하나 = 카카오 장소 검색 결과 1개.
// onSelect       : 카드를 누르면 불리는 함수. 몇 번째 카드인지(i)만 알려 준다.
//                  (이 파일은 지도·마커를 모르게 두고, 누른 뒤 할 일은 부르는 쪽(places.js)이 정한다)
// onAddCandidate : 🎯 버튼을 누르면 불리는 함수. i 를 받고 'added' / 'duplicate' / 'full' 중 하나를 돌려준다.
export function renderPlaceList(places, onSelect, onAddCandidate) {
    var listEl = document.getElementById('place-list');
    var template = document.getElementById('place-card-template');

    listEl.replaceChildren();                                  // 이전 카드 지우기.
    document.getElementById('place-status').hidden = true;     // 결과가 있으니 안내 문구는 숨긴다.

    for (var i = 0; i < places.length; i++) {                  // 장소 수만큼 반복.
        var card = createPlaceCard(template, places[i]);
        card.dataset.index = i;                                // 몇 번째 장소인지 카드에 적어 둔다. (HTML 의 data-index="i")
        listEl.appendChild(card);
    }

    // 카드마다 이벤트를 붙이지 않고 목록(#place-list)에 한 번만 붙인다. (이벤트 위임, addressSearch.js 와 같은 방식)
    // onclick = 으로 넣어서, 검색을 다시 해도 이벤트가 겹겹이 쌓이지 않고 마지막 것으로 바뀐다.
    listEl.onclick = function (e) {
        var shareButton = e.target.closest('.place-card__share');
        if (shareButton) {                                     // 공유 버튼: 주소만 복사하고 지도는 움직이지 않는다.
            shareLink(shareButton);
            return;
        }
        var gameButton = e.target.closest('.place-card__game');
        if (gameButton) {                                      // 🎯 버튼: 게임 후보에만 넣고 지도는 움직이지 않는다.
            var index = Number(gameButton.closest('.place-card').dataset.index);
            showCandidateResult(gameButton, onAddCandidate(index));
            return;
        }
        if (e.target.closest('a')) return;                    // "카카오맵에서 보기" 링크는 새 탭만 열고 지도는 움직이지 않는다.
        var card = e.target.closest('.place-card');            // 누른 곳을 감싸는 카드.
        if (!card) return;                                     // 카드 사이 빈 곳을 누른 경우.
        onSelect(Number(card.dataset.index));                  // data-index 는 글자라서 숫자로 바꿔 넘긴다.
    };
}

// 카드 하나를 목록 밖(게임 결과창)에 보여 줄 때 쓴다. (game/gameHub.js)
// 목록의 이벤트 위임(#place-list 의 onclick)이 닿지 않으므로, 🎯 버튼은 빼고 공유 버튼에는 이벤트를 직접 붙인다.
export function createStandalonePlaceCard(place) {
    var card = createPlaceCard(document.getElementById('place-card-template'), place);
    card.querySelector('.place-card__game').remove();
    var shareButton = card.querySelector('.place-card__share');
    shareButton.addEventListener('click', function () {
        shareLink(shareButton);
    });
    return card;
}

// 🎯 버튼의 결과(gameHub.js 의 addCandidate 가 돌려준 글자)를 버튼에 잠깐 보여 준다.
function showCandidateResult(button, result) {
    var messageKey = {
        added: 'game.added',
        duplicate: 'game.duplicate',
        full: 'game.full'
    }[result];
    if (messageKey) flashButtonText(button, t(messageKey), '🎯');
}

// 공유 버튼의 data-url 을 클립보드에 복사하고, 결과를 버튼 글자로 잠깐 알려 준다.
function shareLink(button) {
    copyText(button.dataset.url)
        .then(function () {
            flashButtonText(button, t('panel.copied'), t('panel.share'));
        })
        .catch(function (error) {
            flashButtonText(button, t('panel.copyFailed'), t('panel.share'));
            console.error(error);
        });
}

// 버튼 글자를 1.5초 동안 message 로 바꿨다가 originalText 로 되돌린다.
//   공유 버튼은 t('panel.share') (HTML 과 같은 키라서 언어가 바뀌어도 같은 글자), 🎯 버튼은 '🎯'.
function flashButtonText(button, message, originalText) {
    button.textContent = message;
    clearTimeout(button.resetTimer);                           // 연달아 누르면 이전 타이머를 취소해서 글자가 꼬이지 않게.
    button.resetTimer = setTimeout(function () {
        button.textContent = originalText;
    }, 1500);
}

// template 을 복제해서 장소 하나의 카드를 만든다.
function createPlaceCard(template, place) {
    var card = template.content.firstElementChild.cloneNode(true);   // template 안의 <li> 를 통째로 복사. (true = 안쪽 태그까지)

    card.querySelector('.place-card__name').textContent = place.place_name;
    card.querySelector('.place-card__category').textContent = getCategoryText(place);   // 한국어: 음식점 > 카페 > 커피전문점 / 영어: Cafe
    card.querySelector('.place-card__address').textContent =
        place.road_address_name || place.address_name;                // 도로명 주소가 없으면 지번 주소.
    card.querySelector('.place-card__distance').textContent =
        t('panel.distance', formatDistance(place.distance));         // 중간 지점에서 {0} → "중간 지점에서 350m" / "350m from the midpoint"

    // 전화번호는 없는 가게가 많아서, 없으면 그 줄을 지운다.
    var phoneEl = card.querySelector('.place-card__phone');
    if (place.phone) {
        phoneEl.textContent = place.phone;
    } else {
        phoneEl.remove();
    }

    // 카카오맵 상세 페이지 주소. 카카오가 http:// 로 주기 때문에 https:// 로 바꿔서 쓴다. (공유받는 사람에게도 안전한 주소)
    var placeUrl = place.place_url.replace(/^http:/, 'https:');
    card.querySelector('.place-card__link').href = placeUrl;
    card.querySelector('.place-card__share').dataset.url = placeUrl;  // 공유 버튼이 복사할 주소. (HTML 의 data-url)

    // 사진과 사진 링크. 사진을 눌러도 카카오맵 상세 페이지가 열리도록 링크 주소를 똑같이 넣는다.
    var photoLink = card.querySelector('.place-card__photo-link');
    photoLink.href = placeUrl;
    photoLink.setAttribute('aria-label', t('panel.photoLabel', place.place_name));   // 화면 낭독기가 읽어 줄 링크 이름. ({0} = 장소 이름)
    card.querySelector('.place-card__photo').src = getPlaceImage(place);
    return card;
}

// 장소 종류 글자.
//   카카오의 category_name("음식점 > 카페 > 커피전문점")은 종류가 너무 많아 번역할 수 없다.
//   그래서 한국어 화면은 그대로 자세히 보여 주고, 다른 언어는 큰 분류 코드(category_group_code, 18개)를 번역해서 보여 준다.
function getCategoryText(place) {
    var code = place.category_group_code;   // 예) "CE7". 카카오 결과에서 빈 값("")인 장소도 있다.
    if (getLang() === 'ko' || !code) {
        return place.category_name;          // 한국어 화면이거나 코드가 없으면 카카오 글자 그대로.
    }
    var key = 'category.' + code;           // 예) "category.CE7" → 사전에서 "Cafe"
    var text = t(key);
    return text === key ? place.category_name : text;   // t() 는 사전에 없는 키면 키를 그대로 돌려준다. 그때는 카카오 글자로.
}

// 카테고리별 기본 이미지. 키는 카카오의 category_group_code. (CE7 = 카페, FD6 = 음식점)
// 다른 카테고리 이미지를 추가하려면 /images/places/ 에 그림을 넣고 여기에 한 줄 추가한다.
var PLACE_IMAGES = {
    CE7: '/images/places/cafe.svg',
    FD6: '/images/places/restaurant.svg'
};

// 장소의 카테고리에 맞는 기본 이미지 주소를 돌려준다. 목록에 없는 카테고리(또는 코드가 빈 장소)는 default.
// 나중에 실제 사진(카카오 이미지 검색 등)으로 바꿀 때는 이 함수만 고치면 된다.
function getPlaceImage(place) {
    return PLACE_IMAGES[place.category_group_code] || '/images/places/default.svg';
}

// 카카오가 주는 거리(m, 글자)를 보기 좋게 바꾼다. 예) "350" → "350m", "1234" → "1.2km"
function formatDistance(distance) {
    var meters = Number(distance);
    if (meters < 1000) {
        return meters + 'm';
    }
    return (meters / 1000).toFixed(1) + 'km';
}
