const addressInput = document.getElementById("address");
const searchAddressButton = document.getElementById("searchAddress");

searchAddressButton.addEventListener("click", () => {
    new daum.Postcode({
        oncomplete: (data) => {
            addressInput.value = data.roadAddress || data.jibunAddress || data.address;
        }
    }).open();
});
