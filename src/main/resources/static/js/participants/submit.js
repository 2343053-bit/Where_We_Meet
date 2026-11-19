import { addressToCoords } from '../api/geocoder.js';   // participants/ 에서 한 칸 위로

export function initSubmit(form, participantsEl) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();                       // ← 반드시 첫 줄. await 보다 먼저.
        const fieldsets = [...participantsEl.querySelectorAll("fieldset")];
        const addresses = fieldsets.map((fs) => fs.querySelector(".address").value);

        // 1) 빈 주소 확인 (readonly 칸은 required 검사가 안 되므로 직접)
        const emptyIndex = addresses.findIndex((a) => !a);
        if (emptyIndex !== -1) {
            alert(`참가자 ${emptyIndex + 1}의 주소를 검색해 주세요.`);
            return;
        }

        // 2) 모든 주소를 동시에 좌표로 변환
        const results = await Promise.allSettled(addresses.map(addressToCoords));
        const failedIndex = results.findIndex((r) => r.status === "rejected");
        if (failedIndex !== -1) {
            alert(`참가자 ${failedIndex + 1}의 주소를 찾을 수 없습니다.`);
            return;
        }

        // 3) 숨김 칸 채우고 진짜 제출
        results.forEach((r, i) => {
            fieldsets[i].querySelector(`[name="participants[${i}].latitude"]`).value = r.value.lat;
            fieldsets[i].querySelector(`[name="participants[${i}].longitude"]`).value = r.value.lng;
        });
        form.submit();   // submit 이벤트를 다시 부르지 않아서 무한 반복되지 않는다.
    });
}
