// 우리 서버 주소 앞에 공통 경로(context-path)를 붙인다.
//   appUrl('api/route/car/path') → "/where-we-meet/api/route/car/path"
//   공통 경로는 서버가 fragments/jsMessages.html 에서 window.APP_DATA.contextPath 로 넣어 준다.
//   (JS 파일은 Thymeleaf 를 거치지 않아서 @{...} 를 쓸 수 없다. i18n.js 의 번역 문장과 같은 방식)
// 카카오처럼 다른 사이트 주소(https://...)에는 쓰지 않는다.
export function appUrl(path) {
    var base = (window.APP_DATA && window.APP_DATA.contextPath) || '/';   // 없으면 "/" (공통 경로가 없을 때와 같음)
    return base + path.replace(/^\//, '');                                // path 앞의 "/" 는 떼고 붙인다. (// 가 되지 않게)
}