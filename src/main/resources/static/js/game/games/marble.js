// 마블 룰렛. 후보마다 구슬 하나를 긴 코스 위에서 굴려서, 결승선을 가장 먼저 넘은 구슬이 당첨.
//
// 룰렛과 달리 결과를 미리 정하지 않는다. 물리 엔진(matter.js)이 실제로 굴린 결과 그대로가 당첨이다.
//   - 공정하게: 출발 자리를 무작위로 섞고, 처음 속도도 조금씩 다르게 준다. (1번이 늘 같은 자리면 유리하니까)
//   - 코스는 벽으로 둘러싼 좁은 수로가 구불구불 이어지는 모양이다. 판마다 좌우만 무작위로 뒤집는다.
//   - 코스가 화면보다 훨씬 길어서, 카메라가 선두 구슬을 따라 내려간다.
//   - 그리기는 matter.js 기본 렌더러 대신 직접 캔버스에 한다. (어두운 배경 + 가는 선, 구슬 번호, 결승선)
//
// 진행: 구슬이 출발 문 위에서 기다린다 → [경주 시작] → 3·2·1 → 문이 사라지고 출발 → 첫 도착 구슬이 당첨.
//
// matter.js 는 main.html 에서 <script> 로 불러온다. (window.Matter) 못 불러왔으면 mount 에서 오류를 던지고,
// 게이트(gameHub.js)가 받아서 "게임을 시작하지 못했어요" 를 보여 준다.
//
// 좌표: 코스 가로는 360, 세로는 약 3100. 화면은 그중 가로 360 × 세로 460 만큼을 보여 준다.
//       y 는 아래로 갈수록 커진다. (캔버스·matter.js 공통)
// 게임 규약은 game/gameHub.js 맨 위 주석 참고. 스타일은 css/game.css 의 "마블" 부분.
import { t } from '../../util/i18n.js';

var WORLD_W = 360;
var VIEW_H = 460;
var GATE_Y = 100;              // 출발 문 높이.

var MARBLE_R = 10;             // 구슬 반지름.
var PIN_R = 4;                 // 핀 반지름.
// 벽 두께(물리 판정). 화면에는 가는 선으로 그리지만, 판정은 두껍게 해야 빠른 구슬이 뚫고 지나가지 않는다.
// 시뮬레이션(8개 × 30판): 두께 8 → 86번 뚫림, 16 + 계산 정밀도↑ → 0~2번 (끝 모서리를 스친 경우)
var WALL_T = 16;
// 경주 속도. 수로는 거의 수직이라 그대로 두면 자유낙하해서 9초 만에 끝난다.
// 중력을 줄이고 공기 저항을 올려 평균 약 18초. (시뮬레이션: 5개 × 30판, 16 ~ 21초)
// 더 길게 하려면 AIR_FRICTION 을 올리면 된다. 단, 0.05 를 넘기면 꿀 속을 지나가듯 둔해 보인다.
var GRAVITY_SCALE = 0.0007;    // matter.js 기본 0.001
var AIR_FRICTION = 0.03;
var STEP_MS = 1000 / 60;       // 물리 계산 한 번의 시간. 화면 주사율(60Hz, 144Hz…)과 상관없이 같은 속도로 굴러가게 고정.
var COUNTDOWN_MS = 600;        // 3·2·1 한 칸의 시간.
var FINISH_DELAY = 900;        // 첫 구슬이 도착한 뒤 결과창을 띄우기까지. 도착 장면을 볼 틈을 준다.
var RANK_UPDATE_MS = 250;      // 순위표를 고치는 간격. 매 프레임 고치면 비슷한 높이의 구슬끼리 덜덜 떨린다.

// 구슬 색. 어두운 배경에서 잘 보이는 밝은 색. 번호는 진한 글자. 후보는 최대 8개라 겹치지 않는다. (순위표 점도 같은 색)
var COLORS = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#f783ac', '#3bc9db', '#ffa94d'];

// 그리기 색.
var BG_COLOR = '#1e1f24';          // 배경
var WALL_COLOR = '#ced4da';        // 수로 벽 (가는 선)
var OBSTACLE_COLOR = '#3bc9db';    // 장애물 선
var OBSTACLE_FILL = 'rgba(59, 201, 219, 0.12)';
var GATE_COLOR = '#ff922b';        // 출발 문

// ── 수로 모양 ──
// [y, 가운데 x, 반폭] 점들을 위에서부터 이은 것. 왼쪽 벽 = 가운데 - 반폭, 오른쪽 벽 = 가운데 + 반폭.
// 가운데 x 가 옮겨 가면 수로가 꺾이고(S자), 반폭이 바뀌면 넓은 방·좁은 통로가 된다.
// 좁은 통로도 반폭 40 이상(폭 80 = 구슬 지름의 4배)으로 둬서 구슬끼리 끼지 않게 한다.
var TRACK = [
    [0, 180, 170], [140, 180, 170],                    // 출발 구역 (문은 GATE_Y)
    [220, 180, 50],                                    // 출발 깔때기 → 수로 입구
    [300, 180, 45], [420, 260, 45], [540, 260, 45],    // ① S자 수로: 오른쪽으로 꺾고
    [660, 100, 45], [780, 100, 45], [900, 200, 45],    //            왼쪽으로 꺾었다가 다시 오른쪽
    [960, 180, 40], [1020, 180, 140],                  // ② 세모 방: 좁은 목 → 넓은 방
    [1300, 180, 140], [1360, 180, 40],                 //            → 다시 좁은 목
    [1440, 180, 90], [1840, 180, 90],                  // ③ 비스듬 막대 줄
    [1900, 180, 150], [2200, 180, 150],                // ④ 회전 X자 방
    [2260, 180, 70], [2600, 180, 70],                  // ⑤ 핀 기둥
    [2660, 180, 120], [2760, 180, 120],                // ⑥ 마지막 방 (회전 막대)
    [2860, 180, 40], [2940, 180, 40],                  //    마지막 깔때기 → 결승선(FINISH_Y)
    [3000, 180, 170], [3080, 180, 170]                 //    도착 후 바닥
];
var FINISH_Y = 2900;

var container = null;          // 게이트가 준 칸.
var engine = null;             // matter.js 엔진.
var rafId = 0;                 // requestAnimationFrame 번호. (unmount 때 취소)
var timers = [];               // setTimeout 번호들. (unmount 때 취소)

export default {
    id: 'marble',
    labelKey: 'game.marble',
    minCount: 2,
    maxCount: 8,

    mount: function (target, names, onFinish) {
        var Matter = window.Matter;
        if (!Matter) throw new Error('matter.js 를 불러오지 못했습니다.');

        container = target;
        // 겹침·속도 보정을 기본(6, 4)보다 더 여러 번 해서 구슬이 벽을 뚫거나 서로 파고들지 않게.
        engine = Matter.Engine.create({
            positionIterations: 10,
            velocityIterations: 8,
            gravity: { x: 0, y: 1, scale: GRAVITY_SCALE }
        });

        // ── 화면: [캔버스 + 가운데 경주 시작 버튼] + 순위표 ──
        var root = document.createElement('div');
        root.className = 'game-marble';

        var stage = document.createElement('div');
        stage.className = 'game-marble__stage';

        var canvas = document.createElement('canvas');
        canvas.className = 'game-marble__canvas';
        var dpr = window.devicePixelRatio || 1;        // 고해상도 화면에서 흐리지 않게 실제 픽셀을 그만큼 늘린다.
        canvas.width = WORLD_W * dpr;
        canvas.height = VIEW_H * dpr;
        var ctx = canvas.getContext('2d');

        var startButton = document.createElement('button');
        startButton.type = 'button';
        startButton.className = 'game-marble__start';
        startButton.textContent = t('game.marbleStart');

        var legend = createLegend(names);
        stage.append(canvas, startButton);
        root.append(stage, legend.el);

        // ── 물리: 코스 + 출발 문 + 구슬 ──
        var course = buildCourse(Matter, Math.random() < 0.5);
        var gate = Matter.Bodies.rectangle(WORLD_W / 2, GATE_Y, WORLD_W, 8, { isStatic: true });
        course.shapes.push({ body: gate, kind: 'gate' });
        var marbles = createMarbles(Matter, names.length);
        Matter.Composite.add(engine.world, course.shapes.map(function (s) { return s.body; }).concat(marbles));

        var cameraY = 0;          // 화면 맨 위가 코스의 어느 높이인지.
        var winnerIndex = -1;     // 아직 아무도 도착 안 했으면 -1.
        var countdownText = '';   // 캔버스 가운데에 크게 띄울 글자. ('3', '2', '1', '출발!')
        var raceStarted = false;  // 출발 문이 열렸는지.
        var finished = [];        // 도착한 순서대로 구슬 번호. finished[0] = 당첨.
        var lastRankAt = 0;       // 마지막으로 순위표를 고친 시각. (너무 자주 고치면 항목이 덜덜 떨려서 RANK_UPDATE_MS 마다)

        // [경주 시작] → 3·2·1 → 문 열기.
        startButton.addEventListener('click', function () {
            startButton.hidden = true;
            ['3', '2', '1'].forEach(function (text, k) {
                later(function () { countdownText = text; }, k * COUNTDOWN_MS);
            });
            later(function () {
                countdownText = t('game.marbleGo');
                Matter.Composite.remove(engine.world, gate);   // 문이 사라지면 구슬이 떨어진다.
                raceStarted = true;
                course.shapes = course.shapes.filter(function (s) { return s.body !== gate; });
            }, 3 * COUNTDOWN_MS);
            later(function () { countdownText = ''; }, 4 * COUNTDOWN_MS);
        });

        // 한 프레임: 밀린 시간만큼 물리 계산 → 도착 확인 → 카메라 이동 → 그리기.
        var lastTime = performance.now();
        var pending = 0;          // 아직 계산 안 한 시간. (ms)
        function frame(now) {
            pending += Math.min(now - lastTime, 100);   // 탭을 오래 비웠다 돌아와도 한꺼번에 너무 많이 계산하지 않게 100ms 까지만.
            lastTime = now;
            while (pending >= STEP_MS) {
                course.spinners.forEach(function (s) { Matter.Body.rotate(s.body, s.speed); });   // 회전 장애물 돌리기.
                Matter.Engine.update(engine, STEP_MS);
                pending -= STEP_MS;
                checkFinish();
            }
            // 순위표: 출발한 뒤부터. (문 위에서 기다릴 땐 높이가 비슷해 순서가 계속 바뀌니까)
            if (raceStarted && now - lastRankAt >= RANK_UPDATE_MS) {
                lastRankAt = now;
                legend.setRanking(ranking(marbles, finished));
            }
            // 카메라: 출발 전엔 맨 위, 달리는 중엔 선두, 도착 뒤엔 당첨 구슬.
            var leader = !raceStarted ? -1 : (winnerIndex !== -1 ? winnerIndex : findLeader(marbles));
            cameraY = follow(cameraY, leader === -1 ? 0 : marbles[leader].position.y, course.height);
            draw(ctx, dpr, cameraY, course, marbles, winnerIndex, countdownText);
            rafId = requestAnimationFrame(frame);
        }

        // 결승선을 넘은 구슬을 도착 순서대로 기록한다. 처음 넘은 구슬이 당첨. (onFinish 는 한 번만)
        // 당첨 뒤에도 기록을 계속해서, 순위표가 2등·3등… 까지 도착 순서대로 정리된다.
        function checkFinish() {
            for (var i = 0; i < marbles.length; i++) {
                if (finished.indexOf(i) !== -1 || marbles[i].position.y < FINISH_Y) continue;
                finished.push(i);
                if (winnerIndex === -1) {
                    winnerIndex = i;
                    legend.setWinner(i);
                    later(function () { onFinish(winnerIndex); }, FINISH_DELAY);
                }
            }
        }

        container.appendChild(root);
        rafId = requestAnimationFrame(frame);
    },

    unmount: function () {
        cancelAnimationFrame(rafId);          // 그리기·물리 계산 멈춤.
        rafId = 0;
        timers.forEach(clearTimeout);         // 카운트다운·늦은 onFinish 가 남지 않게.
        timers = [];
        if (engine) {
            window.Matter.Composite.clear(engine.world, false);   // 몸체 전부 빼기.
            window.Matter.Engine.clear(engine);                     // 엔진 내부 기록 지우기.
            engine = null;
        }
        if (container) container.replaceChildren();
        container = null;
    }
};

// ── 순위표 ───────────────────────

// 실시간 순위표: [순위] ● 번호 이름. 1등은 is-leader, 당첨은 is-winner.
// 순위가 바뀌면 항목이 새 자리로 미끄러져 간다. (FLIP: 옮기기 전 위치를 재고 → 옮기고 → 옛 자리에서 새 자리로 애니메이션)
function createLegend(names) {
    var el = document.createElement('ol');
    el.className = 'game-marble__legend';
    var lastOrder = '';                                  // 지난번 순서. 같으면 아무것도 안 한다.
    var rankEls = [];
    var items = names.map(function (name, i) {
        var li = document.createElement('li');
        li.className = 'game-marble__legend-item';

        var rank = document.createElement('span');
        rank.className = 'game-marble__rank';            // 출발 전엔 비어 있다.
        rankEls.push(rank);

        var dot = document.createElement('span');
        dot.className = 'game-marble__dot';
        dot.style.background = COLORS[i % COLORS.length];
        dot.textContent = String(i + 1);                 // 캔버스의 구슬 번호와 같다.

        var label = document.createElement('span');
        label.className = 'game-marble__name';
        label.textContent = name;                        // textContent 라서 이름 속 <, > 도 안전.

        li.append(rank, dot, label);
        el.appendChild(li);
        return li;
    });

    return {
        el: el,
        // order: 1등부터 구슬 번호. 예) [3, 0, 2, 1] → 4번 구슬이 1등.
        setRanking: function (order) {
            var key = order.join(',');
            if (key === lastOrder) return;
            lastOrder = key;

            // F(irst): 옮기기 전 화면 위치.
            var before = items.map(function (li) { return li.getBoundingClientRect().top; });
            // 순서대로 다시 붙이면 그 순서로 바뀐다. (이미 있는 태그를 appendChild 하면 "이동")
            order.forEach(function (i, place) {
                el.appendChild(items[i]);
                rankEls[i].textContent = String(place + 1);
                items[i].classList.toggle('is-leader', place === 0);
            });
            // L(ast)·I(nvert)·P(lay): 새 위치와의 차이만큼 옛 자리로 되돌려 놓았다가, transition 으로 새 자리까지 움직인다.
            items.forEach(function (li, i) {
                var dy = before[i] - li.getBoundingClientRect().top;
                if (!dy) return;
                li.classList.remove('is-rising');
                li.style.transition = 'none';
                li.style.transform = 'translateY(' + dy + 'px)';
                li.getBoundingClientRect();                  // 브라우저가 "옛 자리"를 한 번 그리게 한다. (안 하면 바로 새 자리로 튄다)
                li.style.transition = '';
                li.style.transform = '';
                // 위로 올라가는(추월한) 항목은 잠깐 반짝. 뺐다가 다시 붙여야 두 번째 추월에도 애니메이션이 다시 돈다.
                if (dy > 0) li.classList.add('is-rising');
            });
        },
        setWinner: function (i) {
            items[i].classList.add('is-winner');
        }
    };
}

// 지금 순위. 도착한 구슬은 도착 순서대로 맨 앞, 나머지는 더 아래(= 결승선에 가까운) 구슬이 앞.
function ranking(marbles, finished) {
    var running = [];
    for (var i = 0; i < marbles.length; i++) {
        if (finished.indexOf(i) === -1) running.push(i);
    }
    running.sort(function (a, b) { return marbles[b].position.y - marbles[a].position.y; });
    return finished.concat(running);
}

// ── 코스 ───────────────────────
//
// 벽으로 둘러싼 수로(TRACK) + 수로 안의 장애물. 위에서부터:
//   ① S자 수로       : 좁은 통로가 오른쪽·왼쪽으로 꺾이며 내려간다. 꺾이는 벽에 부딪혀 순위가 섞인다
//   ② 세모 방        : 넓어진 방 가운데 세모. 왼쪽·오른쪽 어디로 도느냐로 갈린다
//   ③ 비스듬 막대 줄 : 짧은 막대가 줄줄이 비스듬히 박혀 있어 지그재그로 튕긴다
//   ④ 회전 X자 방    : 천천히 도는 X자 세 개가 구슬을 쳐 낸다
//   ⑤ 핀 기둥        : 다시 좁아진 기둥 안의 촘촘한 핀
//   ⑥ 마지막 방      : 가로로 도는 막대 → 마지막 깔때기 → 결승선
// mirror 면 코스 전체를 좌우로 뒤집는다. (판마다 무작위)
//
// shapes: [{ body, kind }]  kind = 'wall'(벽 판정, 그리지 않음) / 'pin' / 'obstacle' / 'spinner' / 'gate'
// spinners: [{ body, speed }] ← 매 계산마다 speed(라디안)만큼 돈다
// lines: { left: [점들], right: [점들] } ← 화면에 그릴 수로 벽 선

function buildCourse(Matter, mirror) {
    var shapes = [];
    var spinners = [];
    function X(x) { return mirror ? WORLD_W - x : x; }   // 좌우 뒤집기.
    function add(body, kind) { shapes.push({ body: body, kind: kind }); return body; }

    // ── 수로 벽 ──
    var left = TRACK.map(function (p) { return { x: X(p[1] - p[2]), y: p[0] }; });
    var right = TRACK.map(function (p) { return { x: X(p[1] + p[2]), y: p[0] }; });
    if (mirror) { var temp = left; left = right; right = temp; }   // 뒤집으면 왼쪽·오른쪽 벽이 바뀐다.
    addWall(Matter, left, -1, add);
    addWall(Matter, right, 1, add);

    var staticOptions = { isStatic: true, friction: 0.01, restitution: 0.4 };

    // ② 세모 방: 꼭짓점이 위를 향한 세모. 위에서 떨어진 구슬이 좌우로 갈린다.
    add(Matter.Bodies.fromVertices(X(180), 1170, [[{ x: 0, y: -50 }, { x: 52, y: 40 }, { x: -52, y: 40 }]], staticOptions), 'obstacle');

    // ③ 비스듬 막대 줄: 수로 폭 180 (벽 90 ~ 270).
    //   짝수 줄: 140 의 막대는 오른쪽 아래, 220 의 막대는 왼쪽 아래 → 가운데로 모은다 (가운데 틈 약 42px)
    //   홀수 줄: 가운데 막대 하나가 다시 좌우로 가른다. 줄마다 기울기를 바꿔 매번 다른 쪽으로.
    //   벽과 바깥 막대 사이도 30px 넘게 띄운다. (붙이면 그 틈에 구슬이 낀다)
    for (var row = 0; row < 7; row++) {
        var y = 1490 + row * 52;
        if (row % 2 === 0) {
            add(Matter.Bodies.rectangle(X(140), y, 44, 10, Object.assign({ angle: mirror ? -0.5 : 0.5 }, staticOptions)), 'obstacle');
            add(Matter.Bodies.rectangle(X(220), y, 44, 10, Object.assign({ angle: mirror ? 0.5 : -0.5 }, staticOptions)), 'obstacle');
        } else {
            var tilt = (row % 4 === 1 ? 0.5 : -0.5) * (mirror ? -1 : 1);
            add(Matter.Bodies.rectangle(X(180), y, 44, 10, Object.assign({ angle: tilt }, staticOptions)), 'obstacle');
        }
    }

    // ④ 회전 X자 방: 수로 폭 300 (벽 30 ~ 330). X자는 팔 길이 80, 서로 안 겹치게 엇갈려 놓는다.
    //   멈춰 있는 X자는 위쪽 V 홈에 구슬이 얹혀 멈출 수 있어서, 천천히 돌린다.
    [[110, 1990, 0.03], [250, 2070, -0.035], [140, 2150, 0.03]].forEach(function (s) {
        [Math.PI / 4, -Math.PI / 4].forEach(function (angle) {   // 막대 두 개를 같은 중심에서 같이 돌리면 X자.
            var bar = add(Matter.Bodies.rectangle(X(s[0]), s[1], 80, 10, Object.assign({ angle: angle }, staticOptions)), 'spinner');
            spinners.push({ body: bar, speed: mirror ? -s[2] : s[2] });
        });
    });

    // ⑤ 핀 기둥: 수로 폭 140 (벽 110 ~ 250). 40px 간격 엇갈린 핀.
    //   짝수 줄 140, 180, 220 → 벽까지 26px / 홀수 줄 160, 200 / 핀 사이 32px. 모두 구슬 지름(20px)보다 넓다.
    for (var r = 0; r < 8; r++) {
        var xs = r % 2 === 0 ? [140, 180, 220] : [160, 200];
        xs.forEach(function (x) {
            add(Matter.Bodies.circle(X(x), 2300 + r * 40, PIN_R, { isStatic: true, restitution: 0.5, friction: 0 }), 'pin');
        });
    }

    // ⑥ 마지막 방: 가로로 도는 막대 하나. 수로 폭 240 (벽 60 ~ 300), 막대 길이 140 → 양옆에 50px 씩 틈.
    var sweeper = add(Matter.Bodies.rectangle(X(180), 2710, 140, 12, staticOptions), 'spinner');
    spinners.push({ body: sweeper, speed: mirror ? -0.03 : 0.03 });

    var height = TRACK[TRACK.length - 1][0];
    // 맨 아래 바닥. (도착한 구슬이 쌓인다)
    add(Matter.Bodies.rectangle(WORLD_W / 2, height + WALL_T / 2, WORLD_W, WALL_T, { isStatic: true }), 'wall');

    return { shapes: shapes, spinners: spinners, lines: { left: left, right: right }, height: height };
}

// 벽 한쪽(점들을 이은 꺾은선)을 물리 몸체로 만든다.
//   side: -1 = 왼쪽 벽, 1 = 오른쪽 벽. 몸체는 선의 "바깥쪽"으로 두께만큼 밀어서, 안쪽 면이 그려진 선과 딱 맞게 한다.
//   꺾이는 점마다 둥근 기둥을 하나씩 넣어, 바깥쪽 모서리에 틈이 생기지 않게 한다.
function addWall(Matter, points, side, add) {
    var options = { isStatic: true, friction: 0.01, restitution: 0.3 };
    for (var i = 0; i < points.length - 1; i++) {
        var p = points[i], q = points[i + 1];
        var dx = q.x - p.x, dy = q.y - p.y;
        var length = Math.hypot(dx, dy);
        if (length === 0) continue;
        // 선에 수직인 방향 중 바깥쪽(왼쪽 벽이면 x 가 작아지는 쪽).
        var nx = dy / length, ny = -dx / length;
        if (nx * side < 0) { nx = -nx; ny = -ny; }
        var cx = (p.x + q.x) / 2 + nx * WALL_T / 2;
        var cy = (p.y + q.y) / 2 + ny * WALL_T / 2;
        add(Matter.Bodies.rectangle(cx, cy, length, WALL_T, Object.assign({ angle: Math.atan2(dy, dx) }, options)), 'wall');
        if (i > 0) {
            add(Matter.Bodies.circle(p.x + side * WALL_T / 2, p.y, WALL_T / 2, options), 'wall');
        }
    }
}

// 구슬들. marbles[i] = names[i] 의 구슬. 출발 문 위에 한 줄로 세우고, 자리만 섞는다.
function createMarbles(Matter, count) {
    var slots = shuffle(range(count));   // 구슬 i 는 slots[i] 번째 자리에서 출발.
    var gap = (WORLD_W - 80) / Math.max(count - 1, 1);
    var marbles = [];
    for (var i = 0; i < count; i++) {
        var x = 40 + slots[i] * gap + (Math.random() - 0.5) * 6;   // 자리 + 살짝 흔들기.
        var marble = Matter.Bodies.circle(x, GATE_Y - 30, MARBLE_R, {
            restitution: 0.4,       // 튕기는 정도.
            friction: 0.01,
            frictionStatic: 0,      // 정지 마찰 없음. (기본값 0.5 면 느려진 구슬이 완만한 경사 위에 그냥 멈춰 버린다)
            frictionAir: AIR_FRICTION,   // 공기 저항. 너무 빨라지지 않게. (맨 위 상수 참고)
            density: 0.002
        });
        Matter.Body.setVelocity(marble, { x: (Math.random() - 0.5) * 1.5, y: 0 });
        marbles.push(marble);
    }
    return marbles;
}

// ── 카메라 ───────────────────────

// 가장 아래(= 앞서가는) 구슬. 번호를 돌려준다.
function findLeader(marbles) {
    var best = 0;
    for (var i = 1; i < marbles.length; i++) {
        if (marbles[i].position.y > marbles[best].position.y) best = i;
    }
    return best;
}

// 선두 구슬이 화면 위에서 40% 쯤에 오도록 카메라를 부드럽게 옮긴다.
function follow(cameraY, leaderY, worldH) {
    var target = clamp(leaderY - VIEW_H * 0.4, 0, worldH - VIEW_H);
    return cameraY + (target - cameraY) * 0.1;   // 한 번에 다 가지 않고 10% 씩 → 덜컹거리지 않는다.
}

// ── 그리기 ───────────────────────

function draw(ctx, dpr, cameraY, course, marbles, winnerIndex, countdownText) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);       // 이후 좌표는 CSS 픽셀 기준.
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, WORLD_W, VIEW_H);
    ctx.save();
    ctx.translate(0, -cameraY);                    // 카메라만큼 코스를 위로 올려서 그린다.

    drawFinishLine(ctx, course.lines);

    // 수로 벽: 가는 선.
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = WALL_COLOR;
    strokePath(ctx, course.lines.left);
    strokePath(ctx, course.lines.right);

    course.shapes.forEach(function (shape) {
        if (shape.kind === 'wall') return;
        if (!isVisible(shape.body.position.y, cameraY, 80)) return;   // 안 보이는 건 그리지 않아 가볍게.
        var body = shape.body;
        if (shape.kind === 'pin') {
            ctx.fillStyle = OBSTACLE_COLOR;
            ctx.beginPath();
            ctx.arc(body.position.x, body.position.y, PIN_R, 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        // 세모·막대·X자·문: 꼭짓점을 이어 옅게 채우고 선으로 테두리.
        ctx.fillStyle = shape.kind === 'gate' ? GATE_COLOR : OBSTACLE_FILL;
        ctx.strokeStyle = shape.kind === 'gate' ? GATE_COLOR : OBSTACLE_COLOR;
        tracePolygon(ctx, body.vertices);
        ctx.fill();
        ctx.stroke();
    });

    marbles.forEach(function (marble, i) {
        drawMarble(ctx, marble, i, i === winnerIndex);
    });

    ctx.restore();

    if (countdownText) {                           // 카메라와 상관없이 화면 가운데에.
        ctx.font = 'bold 56px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 6;
        ctx.strokeStyle = BG_COLOR;
        ctx.strokeText(countdownText, WORLD_W / 2, VIEW_H / 2);
        ctx.fillStyle = GATE_COLOR;
        ctx.fillText(countdownText, WORLD_W / 2, VIEW_H / 2);
    }
}

// 결승선: 수로 폭만큼만 체크무늬 띠.
function drawFinishLine(ctx, lines) {
    var x1 = wallXAt(lines.left, FINISH_Y), x2 = wallXAt(lines.right, FINISH_Y);
    var size = 8;
    for (var x = x1; x < x2; x += size) {
        for (var row = 0; row < 2; row++) {
            ctx.fillStyle = ((Math.round((x - x1) / size) + row) % 2 === 0) ? '#f8f9fa' : '#343a40';
            ctx.fillRect(x, FINISH_Y - size + row * size, Math.min(size, x2 - x), size);
        }
    }
}

// 벽 꺾은선에서 높이 y 일 때의 x. (결승선 폭을 구할 때)
function wallXAt(points, y) {
    for (var i = 0; i < points.length - 1; i++) {
        var p = points[i], q = points[i + 1];
        if (y >= p.y && y <= q.y && q.y !== p.y) return p.x + (q.x - p.x) * (y - p.y) / (q.y - p.y);
    }
    return points[0].x;
}

// 구슬 하나: 은은한 빛 + 밝은 원 + 진한 번호. 번호 = 후보 순서 + 1. 당첨 구슬은 흰 테두리.
function drawMarble(ctx, marble, i, isWinner) {
    var p = marble.position;
    var color = COLORS[i % COLORS.length];
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, MARBLE_R, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    if (isWinner) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), p.x, p.y + 0.5);
}

function strokePath(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
}

function tracePolygon(ctx, vertices) {
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (var i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
    ctx.closePath();
}

// 화면에 보이는 높이인지.
function isVisible(y, cameraY, margin) {
    return y + margin >= cameraY && y - margin <= cameraY + VIEW_H;
}

// ── 도구 ───────────────────────

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function range(count) {
    var result = [];
    for (var i = 0; i < count; i++) result.push(i);
    return result;
}

// 배열을 무작위 순서로 섞은 새 배열. (피셔-예이츠 셔플, lottery.js 와 같은 방식)
function shuffle(array) {
    var result = array.slice();
    for (var j = result.length - 1; j > 0; j--) {
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
