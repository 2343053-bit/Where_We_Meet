export function initParticipantList(participantsEl, addButton, removeButton, template) {
    const minParticipants = 2;
    const maxParticipants = 5;

    function updateButtons() {
        const count = participantsEl.children.length;
        addButton.disabled = count >= maxParticipants;
        removeButton.disabled = count <= minParticipants;
    }

    function addOne() {
        const index = participantsEl.children.length;
        const html = template.innerHTML
            .replaceAll("@INDEX@", index)        // name 의 번호 (0부터)
            .replaceAll("@NUM@", index + 1);     // 화면 번호 (1부터)
        participantsEl.insertAdjacentHTML("beforeend", html);
        updateButtons();
    }

    function removeOne() {
        if (participantsEl.children.length > minParticipants) {
            participantsEl.lastElementChild.remove();
            updateButtons();
        }
    }

    // 입력칸 개수를 n 개로 맞춘다. (언어를 바꾼 뒤 이전 결과를 다시 채울 때 main.js 가 쓴다)
    function setCount(n) {
        while (participantsEl.children.length < Math.min(n, maxParticipants)) addOne();
        while (participantsEl.children.length > Math.max(n, minParticipants)) removeOne();
    }

    addButton.addEventListener("click", addOne);
    removeButton.addEventListener("click", removeOne);
    updateButtons();

    return { setCount };
}