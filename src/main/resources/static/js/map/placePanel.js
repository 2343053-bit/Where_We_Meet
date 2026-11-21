// 지도 오른쪽 "주변 장소" 패널(fragments/placePanel.html)을 채우는 함수들.
// 값은 전부 textContent 로 넣는다. (innerHTML 을 쓰면 장소 이름 속 <, > 같은 글자가 HTML 로 실행될 수 있다)

// 안내 문구를 보여 주고 목록은 비운다. (결과 없음, 오류 등)
export function showPlaceStatus(message) {
    var statusEl = document.getElementById('place-status');
    statusEl.textContent = message;
    statusEl.hidden = false;
    document.getElementById('place-list').replaceChildren();   // 이전 카드 지우기.
}

// 장소 목록(places)을 카드로 만들어 패널에 넣는다. place 하나 = 카카오 장소 검색 결과 1개.
export function renderPlaceList(places) {
    var listEl = document.getElementById('place-list');
    var template = document.getElementById('place-card-template');

    listEl.replaceChildren();                                  // 이전 카드 지우기.
    document.getElementById('place-status').hidden = true;     // 결과가 있으니 안내 문구는 숨긴다.

    for (var i = 0; i < places.length; i++) {                  // 장소 수만큼 반복.
        listEl.appendChild(createPlaceCard(template, places[i]));
    }
}

// template 을 복제해서 장소 하나의 카드를 만든다.
function createPlaceCard(template, place) {
    var card = template.content.firstElementChild.cloneNode(true);   // template 안의 <li> 를 통째로 복사. (true = 안쪽 태그까지)

    card.querySelector('.place-card__name').textContent = place.place_name;
    card.querySelector('.place-card__category').textContent = place.category_name;
    card.querySelector('.place-card__address').textContent =
        place.road_address_name || place.address_name;                // 도로명 주소가 없으면 지번 주소.
    card.querySelector('.place-card__distance').textContent =
        '중간 지점에서 ' + formatDistance(place.distance);

    // 전화번호는 없는 가게가 많아서, 없으면 그 줄을 지운다.
    var phoneEl = card.querySelector('.place-card__phone');
    if (place.phone) {
        phoneEl.textContent = place.phone;
    } else {
        phoneEl.remove();
    }

    card.querySelector('.place-card__link').href = place.place_url;   // 카카오맵 상세 페이지 주소.
    return card;
}

// 카카오가 주는 거리(m, 글자)를 보기 좋게 바꾼다. 예) "350" → "350m", "1234" → "1.2km"
function formatDistance(distance) {
    var meters = Number(distance);
    if (meters < 1000) {
        return meters + 'm';
    }
    return (meters / 1000).toFixed(1) + 'km';
}
