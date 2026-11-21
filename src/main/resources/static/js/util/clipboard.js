// 글자(text)를 클립보드에 복사한다. 성공하면 resolve, 실패하면 reject 하는 Promise 를 돌려준다.
// 공유 버튼(placePanel.js) 말고도 다른 곳에서 복사가 필요하면 이 함수를 가져다 쓴다.
export function copyText(text) {
    // navigator.clipboard : 브라우저의 최신 복사 기능.
    // HTTPS 나 localhost 에서만 쓸 수 있다. (currentLocation.js 의 isSecureContext 검사와 같은 이유)
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    // 팀원이 http://192.168.x.x:8080 처럼 IP 로 접속하면 위 기능이 막혀서, 예전 방식으로 대신 복사한다.
    // 화면 밖에 안 보이는 입력칸을 잠깐 만들어 글자를 넣고, 선택한 뒤 "복사" 명령을 실행하고, 다시 지운다.
    return new Promise(function (resolve, reject) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');                // 모바일에서 키보드가 올라오지 않게.
        textarea.style.position = 'fixed';                    // 화면이 스크롤되지 않게.
        textarea.style.top = '-9999px';                       // 화면 밖으로 숨긴다.
        document.body.appendChild(textarea);
        textarea.select();

        var copied = document.execCommand('copy');            // 복사 성공 여부를 true / false 로 돌려준다.
        document.body.removeChild(textarea);

        if (copied) {
            resolve();
        } else {
            reject(new Error('클립보드에 복사하지 못했습니다.'));
        }
    });
}
