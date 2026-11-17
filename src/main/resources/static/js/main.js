const participants = document.getElementById("participants");
const addButton = document.getElementById("addParticipant");
const removeButton = document.getElementById("removeParticipant");
const minParticipants = 2;
const maxParticipants = 5;

function updateButtons() {
    const count = participants.children.length;
    addButton.disabled = count >= maxParticipants;
    removeButton.disabled = count <= minParticipants;
}

addButton.addEventListener("click", () => {
    const index = participants.children.length;
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = `참가자 ${index + 1}`;
    fieldset.appendChild(legend);

    // + 버튼으로 추가되는 참가자 칸도 위의 고정 칸(참가자 1, 2)과 같은 모양이 되도록 맞췄다.
    // (이름 → 주소 + 주소 검색 버튼 → 숨김 위도 → 숨김 경도)
    // 주소 칸에도 name 이 붙지만 ParticipantLocation 에 address 필드가 없어서 서버에서는 무시된다.
    [
        { property: "participantName", type: "text", placeholder: "이름" },
        { property: "address", type: "text", placeholder: "주소" },
        { property: "latitude", type: "hidden" },
        { property: "longitude", type: "hidden" }
    ].forEach((field) => {
        const input = document.createElement("input");
        input.type = field.type;
        input.name = `participants[${index}].${field.property}`;

        if (field.type !== "hidden") {            // 숨김 칸에는 placeholder 와 required 를 붙이지 않는다.
            input.placeholder = field.placeholder;
            input.required = true;
        }

        fieldset.appendChild(input);

        if (field.property === "address") {       // 주소 칸이면
            input.className = "address";          // 제출 코드가 이 클래스로 찾는다.
            input.readOnly = true;                // 직접 입력 금지

            const searchButton = document.createElement("button");
            searchButton.type = "button";         // 없으면 누를 때 폼이 제출된다.
            searchButton.className = "searchAddress";
            searchButton.textContent = "주소 검색";
            fieldset.appendChild(searchButton);   // 주소 칸 바로 뒤에 버튼
        }

        fieldset.appendChild(document.createTextNode(" "));
    });

    participants.appendChild(fieldset);
    updateButtons();
});

removeButton.addEventListener("click", () => {
    if (participants.children.length > minParticipants) {
        participants.lastElementChild.remove();
        updateButtons();
    }
});

updateButtons();

// ── 제출 시 주소 → 좌표 변환 ───────────────────────
//   화면에서는 주소만 받고, 서버에는 기존처럼 위도·경도를 보낸다.
//   제출 버튼을 누르면 바로 보내지 않고, 참가자마다 주소를 좌표로 바꿔 숨김 칸에 채운 뒤에 제출한다.
//   Geocoder 도 장소 검색처럼 libraries='services' 에 들어 있다.
const form = document.getElementById("participantForm");
const geocoder = new kakao.maps.services.Geocoder(); // 주소 → 좌표 변환 객체 생성.

form.addEventListener("submit", (e) => {
    e.preventDefault();                                   // 일단 제출을 막는다.
    const fieldsets = participants.querySelectorAll("fieldset"); // 참가자 칸 목록. (+/- 로 늘어난 칸 포함)
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

// ── 주소 검색 버튼 ───────────────────────
//   버튼마다 이벤트를 붙이지 않고 부모(#participants)에 한 번만 붙였다. (이벤트 위임)
//   그래서 + 버튼으로 나중에 추가된 참가자의 주소 검색 버튼도 따로 코드 없이 동작한다.
participants.addEventListener("click", (e) => {
    if (!e.target.classList.contains("searchAddress")) return;                     // 주소 검색 버튼을 누른 게 아니면 무시.
    const addressInput = e.target.closest("fieldset").querySelector(".address");   // 누른 버튼과 같은 참가자 칸의 주소 입력칸.
    new daum.Postcode({                                                            // 주소 검색 팝업 생성.
        oncomplete: (data) => { addressInput.value = data.roadAddress; }           // 주소를 고르면 도로명 주소를 주소 칸에 넣는다.
    }).open();                                                                     // 팝업 열기.
});

