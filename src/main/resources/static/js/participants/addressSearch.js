export function initAddressSearch(participantsEl) {
    // ── 주소 검색 버튼 ───────────────────────
    //   버튼마다 이벤트를 붙이지 않고 부모(#participants)에 한 번만 붙였다. (이벤트 위임)
    //   그래서 + 버튼으로 나중에 추가된 참가자의 주소 검색 버튼도 따로 코드 없이 동작한다.
    participantsEl.addEventListener("click", (e) => {
        if (!e.target.classList.contains("searchAddress")) return;                     // 주소 검색 버튼을 누른 게 아니면 무시.
        const addressInput = e.target.closest("fieldset").querySelector(".address");   // 누른 버튼과 같은 참가자 칸의 주소 입력칸.
        new daum.Postcode({                                                            // 주소 검색 팝업 생성.
            oncomplete: (data) => { addressInput.value = data.roadAddress; }           // 주소를 고르면 도로명 주소를 주소 칸에 넣는다.
        }).open();                                                                     // 팝업 열기.
    });

}