// 회원탈퇴 버튼을 누르면 확인창을 먼저 띄운다. (templates/mypage.html 의 #delete-account-form)
const deleteForm = document.getElementById("delete-account-form");

if (deleteForm) {
    deleteForm.addEventListener("submit", function (e) {
        // deleteForm.dataset.confirm : HTML 의 data-confirm 속성 값.
        if (!confirm(deleteForm.dataset.confirm)) {
            e.preventDefault(); // 취소를 누르면 폼 전송을 막는다. → 탈퇴되지 않음
        }
    });
}
