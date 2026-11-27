// 결과 화면에서 언어를 바꿔도 결과가 사라지지 않게 하는 도구.
//   1) main.js 가 결과를 그릴 때마다 rememberResult() 로 마지막 결과를 알려 준다.
//   2) 언어 링크(data-lang)를 누르면 그 결과를 sessionStorage 에 저장하고, 링크대로 이동한다. (?lang=en)
//   3) 새 언어로 열린 페이지에서 main.js 가 takeSavedResult() 로 꺼내 다시 그린다. (서버를 다시 부르지 않는다)
// sessionStorage : 탭을 닫으면 사라지는 브라우저 저장소. 개인 정보 보호 모드 등에서는 막힐 수 있어서 try 로 감싼다.

const STORAGE_KEY = 'whereWeMeet.lastResult';
let lastResult = null;   // 마지막으로 그린 결과. { meetingPoint, participants, keyword }

export function rememberResult(result) {
    lastResult = result;
}

// switchEl : 언어 링크들을 감싼 요소 (fragments/langSwitch.html 의 .lang-switch)
export function initLangSwitch(switchEl) {
    if (!switchEl) return;

    // 이벤트 위임: 감싼 요소에 한 번만 붙이고, 눌린 것이 언어 링크인지 확인한다.
    switchEl.addEventListener('click', function (e) {
        const link = e.target.closest('a[data-lang]');
        if (!link || !lastResult) return;   // 언어 링크가 아니거나 아직 결과가 없으면 링크 그대로.
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lastResult));
        } catch (error) {
            console.error(error);           // 저장에 실패해도 언어 전환은 그대로 된다. (결과만 사라짐)
        }
        // preventDefault 를 하지 않으므로 링크대로 이동한다.
    });
}

// 저장된 결과를 꺼내고 지운다. 없으면 null. (새로고침했을 때 다시 그려지지 않게 한 번만 쓴다)
export function takeSavedResult() {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        return null;
    }
}