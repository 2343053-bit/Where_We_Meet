export function initSubmit(form, participantsEl) {
    // ── 제출 시 주소 → 좌표 변환 ───────────────────────
    //   화면에서는 주소만 받고, 서버에는 기존처럼 위도·경도를 보낸다.
    //   제출 버튼을 누르면 바로 보내지 않고, 참가자마다 주소를 좌표로 바꿔 숨김 칸에 채운 뒤에 제출한다.
    //   Geocoder 도 장소 검색처럼 libraries='services' 에 들어 있다.
    const geocoder = new kakao.maps.services.Geocoder(); // 주소 → 좌표 변환 객체 생성.

    form.addEventListener("submit", (e) => {
        e.preventDefault();                                   // 일단 제출을 막는다.
        const fieldsets = participantsEl.querySelectorAll("fieldset"); // 참가자 칸 목록. (+/- 로 늘어난 칸 포함)
        let done = 0;                                                // 좌표 변환이 끝난 참가자 수.
        let failed = false;                                          // 한 명이라도 실패하면 true → 제출하지 않고, 알림도 한 번만 띄운다.

        fieldsets.forEach((fs, i) => {
            const address = fs.querySelector(".address").value;
            if (!address) {                                     // readonly 칸은 required 검사가 안 되므로 직접 확인.
                if (!failed) alert(`참가자 ${i + 1}의 주소를 검색해 주세요.`);
                failed = true;
                return;
            }
            geocoder.addressSearch(address, (result, status) => {   // 비동기: 결과가 나중에 온다.
                if (failed) return;
                if (status !== kakao.maps.services.Status.OK) {
                    failed = true;
                    alert(`참가자 ${i + 1}의 주소를 찾을 수 없습니다.`);
                    return;
                }
                fs.querySelector(`[name="participants[${i}].latitude"]`).value = result[0].y; // y = 위도
                fs.querySelector(`[name="participants[${i}].longitude"]`).value = result[0].x; // x = 경도
                done++;
                if (done === fieldsets.length) form.submit();     // 전부 끝나면 진짜 제출. (form.submit() 은 submit 이벤트를 다시 부르지 않아서 무한 반복되지 않는다.)
            });
        });
    });

}