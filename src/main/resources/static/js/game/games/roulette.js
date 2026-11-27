// 룰렛. 원판을 후보 수만큼 칸으로 나누고, 가운데 버튼을 누르면 돌다가 멈춘 칸(위쪽 바늘이 가리키는 칸)이 당첨.
//
// 멈출 칸을 "돌린 뒤 계산"하지 않고 "먼저 뽑고, 그 칸에 멈추도록 각도를 계산"한다. 계산이 간단하고 틀릴 일이 없다.
//   - 칸 k 의 가운데 각도 = (k + 0.5) × 칸 크기   (0도 = 맨 위, 시계 방향. conic-gradient 와 같은 기준)
//   - 원판을 r 도 돌리면 칸 k 가운데는 (가운데 각도 + r) 에 온다. 이게 0도(바늘)가 되려면 r = 360 - 가운데 각도.
//   - 여기에 여러 바퀴(360 × SPINS)를 더하고, 칸 안에서 조금 흔들어(jitter) 매번 같은 자리에 서지 않게 한다.
//
// 게임 규약은 game/gameHub.js 맨 위 주석 참고. 스타일은 css/game.css 의 "룰렛" 부분.
import { t } from '../../util/i18n.js';

var SPINS = 6;              // 멈추기 전에 도는 바퀴 수.
var SPIN_MS = 4500;         // 도는 시간. css/game.css 의 .game-roulette__wheel transition 과 같은 값.
var FINISH_DELAY = 400;     // 멈춘 뒤 결과창을 띄우기까지. 멈춘 칸을 볼 틈을 준다.

// 칸 색. 후보는 최대 8개라 이웃 칸 색이 겹치지 않는다. 글자는 모두 진한 색이라 어느 칸에서도 잘 보인다.
var COLORS = ['#ffc9c9', '#ffd8a8', '#ffec99', '#c0eb75', '#99e9f2', '#a5d8ff', '#d0bfff', '#fcc2d7'];

var container = null;       // 게이트가 준 칸.
var timers = [];            // unmount 때 취소하려고 모아 둔 setTimeout 번호들.

export default {
    id: 'roulette',
    labelKey: 'game.roulette',
    minCount: 2,
    maxCount: 8,

    mount: function (target, names, onFinish) {
        container = target;
        var segment = 360 / names.length;   // 칸 하나의 각도.

        var root = document.createElement('div');
        root.className = 'game-roulette';

        var pointer = document.createElement('div');
        pointer.className = 'game-roulette__pointer';   // 위쪽 바늘. 원판과 같이 돌지 않는다.

        // 돌지 않는 동그란 틀. 원판이 돌 때 튀어나오는 네모 모서리를 잘라서 창 스크롤바가 깜빡이지 않게 한다. (game.css)
        var dial = document.createElement('div');
        dial.className = 'game-roulette__dial';

        var wheel = document.createElement('div');
        wheel.className = 'game-roulette__wheel';
        dial.appendChild(wheel);
        wheel.style.background = buildGradient(names.length, segment);

        var labels = names.map(function (name, k) {
            var angle = (k + 0.5) * segment;                                   // 칸 가운데 각도.
            var label = document.createElement('span');
            label.className = 'game-roulette__label';
            if (angle > 180) label.classList.add('is-left');                   // 왼쪽 절반은 반대로 눕혀야 글자가 거꾸로 안 보인다. (game.css)
            label.style.setProperty('--angle', angle + 'deg');                 // 칸 가운데 방향으로 눕힌다.
            label.textContent = name;                                          // textContent 라서 이름 속 <, > 도 안전.
            label.title = name;                                                // 길어서 … 로 잘리면 마우스를 올려 전체 이름 확인.
            wheel.appendChild(label);
            return label;
        });

        var spinButton = document.createElement('button');
        spinButton.type = 'button';
        spinButton.className = 'game-roulette__spin';
        spinButton.textContent = t('game.rouletteSpin');

        spinButton.addEventListener('click', function () {
            spinButton.disabled = true;                       // 한 판에 한 번만 돌린다. (다시 하려면 결과창의 [다시 하기])
            root.classList.add('is-spinning');

            var winnerIndex = Math.floor(Math.random() * names.length);   // 1) 당첨을 먼저 뽑는다.
            var jitter = (Math.random() - 0.5) * segment * 0.7;           //    칸 가운데에서 좌우로 칸 폭의 35% 안쪽까지 흔든다.
            var center = (winnerIndex + 0.5) * segment;
            var rotation = 360 * SPINS + (360 - center) + jitter;         // 2) 그 칸이 바늘(0도)에 오는 각도.
            wheel.style.transform = 'rotate(' + rotation + 'deg)';        // 3) CSS transition 이 천천히 멈추게 돌린다.

            // transitionend 대신 시간으로 기다린다. ("동작 줄이기"로 transition 이 꺼지면 transitionend 가 안 온다)
            later(function () {
                root.classList.remove('is-spinning');
                labels[winnerIndex].classList.add('is-winner');
                later(function () {
                    onFinish(winnerIndex);
                }, FINISH_DELAY);
            }, prefersReducedMotion() ? 0 : SPIN_MS);
        });

        root.append(pointer, dial, spinButton);
        container.appendChild(root);
    },

    unmount: function () {
        timers.forEach(clearTimeout);   // 도는 중에 창을 닫거나 탭을 바꿔도 늦게 onFinish 가 불리지 않게.
        timers = [];
        if (container) container.replaceChildren();
        container = null;
    }
};

// 원판 배경. 칸 k 는 k × 칸 크기 ~ (k + 1) × 칸 크기 각도를 COLORS[k] 로 칠한다.
// 예) 후보 3개 → conic-gradient(#ffc9c9 0deg 120deg, #ffd8a8 120deg 240deg, #ffec99 240deg 360deg)
function buildGradient(count, segment) {
    var stops = [];
    for (var k = 0; k < count; k++) {
        stops.push(COLORS[k % COLORS.length] + ' ' + (k * segment) + 'deg ' + ((k + 1) * segment) + 'deg');
    }
    return 'conic-gradient(' + stops.join(', ') + ')';
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// setTimeout 을 걸고 번호를 모아 둔다. (unmount 에서 한꺼번에 취소)
function later(fn, delay) {
    timers.push(setTimeout(fn, delay));
}
