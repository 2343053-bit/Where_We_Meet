// 마블 룰렛. 후보마다 구슬 하나를 긴 코스 위에서 굴려서, 결승선을 가장 먼저 넘은 구슬이 당첨.
//
// 룰렛과 달리 결과를 미리 정하지 않는다. 물리 엔진(matter.js)이 실제로 굴린 결과 그대로가 당첨이다.
//   - 공정하게: 출발 자리를 무작위로 섞고, 처음 속도도 조금씩 다르게 준다. (1번이 늘 같은 자리면 유리하니까)
//   - 코스는 판마다 새로 만든다. 구간(핀밭·지그재그·풍차·범퍼·깔때기)의 순서를 섞고 좌우도 무작위로 뒤집는다.
//     모든 구슬이 같은 코스를 달리므로 공정함은 그대로다.
//   - 코스가 화면보다 훨씬 길어서, 카메라가 선두 구슬을 따라 내려간다.
//   - 그리기는 matter.js 기본 렌더러 대신 직접 캔버스에 한다. (구슬 번호·결승선을 자유롭게 그리고, 정리도 간단)
//
// 진행: 구슬이 출발 문 위에서 기다린다 → [출발!] → 3·2·1 → 문이 사라지고 출발 → 첫 도착 구슬이 당첨.
//
// matter.js 는 main.html 에서 <script> 로 불러온다. (window.Matter) 못 불러왔으면 mount 에서 오류를 던지고,
// 게이트(gameHub.js)가 받아서 "게임을 시작하지 못했어요" 를 보여 준다.
//
// 좌표: 코스 가로는 360, 세로는 구간에 따라 약 3200. 화면은 그중 가로 360 × 세로 460 만큼을 보여 준다.
//       y 는 아래로 갈수록 커진다. (캔버스·matter.js 공통)
// 게임 규약은 game/gameHub.js 맨 위 주석 참고. 스타일은 css/game.css 의 "마블" 부분.
import { t } from '../../util/i18n.js';

var WORLD_W = 360;
var VIEW_H = 460;
var START_H = 140;             // 출발 구역 높이. 출발 문은 GATE_Y 에 있다.
var GATE_Y = 100;

var MARBLE_R = 10;             // 구슬 반지름.
var PIN_R = 5;                 // 핀 반지름.
// 경사로 두께. 너무 얇으면(8px) 빠른 구슬이 한 번 계산하는 사이에 판을 뚫고 지나간다.
// 시뮬레이션(8개 × 30판): 두께 8 → 86번 뚫림, 16 + 계산 정밀도↑ → 2번 (끝 모서리를 스친 경우)
var RAMP_T = 16;
var STEP_MS = 1000 / 60;       // 물리 계산 한 번의 시간. 화면 주사율(60Hz, 144Hz…)과 상관없이 같은 속도로 굴러가게 고정.
var COUNTDOWN_MS = 600;        // 3·2·1 한 칸의 시간.
var FINISH_DELAY = 900;        // 첫 구슬이 도착한 뒤 결과창을 띄우기까지. 도착 장면을 볼 틈을 준다.
var RANK_UPDATE_MS = 250;      // 순위표를 고치는 간격. 매 프레임 고치면 비슷한 높이의 구슬끼리 덜덜 떨린다.

// 구슬 색. 흰 번호가 잘 보이는 진한 색. 후보는 최대 8개라 겹치지 않는다. (범례 점도 같은 색)
var COLORS = ['#e03131', '#f08c00', '#2f9e44', '#1971c2', '#7048e8', '#c2255c', '#0c8599', '#5c940d'];

// 코스 몸체 종류별 색.
var BODY_COLORS = { pin: '#adb5bd', ramp: '#868e96', bumper: '#f59f00', spinner: '#495057', gate: '#e8590c' };

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
        // 겹침·속도 보정을 기본(6, 4)보다 더 여러 번 해서 구슬이 판을 뚫거나 서로 파고들지 않게.
        engine = Matter.Engine.create({ positionIterations: 10, velocityIterations: 8 });

        // ── 화면: [캔버스 + 가운데 출발 버튼] + 범례 ──
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
        var course = buildCourse(Matter);
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

        // [출발!] → 3·2·1 → 문 열기.
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
                course.spinners.forEach(function (s) { Matter.Body.rotate(s.body, s.speed); });   // 풍차 돌리기.
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
                if (finished.indexOf(i) !== -1 || marbles[i].position.y < course.finishY) continue;
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

// ── 범례 ───────────────────────

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
// 코스 = 출발 구역 + 구간 여러 개 + 결승선. 구간은 각자 높이가 있고, 위에서부터 차례로 쌓는다.
//   순서: 핀밭 → [특별 구간] → 깔때기 → [특별 구간] → 핀밭 → [특별 구간] → 깔때기 → 결승선
//   특별 구간(지그재그·풍차·범퍼)은 판마다 순서를 섞고, 모든 구간은 반씩 확률로 좌우를 뒤집는다.
// 구간 함수는 (top, mirror) 를 받아 { height, shapes: [{ body, kind }], spinners: [{ body, speed }] } 를 만든다.

function buildCourse(Matter) {
    var special = shuffle([zigzagSection, windmillSection, bumperSection]);
    var plan = [pinSection, special[0], funnelSection, special[1], pinSection, special[2], funnelSection];

    var shapes = [];
    var spinners = [];
    var y = START_H;
    plan.forEach(function (section) {
        var part = section(Matter, y, Math.random() < 0.5);
        shapes = shapes.concat(part.shapes);
        spinners = spinners.concat(part.spinners || []);
        y += part.height;
    });

    var finishY = y + 60;
    var height = finishY + 80;

    // 양옆 벽과 바닥. 화면 밖에 두꺼운 상자를 둬서 구슬이 빠르게 부딪혀도 뚫고 나가지 않게. (그리지 않는다)
    var wallOptions = { isStatic: true, friction: 0, restitution: 0.3 };
    var walls = [
        Matter.Bodies.rectangle(-20, height / 2, 40, height * 2, wallOptions),
        Matter.Bodies.rectangle(WORLD_W + 20, height / 2, 40, height * 2, wallOptions),
        Matter.Bodies.rectangle(WORLD_W / 2, height + 20, WORLD_W, 40, wallOptions)
    ];
    walls.forEach(function (body) { shapes.push({ body: body, kind: 'wall' }); });

    return { shapes: shapes, spinners: spinners, finishY: finishY, height: height };
}

// mirror 면 x 를 좌우로 뒤집는다.
function mx(x, mirror) {
    return mirror ? WORLD_W - x : x;
}

// 핀밭: 56px 마다 한 줄, 50px 간격. 홀수 줄은 25px 밀어서 엇갈리게. (핀 사이 40px > 구슬 지름 20px 이라 끼지 않는다)
function pinSection(Matter, top) {
    var height = 480;
    var shapes = [];
    var row = 0;
    for (var y = top + 40; y < top + height - 20; y += 56, row++) {
        var offset = row % 2 === 0 ? 30 : 55;
        for (var x = offset; x < WORLD_W - 20; x += 50) {
            shapes.push({ body: Matter.Bodies.circle(x, y, PIN_R, { isStatic: true, restitution: 0.5, friction: 0 }), kind: 'pin' });
        }
    }
    return { height: height, shapes: shapes };
}

// 깔때기: 왼쪽 판은 오른쪽 아래로, 오른쪽 판은 왼쪽 아래로 기울여서 가운데 틈(약 78px)으로 모은다.
function funnelSection(Matter, top) {
    var y = top + 90;
    return {
        height: 180,
        shapes: [
            { body: Matter.Bodies.rectangle(70, y, 150, RAMP_T, { isStatic: true, angle: 0.35, friction: 0.02 }), kind: 'ramp' },
            { body: Matter.Bodies.rectangle(WORLD_W - 70, y, 150, RAMP_T, { isStatic: true, angle: -0.35, friction: 0.02 }), kind: 'ramp' }
        ]
    };
}

// 지그재그: 벽에서 반대쪽으로 내려가는 긴 경사로 4개를 번갈아 놓는다. 끝에 구슬이 빠질 틈(약 90px)이 있다.
function zigzagSection(Matter, top, mirror) {
    var shapes = [];
    for (var i = 0; i < 4; i++) {
        var fromLeft = (i % 2 === 0) !== mirror;          // 이 경사로가 왼쪽 벽에서 시작하는지.
        var x = fromLeft ? 135 : WORLD_W - 135;
        var angle = fromLeft ? 0.3 : -0.3;
        shapes.push({ body: Matter.Bodies.rectangle(x, top + 80 + i * 150, 270, RAMP_T, { isStatic: true, angle: angle, friction: 0.01 }), kind: 'ramp' });
    }
    return { height: 640, shapes: shapes };
}

// 풍차: 계속 도는 막대 3개. 위 줄 2개는 서로 반대로, 아래 줄 1개는 길고 느리게. 사이에 핀 몇 개.
function windmillSection(Matter, top, mirror) {
    var shapes = [];
    var spinners = [];
    function addSpinner(x, y, length, speed) {
        var body = Matter.Bodies.rectangle(mx(x, mirror), y, length, 14, { isStatic: true, friction: 0.05, restitution: 0.4 });
        shapes.push({ body: body, kind: 'spinner' });
        spinners.push({ body: body, speed: mirror ? -speed : speed });   // 뒤집으면 도는 방향도 뒤집는다.
    }
    addSpinner(105, top + 130, 110, 0.035);
    addSpinner(255, top + 130, 110, -0.035);
    addSpinner(180, top + 380, 150, 0.022);
    [60, 180, 300].forEach(function (x) {
        shapes.push({ body: Matter.Bodies.circle(mx(x, mirror), top + 255, PIN_R, { isStatic: true, restitution: 0.5 }), kind: 'pin' });
    });
    return { height: 520, shapes: shapes, spinners: spinners };
}

// 범퍼: 크고 잘 튕기는 원들. 부딪히면 크게 튀어서 순위가 뒤집히기 쉽다.
function bumperSection(Matter, top, mirror) {
    var spots = [[90, 100], [270, 100], [180, 210], [60, 320], [300, 320]];
    var shapes = spots.map(function (p) {
        var body = Matter.Bodies.circle(mx(p[0], mirror), top + p[1], 22, { isStatic: true, restitution: 0.9, friction: 0 });
        return { body: body, kind: 'bumper' };
    });
    return { height: 440, shapes: shapes };
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
            frictionAir: 0.008,     // 공기 저항. 너무 빨라지지 않게.
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
    ctx.clearRect(0, 0, WORLD_W, VIEW_H);
    ctx.save();
    ctx.translate(0, -cameraY);                    // 카메라만큼 코스를 위로 올려서 그린다.

    drawFinishLine(ctx, course.finishY);

    course.shapes.forEach(function (shape) {
        if (shape.kind === 'wall') return;
        if (!isVisible(shape.body.position.y, cameraY, 100)) return;   // 안 보이는 건 그리지 않아 가볍게.
        ctx.fillStyle = BODY_COLORS[shape.kind];
        if (shape.body.circleRadius) {             // 원(핀·범퍼)
            ctx.beginPath();
            ctx.arc(shape.body.position.x, shape.body.position.y, shape.body.circleRadius, 0, Math.PI * 2);
            ctx.fill();
        } else {                                   // 기울어진 사각형(경사로·풍차·문)은 꼭짓점을 이어 그린다.
            fillPolygon(ctx, shape.body.vertices);
        }
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
        ctx.strokeStyle = '#fff';
        ctx.strokeText(countdownText, WORLD_W / 2, VIEW_H / 2);
        ctx.fillStyle = '#e8590c';
        ctx.fillText(countdownText, WORLD_W / 2, VIEW_H / 2);
    }
}

// 결승선: 체크무늬 띠.
function drawFinishLine(ctx, finishY) {
    var size = 10;
    for (var x = 0; x < WORLD_W; x += size) {
        for (var row = 0; row < 2; row++) {
            ctx.fillStyle = ((x / size + row) % 2 === 0) ? '#212529' : '#fff';
            ctx.fillRect(x, finishY - size + row * size, size, size);
        }
    }
}

// 구슬 하나: 색 원 + 흰 번호. 번호 = 후보 순서 + 1. 당첨 구슬은 금색 테두리.
function drawMarble(ctx, marble, i, isWinner) {
    var p = marble.position;
    ctx.beginPath();
    ctx.arc(p.x, p.y, MARBLE_R, 0, Math.PI * 2);
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    if (isWinner) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fcc419';
        ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), p.x, p.y + 0.5);
}

function fillPolygon(ctx, vertices) {
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (var i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
    ctx.closePath();
    ctx.fill();
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
