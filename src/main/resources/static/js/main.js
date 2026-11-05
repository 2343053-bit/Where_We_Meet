/* =========================================================
   메인 화면 스크립트
   1. 카카오 지도 로드
   2. 로그인 / 회원가입 모달 (<dialog>)
   3. 참가자 입력란 추가/삭제 (2~5명) + 검색 폼 검증
   ========================================================= */
(function () {
    'use strict';

    // 처음 지도 중심 (서울시청)
    var DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };
    var MIN_PARTICIPANTS = 2;
    var MAX_PARTICIPANTS = 5;

    /* ---------------------------------------------------------
       공통: 지도 위 알림
       --------------------------------------------------------- */
    var toast = document.getElementById('mapToast');
    var toastTimer = null;

    function showToast(message, type) {
        toast.textContent = message;
        toast.className = 'map-toast' + (type === 'error' ? ' error' : '');
        toast.hidden = false;
        clearTimeout(toastTimer);
        if (type !== 'error') {
            toastTimer = setTimeout(function () { toast.hidden = true; }, 5000);
        }
    }

    /* ---------------------------------------------------------
       1. 카카오 지도
       --------------------------------------------------------- */
    var map = null;

    function loadKakaoSdk(appKey) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=' + encodeURIComponent(appKey);
            script.onload = function () {
                if (window.kakao && window.kakao.maps) {
                    window.kakao.maps.load(resolve);
                } else {
                    reject(new Error('kakao.maps 없음'));
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function initMap() {
        var center = new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
        map = new kakao.maps.Map(document.getElementById('map'), { center: center, level: 5 });
        map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
    }

    var appKey = window.KAKAO_JS_KEY;
    if (!appKey) {
        showToast('카카오 JavaScript 키가 설정되지 않았습니다. application-secret.properties 에 kakao.js-key 를 넣어주세요.', 'error');
    } else {
        loadKakaoSdk(appKey)
            .then(initMap)
            .catch(function () {
                showToast('카카오 지도를 불러오지 못했습니다. JavaScript 키와 카카오 개발자 콘솔의 허용 도메인(localhost:8080)을 확인하세요.', 'error');
            });
    }

    /* ---------------------------------------------------------
       2. 로그인 / 회원가입 모달
       - [data-modal="login"] → #loginModal 을 연다.
       - 단독 페이지(/login, /signup)에는 이 스크립트가 없으므로 같은 링크가 일반 이동으로 동작한다.
       --------------------------------------------------------- */
    function openModal(name) {
        var dialog = document.getElementById(name + 'Modal');
        if (!dialog) return false;

        document.querySelectorAll('dialog[open]').forEach(function (d) {
            if (d !== dialog) d.close();
        });
        if (!dialog.open) dialog.showModal();
        return true;
    }

    document.addEventListener('click', function (e) {
        var trigger = e.target.closest('[data-modal]');
        if (trigger && openModal(trigger.getAttribute('data-modal'))) {
            e.preventDefault();
            return;
        }
        var closeBtn = e.target.closest('[data-close]');
        if (closeBtn) {
            closeBtn.closest('dialog').close();
        }
    });

    // 바깥(어두운 배경) 클릭 시 닫기.
    // 입력란 안에서 드래그하다 바깥에서 손을 떼는 경우 닫히지 않도록 누른 위치도 확인한다.
    document.querySelectorAll('dialog.auth-modal').forEach(function (dialog) {
        var pressedOnBackdrop = false;
        dialog.addEventListener('pointerdown', function (e) { pressedOnBackdrop = (e.target === dialog); });
        dialog.addEventListener('click', function (e) {
            if (pressedOnBackdrop && e.target === dialog) dialog.close();
            pressedOnBackdrop = false;
        });
    });

    // 로그인/회원가입 실패 후 /?login=error, /?signup=error 로 돌아오면 모달을 자동으로 다시 연다.
    (function autoOpenFromQuery() {
        var params = new URLSearchParams(location.search);
        var name = params.has('login') ? 'login' : (params.has('signup') ? 'signup' : null);
        if (!name) return;
        openModal(name);
        // 새로고침 시 다시 뜨지 않도록 주소창에서 쿼리를 지운다.
        history.replaceState(null, '', location.pathname);
    })();

    /* ---------------------------------------------------------
       3. 참가자 입력 + 검색 폼
       --------------------------------------------------------- */
    var form = document.getElementById('searchForm');
    var list = document.getElementById('participantList');
    var addBtn = document.getElementById('addParticipant');
    var countLabel = document.getElementById('participantCount');
    var participantError = document.getElementById('participantError');
    var keywordInput = document.getElementById('keyword');
    var keywordError = document.getElementById('keywordError');
    var chips = document.querySelectorAll('.chip');

    function rows() {
        return list.querySelectorAll('.participant-row');
    }

    function refreshParticipants() {
        var all = rows();
        all.forEach(function (row, i) {
            var no = i + 1;
            var input = row.querySelector('input');
            row.querySelector('.participant-no').textContent = no;
            input.placeholder = '참가자 ' + no + ' 출발 위치';
            input.setAttribute('aria-label', '참가자 ' + no + ' 출발 위치');
            row.querySelector('.remove-btn').disabled = all.length <= MIN_PARTICIPANTS;
        });
        addBtn.disabled = all.length >= MAX_PARTICIPANTS;
        addBtn.textContent = all.length >= MAX_PARTICIPANTS ? '최대 5명까지 입력할 수 있어요' : '+ 참가자 추가';
        countLabel.textContent = '(' + all.length + '/' + MAX_PARTICIPANTS + '명)';
    }

    addBtn.addEventListener('click', function () {
        if (rows().length >= MAX_PARTICIPANTS) return;
        var row = rows()[0].cloneNode(true);
        var input = row.querySelector('input');
        input.value = '';
        input.classList.remove('is-invalid');
        list.appendChild(row);
        refreshParticipants();
        input.focus();
    });

    list.addEventListener('click', function (e) {
        var btn = e.target.closest('.remove-btn');
        if (!btn || rows().length <= MIN_PARTICIPANTS) return;
        btn.closest('.participant-row').remove();
        refreshParticipants();
    });

    list.addEventListener('input', function (e) {
        if (e.target.value.trim()) e.target.classList.remove('is-invalid');
    });

    // 장소 종류 빠른 선택
    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            keywordInput.value = chip.getAttribute('data-keyword');
            syncChips();
            keywordInput.classList.remove('is-invalid');
            keywordError.hidden = true;
        });
    });

    function syncChips() {
        var value = keywordInput.value.trim();
        chips.forEach(function (chip) {
            chip.classList.toggle('active', chip.getAttribute('data-keyword') === value);
        });
    }
    keywordInput.addEventListener('input', function () {
        syncChips();
        if (keywordInput.value.trim()) keywordInput.classList.remove('is-invalid');
    });

    function setError(el, message) {
        el.textContent = message || '';
        el.hidden = !message;
    }

    form.addEventListener('submit', function (e) {
        var inputs = list.querySelectorAll('input');
        var firstInvalid = null;
        var emptyCount = 0;

        inputs.forEach(function (input) {
            input.value = input.value.trim();
            var empty = input.value === '';
            input.classList.toggle('is-invalid', empty);
            if (empty) {
                emptyCount++;
                firstInvalid = firstInvalid || input;
            }
        });

        if (inputs.length < MIN_PARTICIPANTS || inputs.length > MAX_PARTICIPANTS) {
            setError(participantError, '참가자는 2명 이상 5명 이하로 입력해 주세요.');
        } else if (emptyCount > 0) {
            setError(participantError, '모든 참가자의 출발 위치를 입력해 주세요.');
        } else {
            setError(participantError, null);
        }

        keywordInput.value = keywordInput.value.trim();
        var keywordEmpty = keywordInput.value === '';
        keywordInput.classList.toggle('is-invalid', keywordEmpty);
        setError(keywordError, keywordEmpty ? '찾을 장소 종류를 입력하거나 선택해 주세요.' : null);
        if (keywordEmpty) firstInvalid = firstInvalid || keywordInput;

        if (firstInvalid || !participantError.hidden) {
            e.preventDefault();
            if (firstInvalid) firstInvalid.focus();
        }
    });

    refreshParticipants();
})();
