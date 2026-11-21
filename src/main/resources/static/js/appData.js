export function readAppData() {
    var appData = window.APP_DATA || {};
    return {
        meetingPoint: appData.meetingPoint || null,
        participants: appData.participants || [],
        messages: appData.messages || {},  // JS 용 번역 문장 (fragments/jsMessages.html 이 넣어 줌). 없으면 빈 사전.
        lang: appData.lang || 'ko'         // 지금 언어 코드 (fragments/jsMessages.html 이 넣어 줌). 없으면 한국어.
    };
}