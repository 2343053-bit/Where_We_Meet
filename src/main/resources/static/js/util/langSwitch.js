// 결과 화면(제출 후)에서 언어를 바꿔도 결과가 사라지지 않게 하는 도구.
//
//         결과 화면에서는 링크로 이동하는 대신, 지금 폼을 주소 뒤에 ?lang=값 만 붙여 "다시 제출" 한다.
//         폼 안에는 이미 이름·위도·경도(숨은 칸)·장소 종류·보안 토큰이 채워져 있어서 서버가 같은 결과를 새 언어로 다시 만든다.
//         (서버의 LocaleChangeInterceptor 는 POST 요청 주소의 ?lang= 도 읽는다. config/LocaleConfig.java)

// switchEl  : 언어 링크들을 감싼 요소 (fragments/langSwitch.html 의 .lang-switch)
// form      : 참가자 폼 (#participantForm)
// hasResult : 지금이 결과 화면인지 (중간 지점이 있으면 true)
export function initLangSwitch(switchEl, form, hasResult) {
    if (!switchEl || !form || !hasResult) {
        return;   // 처음 화면이면 링크 그대로 둔다. (새로 열어도 잃을 결과가 없다)
    }

    // 이벤트 위임: 링크마다 붙이지 않고 감싼 요소에 한 번만 붙인 뒤, 눌린 것이 언어 링크인지 확인한다.
    switchEl.addEventListener('click', function (e) {
        var link = e.target.closest('a[data-lang]');   // 눌린 곳에서 가장 가까운 data-lang 링크. 링크가 아니면 null.
        if (!link || !hasAllCoordinates(form)) {
            return;   // 언어 링크가 아니거나, 좌표가 빈 참가자가 있으면(결과 뒤에 + 로 칸을 추가한 경우) 원래 링크대로 이동.
        }
        e.preventDefault();   // 링크 이동을 막는다.

        var action = form.getAttribute('action').split('?')[0];   // 예: "/main" (이미 ?lang= 이 붙어 있으면 떼어 낸다)
        form.setAttribute('action', action + '?lang=' + encodeURIComponent(link.dataset.lang));   // dataset.lang = data-lang 값
        form.submit();   // 폼을 그대로 다시 보낸다. (submit 이벤트를 부르지 않아서 주소→좌표 변환을 다시 하지 않는다)
    });
}

// 모든 참가자의 숨은 위도·경도 칸에 값이 있는지. (하나라도 비면 다시 제출해도 서버가 계산할 수 없다)
function hasAllCoordinates(form) {
    var coords = form.querySelectorAll('input[type="hidden"][name$=".latitude"], input[type="hidden"][name$=".longitude"]');
    for (var i = 0; i < coords.length; i++) {
        if (coords[i].value === '') {
            return false;
        }
    }
    return coords.length > 0;
}
