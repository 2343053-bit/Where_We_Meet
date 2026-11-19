export function initParticipantList(participantsEl, addButton, removeButton) {
    const minParticipants = 2;
    const maxParticipants = 5;

    function updateButtons() {
        const count = participantsEl.children.length;
        addButton.disabled = count >= maxParticipants;
        removeButton.disabled = count <= minParticipants;
    }

    addButton.addEventListener("click", () => {
        const index = participantsEl.children.length;
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

        participantsEl.appendChild(fieldset);
        updateButtons();
    });

    removeButton.addEventListener("click", () => {
        if (participantsEl.children.length > minParticipants) {
            participantsEl.lastElementChild.remove();
            updateButtons();
        }
    });

    updateButtons();

}