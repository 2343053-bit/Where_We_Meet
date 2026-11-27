// 제비뽑기. 후보 이름을 적은 쪽지를 접어서 섞어 깔고, 사용자가 하나를 고르면 그 쪽지에 적힌 장소가 당첨.
//   1) 이름 순서를 무작위로 섞는다. (쪽지 k 번 = names[order[k]])
//   2) 쪽지를 하나 누르면 펼쳐서 이름을 보여 준다.
//   3) 잠시 뒤 나머지 쪽지도 흐리게 펼쳐 보여 주고, 게이트에 당첨 번호를 알린다.
// 게임 규약은 game/gameHub.js 맨 위 주석 참고. 스타일은 css/game.css 의 "제비뽑기" 부분.
import { t } from '../../util/i18n.js';

var REVEAL_OTHERS_DELAY = 700;   // 고른 제비가 뒤집힌 뒤 나머지를 보여 주기까지. (ms, 뒤집기 애니메이션 시간과 맞춤)
var FINISH_DELAY = 1200;         // 고른 뒤 결과창을 띄우기까지. 이름을 읽을 틈을 준다.

var container = null;            // 게이트가 준 칸.
var timers = [];                 // unmount 때 취소하려고 모아 둔 setTimeout 번호들.

export default {
    id: 'lottery',
    labelKey: 'game.lottery',
    minCount: 2,
    maxCount: 8,

    mount: function (target, names, onFinish) {
        container = target;
        var order = shuffledIndexes(names.length);   // 예) [2, 0, 1] → 제비 0번에 names[2], 1번에 names[0] ...

        var hint = document.createElement('p');
        hint.className = 'game-lottery__hint';
        hint.textContent = t('game.lotteryHint');

        var board = document.createElement('div');
        board.className = 'game-lottery__board';

        var slips = order.map(function (nameIndex, k) {
            var slip = createSlip(names[nameIndex], k);
            slip.style.animationDelay = (k * 60) + 'ms';   // 한 장씩 차례로 깔리는 느낌.
            board.appendChild(slip);
            return slip;
        });

        // 쪽지마다 붙이지 않고 판에 한 번만 붙인다. (이벤트 위임) 판은 unmount 때 통째로 지워진다.
        board.addEventListener('click', function (e) {
            var slip = e.target.closest('.game-lottery__slip');
            if (!slip || board.classList.contains('is-done')) return;   // 이미 하나 골랐으면 무시.

            board.classList.add('is-done');
            slips.forEach(function (s) { s.disabled = true; });
            slip.classList.add('is-open', 'is-picked');      // 고른 쪽지를 펼친다.
            hint.textContent = t('game.lotteryPicked');

            var winnerIndex = order[Number(slip.dataset.slot)];   // 이 쪽지에 적힌 이름이 names 의 몇 번째인지.

            later(function () {
                slips.forEach(function (s) {
                    if (s !== slip) s.classList.add('is-open', 'is-other');   // 나머지도 흐리게 펼쳐서 보여 준다.
                });
            }, REVEAL_OTHERS_DELAY);

            later(function () {
                onFinish(winnerIndex);
            }, FINISH_DELAY);
        });

        container.append(hint, board);
    },

    unmount: function () {
        timers.forEach(clearTimeout);   // 고른 직후 창을 닫아도 늦게 onFinish 가 불리지 않게.
        timers = [];
        if (container) container.replaceChildren();
        container = null;
    }
};

// 접힌 쪽지 한 장. is-open 이 붙으면 CSS 로 덮개가 펼쳐진다. (css/game.css 의 "제비뽑기" 주석에 구조 그림)
//   button.game-lottery__slip
//     span.game-lottery__body               ← 쪽지마다 조금씩 기울인다
//       span.game-lottery__half             ← 아랫절반 (빈 종이)
//       span.game-lottery__flap             ← 덮개 = 윗절반. 처음엔 아래로 접혀 있다
//         span.flap-face--front             ← 펼치면 보이는 면 (빈 종이)
//         span.flap-face--back              ← 접혀 있을 때 보이는 면 (?)
//       span.game-lottery__text             ← 이름. 쪽지 전체 위에 한 장으로 얹고, 다 펼쳐진 뒤에 나타난다
//                                             (절반씩 나눠 넣으면 접힌 선에서 글자가 잘려 보여서)
function createSlip(name, slot) {
    var slip = document.createElement('button');
    slip.type = 'button';
    slip.className = 'game-lottery__slip';
    slip.dataset.slot = slot;                                   // 몇 번째 쪽지인지.
    slip.setAttribute('aria-label', t('game.lotteryCard', slot + 1));   // 이름은 접혀 있으니 "제비 1" 처럼 읽어 준다.

    var body = document.createElement('span');
    body.className = 'game-lottery__body';
    body.style.setProperty('--tilt', (Math.random() * 16 - 8).toFixed(1) + 'deg');   // -8도 ~ 8도. 흩어 놓은 느낌.

    var half = document.createElement('span');
    half.className = 'game-lottery__half';

    var flap = document.createElement('span');
    flap.className = 'game-lottery__flap';

    var front = document.createElement('span');
    front.className = 'game-lottery__flap-face game-lottery__flap-face--front';

    var back = document.createElement('span');
    back.className = 'game-lottery__flap-face game-lottery__flap-face--back';
    back.textContent = '?';

    // 이름. 접혀 있을 땐 투명하다가 펼쳐지면 나타난다. 화면 낭독기에는 숨긴다. (펼친 뒤엔 결과창이 이름을 알려 준다)
    var text = document.createElement('span');
    text.className = 'game-lottery__text';
    text.setAttribute('aria-hidden', 'true');
    text.textContent = name;                                    // textContent 라서 이름 속 <, > 도 안전.

    flap.append(front, back);
    body.append(half, flap, text);                              // text 를 맨 뒤에 둬서 종이 위에 그려지게.
    slip.appendChild(body);
    return slip;
}

// 0 ~ count-1 을 무작위 순서로 섞은 배열. (피셔-예이츠 셔플: 뒤에서부터 앞쪽의 아무 칸과 바꾼다. 모든 순서가 같은 확률)
function shuffledIndexes(count) {
    var result = [];
    for (var i = 0; i < count; i++) result.push(i);
    for (var j = count - 1; j > 0; j--) {
        var r = Math.floor(Math.random() * (j + 1));
        var temp = result[j];
        result[j] = result[r];
        result[r] = temp;
    }
    return result;
}

// setTimeout 을 걸고 번호를 모아 둔다. (unmount 에서 한꺼번에 취소)
function later(fn, delay) {
    timers.push(setTimeout(fn, delay));
}
