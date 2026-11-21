// 번역 문장 꺼내기 도구.
//   서버가 fragments/jsMessages.html 에서 지금 언어로 번역한 문장을 window.APP_DATA.messages 에 넣어 주고,
//   시작점(main.js)이 그 값을 initMessages() 로 한 번 넣어 준다. 다른 모듈은 t('키') 로 꺼내 쓴다.
//
//   예) t('route.calculating')   → "승용차 경로 계산 중..."  /  "Calculating car routes..."
//       t('route.minutes', 27)   → "승용차 27분"             /  "27 min by car"

let messages = {};   // 이 파일 안에서만 쓰는 사전.
let lang = 'ko';     // 지금 언어 코드. ("ko", "en") 문장 말고 "언어에 따라 보여 줄 값이 다를 때" 쓴다.

// 사전과 지금 언어를 넣는다. 시작점(main.js)에서 다른 모듈보다 먼저 한 번 부른다.
export function initMessages(newMessages, newLang) {
    messages = newMessages || {};
    lang = newLang || 'ko';
}

// 지금 언어 코드를 돌려준다. 예) 장소 종류: 한국어면 카카오의 자세한 분류, 아니면 번역한 큰 분류. (map/placePanel.js)
export function getLang() {
    return lang;
}

// key 에 해당하는 문장을 돌려준다. {0}, {1} ... 빈칸은 뒤에 넘긴 값으로 차례대로 채운다.
// ...args : 개수가 정해지지 않은 나머지 인자들을 배열로 받는다. (t('route.minutes', 27) 이면 args = [27])
export function t(key, ...args) {
    let text = messages[key] || key;   // 사전에 없으면 키를 그대로 보여 준다. (화면에 키가 보이면 사전이나 jsMessages.html 에 빠진 것)
    args.forEach((value, i) => {
        text = text.replace('{' + i + '}', value);   // {0} 자리에 args[0], {1} 자리에 args[1] ...
    });
    return text;
}
