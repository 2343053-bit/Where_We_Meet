const profileImageInput = document.getElementById("profileImage");
const profileImagePreview = document.getElementById("profileImagePreview");
let previewUrl = null;

profileImageInput.addEventListener("change", () => {
    const selectedFile = profileImageInput.files[0];
    if (!selectedFile) {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }
        profileImagePreview.removeAttribute("src");
        profileImagePreview.style.display = "none";
        return;
    }

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(selectedFile);
    profileImagePreview.src = previewUrl;
    profileImagePreview.style.display = "";
});