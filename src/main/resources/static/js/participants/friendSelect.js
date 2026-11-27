export function initFriendSelect(participantsEl, friends = []) {
  if (!participantsEl) return;

  function syncFriendOptions() {
    const selects = Array.from(participantsEl.querySelectorAll(".friend-select"));
    const chosenValues = new Set(
      selects.map((sel) => sel.value).filter((val) => val !== "")
    );

    selects.forEach((sel) => {
      const currentVal = sel.value;
      Array.from(sel.options).forEach((opt) => {
        if (!opt.value) return;
        opt.disabled = opt.value !== currentVal && chosenValues.has(opt.value);
      });
    });
  }

  participantsEl.addEventListener("change", (event) => {
    const select = event.target.closest(".friend-select");
    if (!select) return;

    syncFriendOptions();

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

  const observer = new MutationObserver(() => {
    syncFriendOptions();
  });
  observer.observe(participantsEl, { childList: true, subtree: true });

  syncFriendOptions();
}