export function initFriendSelect(participantsEl, friends = []) {
  if (!participantsEl) return;

  // 필요 시 appData.friends로 옵션을 보강할 수 있도록 friends 인자를 받습니다.
  participantsEl.addEventListener("change", (event) => {
    const select = event.target.closest(".friend-select");
    if (!select) return;

    const option = select.selectedOptions[0];
    if (!option || !option.value) return;

    const fieldset = select.closest("fieldset");
    if (!fieldset) return;

    const nameInput = fieldset.querySelector('input[name$=".participantName"]');
    const addressInput = fieldset.querySelector("input.address");

    const friendName = option.dataset.name || option.dataset.nickname || "";
    const friendAddress = option.dataset.address || "";

    if (nameInput) {
      nameInput.value = friendName;
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nameInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (addressInput) {
      addressInput.value = friendAddress;
      addressInput.dispatchEvent(new Event("input", { bubbles: true }));
      addressInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}