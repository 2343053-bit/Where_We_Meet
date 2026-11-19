import { initParticipantList } from "./participants/participantList.js";
import { initAddressSearch } from "./participants/addressSearch.js";
import { initSubmit } from "./participants/submit.js";

const participantsEl = document.getElementById("participants");
initParticipantList(participantsEl, document.getElementById("addParticipant"), document.getElementById("removeParticipant"));
initAddressSearch(participantsEl);
initSubmit(document.getElementById("participantForm"), participantsEl);