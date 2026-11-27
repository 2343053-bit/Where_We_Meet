import { addressToCoords } from '../api/geocoder.js';   // participants/ 에서 한 칸 위로
import { t } from '../util/i18n.js';                   // 다국어 처리. t('키', 값) → 사전의 {0} 자리에 값을 채운 문장

// onSubmit(participants) : 좌표 변환이 끝나면 불린다. 서버 요청과 화면 그리기는 부르는 쪽(main.js)이 맡는다.
export function initSubmit(form, participantsEl, onSubmit) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();                       // ← 반드시 첫 줄. await 보다 먼저.
        const fieldsets = [...participantsEl.querySelectorAll("fieldset")];
        const addresses = fieldsets.map((fs) => fs.querySelector(".address").value);

        // 1) 빈 주소 확인 (readonly 칸은 required 검사가 안 되므로 직접)
        const emptyIndex = addresses.findIndex((a) => !a);
        if (emptyIndex !== -1) {
            alert(t('submit.noAddress', emptyIndex + 1));        // 참가자 {0}의 주소를 검색해 주세요.
            return;
        }

        // 2) 모든 주소를 동시에 좌표로 변환
        const results = await Promise.allSettled(addresses.map(addressToCoords));
        const failedIndex = results.findIndex((r) => r.status === "rejected");
        if (failedIndex !== -1) {
            alert(t('submit.addressNotFound', failedIndex + 1)); // 참가자 {0}의 주소를 찾을 수 없습니다.
            return;
        }

        // 3) 서버로 보낼 참가자 목록을 만들어 넘긴다. (페이지를 새로 열지 않는다)
        const participants = fieldsets.map((fs, i) => ({
            participantName: fs.querySelector('input[name$=".participantName"]').value,
            address: addresses[i],
            latitude: results[i].value.lat,
            longitude: results[i].value.lng
        }));

        // 서버 답이 올 때까지 제출 버튼을 잠가서 두 번 보내지 않게 한다.
        const submitButton = form.querySelector('[type="submit"]');
        submitButton.disabled = true;
        Promise.resolve(onSubmit(participants)).finally(() => { submitButton.disabled = false; }); // 서버 답이 오면 다시 잠금 해제

    });
}
