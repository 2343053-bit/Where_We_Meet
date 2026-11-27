export function readAppData() {
    var appData = window.APP_DATA || {};
    return {
        messages: appData.messages || {},  // JS 용 번역 문장 (fragments/jsMessages.html 이 넣어 줌)
        lang: appData.lang || 'ko'         // 지금 언어 코드
    };
}