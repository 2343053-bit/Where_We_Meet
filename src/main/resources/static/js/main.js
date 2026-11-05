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

    // 참가자 한 줄의 입력칸: 클래스 → 서버로 보낼 필드 이름 / 화면 표시 이름
    // key 는 domain/ParticipantLocation 의 필드 이름과 같아야 서버에서 바로 받을 수 있다.
    var PARTICIPANT_FIELDS = [
        { cls: 'participant-name', key: 'participantName', label: '이름' },
        { cls: 'participant-lat',  key: 'latitude',        label: '위도' },
        { cls: 'participant-lng',  key: 'longitude',       label: '경도' }
    ];

    // 추가/삭제 후 번호, name(participants[i].필드), aria-label 을 다시 매긴다.
    function refreshParticipants() {
        var all = rows();
        all.forEach(function (row, i) {
            var no = i + 1;
            row.querySelector('.participant-no').textContent = no;
            PARTICIPANT_FIELDS.forEach(function (field) {
                var input = row.querySelector('.' + field.cls);
                input.name = 'participants[' + i + '].' + field.key;
                input.setAttribute('aria-label', '참가자 ' + no + ' ' + field.label);
            });
            var removeBtn = row.querySelector('.remove-btn');
            removeBtn.setAttribute('aria-label', '참가자 ' + no + ' 삭제');
            removeBtn.disabled = all.length <= MIN_PARTICIPANTS;
        });
        addBtn.disabled = all.length >= MAX_PARTICIPANTS;
        addBtn.textContent = all.length >= MAX_PARTICIPANTS ? '최대 5명까지 입력할 수 있어요' : '+ 참가자 추가';
        countLabel.textContent = '(' + all.length + '/' + MAX_PARTICIPANTS + '명)';
    }

    addBtn.addEventListener('click', function () {
        if (rows().length >= MAX_PARTICIPANTS) return;
        var row = rows()[0].cloneNode(true);
        row.querySelectorAll('input').forEach(function (input) {
            input.value = '';
            input.classList.remove('is-invalid');
        });
        list.appendChild(row);
        refreshParticipants();
        row.querySelector('.participant-name').focus();
    });

    list.addEventListener('click', function (e) {
        var btn = e.target.closest('.remove-btn');
        if (!btn || rows().length <= MIN_PARTICIPANTS) return;
        btn.closest('.participant-row').remove();
        refreshParticipants();
    });

    // 빨간 표시가 된 칸을 고치면, 값이 올바를 때만 표시를 지운다.
    list.addEventListener('input', function (e) {
        var input = e.target;
        if (!input.classList.contains('is-invalid')) return;
        var valid = input.classList.contains('participant-lat') ? isValidCoordinate(input.value, 90)
                  : input.classList.contains('participant-lng') ? isValidCoordinate(input.value, 180)
                  : input.value.trim() !== '';
        if (valid) input.classList.remove('is-invalid');
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

    // 위도는 -90 ~ 90, 경도는 -180 ~ 180 범위의 숫자여야 한다.
    function isValidCoordinate(raw, limit) {
        if (raw.trim() === '') return false;
        var n = Number(raw);
        return isFinite(n) && Math.abs(n) <= limit;
    }

    form.addEventListener('submit', function (e) {
        var participantRows = rows();
        var firstInvalid = null;
        var nameMissing = false;
        var latInvalid = false;
        var lngInvalid = false;

        function mark(input, invalid) {
            input.classList.toggle('is-invalid', invalid);
            if (invalid) firstInvalid = firstInvalid || input;
            return invalid;
        }

        participantRows.forEach(function (row) {
            var nameInput = row.querySelector('.participant-name');
            var latInput = row.querySelector('.participant-lat');
            var lngInput = row.querySelector('.participant-lng');

            nameInput.value = nameInput.value.trim();
            if (mark(nameInput, nameInput.value === '')) nameMissing = true;
            if (mark(latInput, !isValidCoordinate(latInput.value, 90))) latInvalid = true;
            if (mark(lngInput, !isValidCoordinate(lngInput.value, 180))) lngInvalid = true;
        });

        var messages = [];
        if (participantRows.length < MIN_PARTICIPANTS || participantRows.length > MAX_PARTICIPANTS) {
            messages.push('참가자는 2명 이상 5명 이하로 입력해 주세요.');
        }
        if (nameMissing) messages.push('모든 참가자의 이름을 입력해 주세요.');
        if (latInvalid) messages.push('위도는 -90 ~ 90 사이의 숫자로 입력해 주세요. (예: 37.5665)');
        if (lngInvalid) messages.push('경도는 -180 ~ 180 사이의 숫자로 입력해 주세요. (예: 126.9780)');
        setError(participantError, messages.join('\n') || null);

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
