export function initParticipantList(participantsEl, addButton, removeButton, template) {
    const minParticipants = 2;
    const maxParticipants = 5;

    function updateButtons() {
        const count = participantsEl.children.length;
        addButton.disabled = count >= maxParticipants;
        removeButton.disabled = count <= minParticipants;
    }

    addButton.addEventListener("click", () => {
        const index = participantsEl.children.length;
        const html = template.innerHTML
            .replaceAll("@INDEX@", index)        // name 의 번호 (0부터)
            .replaceAll("@NUM@", index + 1);     // 화면 번호 (1부터)
        participantsEl.insertAdjacentHTML("beforeend", html);
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