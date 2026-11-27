// "게임으로 정하기" 공통 게이트. (창 모양은 fragments/gameHub.html)
//
//   ① 입력 : 장소 패널에서 고른 장소를 후보로 모은다. (addCandidate)
//   ② 게임 : 고른 게임에 후보 "이름 목록"만 넘겨서 실행한다. 게임은 당첨 번호만 돌려준다.
//   ③ 출력 : 당첨 장소를 결과창("여기 어때?")에 보여 주고, [여기로 가기]를 누르면 바깥에 알려 준다.
//
//   이 파일은 지도를 모른다. 당첨 뒤 지도를 옮기는 일은 setGameResultHandler 로 받은 함수가 한다. (map/places.js)
//   각 게임의 속사정도 모른다. 게임은 아래 "게임 규약"만 지키면 GAMES 에 한 줄 추가로 붙는다.
//
// ── 게임 규약 (game/games/*.js) ──
//   export default {
//     id: 'roulette',              // 게임 이름표 (영어)
//     labelKey: 'game.roulette',   // 탭에 보일 글자의 번역 키
//     minCount: 2,                 // 최소 후보 수
//     maxCount: 8,                 // 최대 후보 수 (화면에 다 그릴 수 있는 만큼)
//     mount: function (container, names, onFinish) {},   // container(빈 div) 안에만 그린다. 끝나면 onFinish(당첨 번호) 한 번.
//     unmount: function () {}                            // 타이머·애니메이션·이벤트를 전부 정리하고 container 를 비운다.
//   };
import { t } from '../util/i18n.js';
import { createStandalonePlaceCard } from '../map/placePanel.js';
import lottery from './games/lottery.js';

var GAMES = [lottery];      // 탭 순서. 새 게임은 import 하고 여기에 추가한다.
var MAX_CANDIDATES = 8;     // 후보는 최대 8개. (룰렛 칸이 더 많으면 글자가 안 보인다)
var NARROW_SCREEN = '(max-width: 700px)';   // 좁은 화면 기준. main.css·game.css 의 @media 와 같은 값.

var candidates = [];        // 후보들. { index: 검색 결과에서 몇 번째인지, place: 카카오 장소 객체 }
var currentGame = GAMES[0]; // 지금 고른 게임.
var mountedGame = null;     // 지금 화면에 그려져 있는 게임. (탭을 바꾸면 currentGame 이 먼저 바뀌므로 따로 기억해야 옛 게임을 정리할 수 있다)
var playId = 0;             // 게임을 시작할 때마다 1씩 늘린다. 이미 끝난(또는 바뀐) 게임이 늦게 onFinish 를 불러도 무시하려고.
var winner = null;          // 당첨된 후보.
var onResult = function () {};   // [여기로 가기]를 누르면 부를 함수. (setGameResultHandler 로 바꾼다)

var els = {};               // 자주 쓰는 태그들. initGameHub 에서 한 번 찾아 둔다.
var shootConfetti = null;   // 색종이 터뜨리는 함수. (canvas-confetti 라이브러리, main.html 에서 불러온다. 못 불러오면 null → 효과만 생략)

// 창과 버튼에 이벤트를 붙인다. 페이지에서 한 번만 부른다. (main.js)
export function initGameHub() {
    els = {
        dialog: document.getElementById('game-hub'),
        openButton: document.getElementById('game-hub-open'),
        count: document.getElementById('game-hub-count'),
        candidateList: document.getElementById('game-candidates'),
        candidateEmpty: document.getElementById('game-candidates-empty'),
        tabs: document.getElementById('game-tabs'),
        stage: document.getElementById('game-stage'),
        stageStatus: document.getElementById('game-stage-status'),
        result: document.getElementById('game-result'),
        resultPlace: document.getElementById('game-result-place'),
        goButton: document.getElementById('game-result-go'),
        retryButton: document.getElementById('game-result-retry')
    };

    // 색종이를 창 안의 캔버스에 그리도록 만든다.
    //   resize: 창 크기가 바뀌면 캔버스도 맞춘다. / disableForReducedMotion: "동작 줄이기"를 켠 사용자에겐 터뜨리지 않는다.
    if (typeof window.confetti === 'function') {
        shootConfetti = window.confetti.create(document.getElementById('game-confetti'), {
            resize: true,
            disableForReducedMotion: true
        });
    }

    els.openButton.addEventListener('click', openGameHub);

    // show() 로 연 창은 브라우저가 ESC 로 닫아 주지 않는다. 그래서 직접 닫는다.
    // (패널의 🎯 를 누른 뒤라 포커스가 창 밖에 있어도 닫히게 document 에 붙인다. showModal 일 때 겹쳐 불려도 close() 는 한 번만 된다)
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && els.dialog.open) {
            els.dialog.close();
        }
    });

    // ×, ESC, clearCandidates 등 어떤 방법으로 닫혀도 이 이벤트 하나에서 게임을 정리한다.
    els.dialog.addEventListener('close', function () {
        stopGame();
        hideResult();
        if (shootConfetti) shootConfetti.reset();   // 날아가던 색종이도 지운다.
    });

    // 후보의 × 버튼. 버튼마다 붙이지 않고 목록에 한 번만 붙인다. (이벤트 위임, placePanel.js 와 같은 방식)
    els.candidateList.addEventListener('click', function (e) {
        var removeButton = e.target.closest('.game-candidate__remove');
        if (!removeButton) return;
        removeCandidate(Number(removeButton.dataset.index));
    });

    // 게임 탭. 누르면 그 게임으로 바꿔서 처음부터 시작한다.
    els.tabs.addEventListener('click', function (e) {
        var tab = e.target.closest('[data-game]');
        if (!tab) return;
        currentGame = GAMES.find(function (game) { return game.id === tab.dataset.game; });
        startGame();
    });

    els.goButton.addEventListener('click', function () {
        var chosen = winner;              // close 이벤트가 winner 를 지우기 전에 잡아 둔다.
        els.dialog.close();               // 창을 먼저 닫아야 지도가 움직이는 게 보인다.
        onResult(chosen.index);
    });

    els.retryButton.addEventListener('click', startGame);

    updateCount();
}

// 당첨 장소로 [여기로 가기]를 눌렀을 때 부를 함수를 정한다. 함수는 후보의 index(검색 결과에서 몇 번째인지)를 받는다.
// 검색할 때마다 새 함수로 덮어쓴다. (이벤트를 새로 붙이는 게 아니라서 겹겹이 쌓이지 않는다)
export function setGameResultHandler(handler) {
    onResult = handler;
}

// 장소를 후보에 넣는다. 결과를 글자로 돌려줘서 부르는 쪽이 안내 문구를 고를 수 있게 한다.
//   'added' : 추가됨 / 'duplicate' : 이미 있음 / 'full' : 꽉 참
export function addCandidate(index, place) {
    var exists = candidates.some(function (c) { return c.index === index; });
    if (exists) return 'duplicate';
    if (candidates.length >= MAX_CANDIDATES) return 'full';

    candidates.push({ index: index, place: place });
    updateCount();
    if (els.dialog && els.dialog.open) {   // 창을 열어 둔 채로 추가했으면 목록을 바로 고치고, 늘어난 후보로 게임을 다시 시작한다.
        renderCandidates();
        startGame();
    }
    return 'added';
}

// 후보를 모두 지운다. 새로 검색하면 index 가 다른 장소를 가리키게 되므로 꼭 불러야 한다. (map/places.js)
export function clearCandidates() {
    candidates = [];
    updateCount();
    if (els.dialog && els.dialog.open) {
        els.dialog.close();
    }
}

// 창을 열고 지금 게임을 시작한다.
//   넓은 화면 : show()      → 창이 떠 있어도 패널·지도를 누를 수 있다. (🎯 로 후보를 바로바로 추가)
//   좁은 화면 : showModal() → 창이 화면 가득이라 패널이 어차피 안 보이므로, 뒤를 막고 배경을 어둡게.
export function openGameHub() {
    if (els.dialog.open) return;
    renderCandidates();
    if (window.matchMedia(NARROW_SCREEN).matches) {
        els.dialog.showModal();
    } else {
        els.dialog.show();
    }
    startGame();
}

// ── 게임 실행 ───────────────────────

// 지금 게임을 처음부터 시작한다. (탭 변경, 다시 하기, 후보 삭제 때도 이걸 부른다)
function startGame() {
    stopGame();
    hideResult();
    renderTabs();

    var game = currentGame;
    var names = candidates.map(function (c) { return c.place.place_name; });

    if (names.length < game.minCount) {
        showStageStatus(t('game.needMore', game.minCount));
        return;
    }
    if (names.length > game.maxCount) {
        showStageStatus(t('game.tooMany', game.maxCount));
        return;
    }

    els.stageStatus.hidden = true;
    var myPlayId = ++playId;   // 이번 게임 번호.
    mountedGame = game;
    try {
        game.mount(els.stage, names, function (winnerIndex) {
            if (myPlayId !== playId) return;   // 이미 끝났거나 다른 게임으로 바뀐 뒤에 온 결과는 버린다.
            finishGame(winnerIndex);
        });
    } catch (error) {                          // 게임 하나가 고장 나도 창 전체가 멈추지 않게.
        console.error(error);
        stopGame();
        showStageStatus(t('game.failed'));
    }
}

// 그려져 있는 게임을 정리한다.
function stopGame() {
    playId++;                  // 정리한 게임이 늦게 onFinish 를 불러도 무시되게.
    if (mountedGame) {
        var game = mountedGame;
        mountedGame = null;
        try {
            game.unmount();
        } catch (error) {
            console.error(error);
        }
    }
    els.stage.replaceChildren();   // 게임이 덜 지웠어도 다음 게임은 빈 화면에서 시작하게.
}

// 게임이 당첨 번호를 알려 줬을 때. 게임 화면(마지막 모습)은 그대로 두고 그 밑에 결과창을 띄운다.
function finishGame(winnerIndex) {
    var isValid = Number.isInteger(winnerIndex) && winnerIndex >= 0 && winnerIndex < candidates.length;
    if (!isValid) {
        console.error('게임이 잘못된 당첨 번호를 보냈습니다:', winnerIndex);
        return;
    }
    playId++;                  // onFinish 는 한 번만. 같은 게임이 또 불러도 무시된다.
    winner = candidates[winnerIndex];
    showResult(winner.place);
}

// ── 화면 그리기 ───────────────────────

// 열기 버튼의 후보 개수 표시. 0개면 숨긴다.
function updateCount() {
    if (!els.count) return;    // initGameHub 전에 불린 경우.
    els.count.textContent = candidates.length;
    els.count.hidden = candidates.length === 0;
}

// 창 안의 후보 목록. 이름은 textContent 로 넣는다. (placePanel.js 와 같은 이유)
function renderCandidates() {
    els.candidateList.replaceChildren();
    els.candidateEmpty.hidden = candidates.length > 0;

    candidates.forEach(function (c, i) {
        var li = document.createElement('li');
        li.className = 'game-candidate';

        var name = document.createElement('span');
        name.textContent = c.place.place_name;

        var removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'game-candidate__remove';
        removeButton.dataset.index = i;                              // 후보 목록에서 몇 번째인지.
        removeButton.textContent = '×';
        removeButton.setAttribute('aria-label', t('game.remove', c.place.place_name));

        li.append(name, removeButton);
        els.candidateList.appendChild(li);
    });
}

// 후보 하나를 빼고 게임을 다시 시작한다. (게임 중이어도 처음부터 다시)
function removeCandidate(i) {
    candidates.splice(i, 1);
    updateCount();
    renderCandidates();
    startGame();
}

// 게임 탭 버튼들. 지금 게임에 aria-selected="true".
function renderTabs() {
    els.tabs.replaceChildren();
    GAMES.forEach(function (game) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'game-tab';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', String(game === currentGame));
        tab.dataset.game = game.id;
        tab.textContent = t(game.labelKey);
        els.tabs.appendChild(tab);
    });
}

function showStageStatus(message) {
    els.stageStatus.textContent = message;
    els.stageStatus.hidden = false;
}

// 결과창에 당첨 장소를 보여 준다. 패널과 같은 모양의 카드를 재사용한다. (map/placePanel.js)
function showResult(place) {
    els.resultPlace.replaceChildren(createStandalonePlaceCard(place));
    els.result.hidden = false;           // 보이는 순간 game.css 의 튀어나오는 애니메이션이 돈다.
    els.goButton.focus();                // 키보드로도 바로 [여기로 가기]를 누를 수 있게.
    els.result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });   // 창이 길어 결과창이 아래에 가려져 있으면 보이게.
    celebrate();
}

// 와아! 양쪽 아래에서 색종이를 쏘아 올린다. 모든 게임 공통. (게임은 효과를 따로 만들지 않는다)
function celebrate() {
    if (!shootConfetti) return;
    var common = { particleCount: 80, spread: 70, startVelocity: 55 };
    // origin : 쏘는 위치 (0~1, 화면 비율). angle : 쏘는 방향 (90 = 위, 60 = 오른쪽 위, 120 = 왼쪽 위)
    shootConfetti(Object.assign({ origin: { x: 0.15, y: 0.9 }, angle: 60 }, common));
    shootConfetti(Object.assign({ origin: { x: 0.85, y: 0.9 }, angle: 120 }, common));
}

function hideResult() {
    winner = null;
    els.result.hidden = true;
}
