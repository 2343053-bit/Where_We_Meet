// 마블 룰렛. 후보마다 구슬 하나를 긴 코스 위에서 굴려서, 결승선을 가장 먼저 넘은 구슬이 당첨.
//
// 룰렛과 달리 결과를 미리 정하지 않는다. 물리 엔진(matter.js)이 실제로 굴린 결과 그대로가 당첨이다.
//   - 공정하게: 출발 자리를 무작위로 섞고, 처음 속도도 조금씩 다르게 준다. (1번이 늘 같은 자리면 유리하니까)
//   - 코스가 화면보다 훨씬 길어서, 카메라가 선두 구슬을 따라 내려간다.
//   - 그리기는 matter.js 기본 렌더러 대신 직접 캔버스에 한다. (구슬 번호·결승선을 자유롭게 그리고, 정리도 간단)
//
// matter.js 는 main.html 에서 <script> 로 불러온다. (window.Matter) 못 불러왔으면 mount 에서 오류를 던지고,
// 게이트(gameHub.js)가 받아서 "게임을 시작하지 못했어요" 를 보여 준다.
//
// 좌표: 코스 전체(WORLD)는 가로 360 × 세로 3600. 화면(VIEW)은 그중 가로 360 × 세로 460 만큼을 보여 준다.
//       y 는 아래로 갈수록 커진다. (캔버스·matter.js 공통)
// 게임 규약은 game/gameHub.js 맨 위 주석 참고. 스타일은 css/game.css 의 "마블" 부분.

var WORLD_W = 360;
var WORLD_H = 3600;
var VIEW_H = 460;
var FINISH_Y = WORLD_H - 80;   // 결승선. 구슬 중심이 이 아래로 내려가면 도착.

var MARBLE_R = 10;             // 구슬 반지름.
var PIN_R = 5;                 // 핀 반지름.
var STEP_MS = 1000 / 60;       // 물리 계산 한 번의 시간. 화면 주사율(60Hz, 144Hz…)과 상관없이 같은 속도로 굴러가게 고정.
var FINISH_DELAY = 900;        // 첫 구슬이 도착한 뒤 결과창을 띄우기까지. 도착 장면을 볼 틈을 준다.

// 구슬 색. 흰 번호가 잘 보이는 진한 색. 후보는 최대 8개라 겹치지 않는다.
var COLORS = ['#e03131', '#f08c00', '#2f9e44', '#1971c2', '#7048e8', '#c2255c', '#0c8599', '#5c940d'];

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
        engine = Matter.Engine.create();

        var canvas = document.createElement('canvas');
        canvas.className = 'game-marble__canvas';
        var dpr = window.devicePixelRatio || 1;        // 고해상도 화면에서 흐리지 않게 실제 픽셀을 그만큼 늘린다.
        canvas.width = WORLD_W * dpr;
        canvas.height = VIEW_H * dpr;
        var ctx = canvas.getContext('2d');

        var course = buildCourse(Matter);              // 벽·핀·깔때기 (움직이지 않는 몸체들)
        var marbles = createMarbles(Matter, names.length);
        Matter.Composite.add(engine.world, course.walls.concat(course.pins, course.ramps, marbles));

        var cameraY = 0;          // 화면 맨 위가 코스의 어느 높이인지.
        var winnerIndex = -1;     // 아직 아무도 도착 안 했으면 -1.

        // 한 프레임: 밀린 시간만큼 물리 계산 → 도착 확인 → 카메라 이동 → 그리기.
        var lastTime = performance.now();
        var pending = 0;          // 아직 계산 안 한 시간. (ms)
        function frame(now) {
            pending += Math.min(now - lastTime, 100);   // 탭을 오래 비웠다 돌아와도 한꺼번에 너무 많이 계산하지 않게 100ms 까지만.
            lastTime = now;
            while (pending >= STEP_MS) {
                Matter.Engine.update(engine, STEP_MS);
                pending -= STEP_MS;
                checkFinish();
            }
            cameraY = followLeader(cameraY, marbles);
            draw(ctx, dpr, cameraY, course, marbles, winnerIndex);
            rafId = requestAnimationFrame(frame);
        }

        // 결승선을 처음 넘은 구슬을 당첨으로. 그 뒤로는 확인하지 않는다. (onFinish 는 한 번만)
        function checkFinish() {
            if (winnerIndex !== -1) return;
            for (var i = 0; i < marbles.length; i++) {
                if (marbles[i].position.y >= FINISH_Y) {
                    winnerIndex = i;
                    later(function () { onFinish(winnerIndex); }, FINISH_DELAY);
                    return;
                }
            }
        }

        container.appendChild(canvas);
        rafId = requestAnimationFrame(frame);
    },

    unmount: function () {
        cancelAnimationFrame(rafId);          // 그리기·물리 계산 멈춤.
        rafId = 0;
        timers.forEach(clearTimeout);         // 늦게 onFinish 가 불리지 않게.
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

// ── 코스 ───────────────────────

// 움직이지 않는 몸체들을 만든다. 무작위가 아니라 항상 같은 코스. (공정함은 출발 자리를 섞어서 맞춘다)
//   0 ~ 120      : 출발 구역
//   핀밭          : 엇갈린 핀 줄 (깔때기 근처는 비운다)
//   깔때기 4곳    : FUNNEL_YS (양쪽 벽에서 가운데로 기울어진 판)
//   FINISH_Y     : 결승선, 그 아래 바닥
function buildCourse(Matter) {
    var Bodies = Matter.Bodies;
    var wallOptions = { isStatic: true, friction: 0, restitution: 0.3 };

    // 양옆 벽과 바닥. 화면 밖에 두꺼운 상자를 둬서 구슬이 빠르게 부딪혀도 뚫고 나가지 않게.
    var walls = [
        Bodies.rectangle(-20, WORLD_H / 2, 40, WORLD_H * 2, wallOptions),
        Bodies.rectangle(WORLD_W + 20, WORLD_H / 2, 40, WORLD_H * 2, wallOptions),
        Bodies.rectangle(WORLD_W / 2, WORLD_H + 20, WORLD_W, 40, wallOptions)
    ];

    // 깔때기: 왼쪽 판은 오른쪽 아래로, 오른쪽 판은 왼쪽 아래로 기울여서 가운데 틈(약 78px)으로 모은다.
    var FUNNEL_YS = [700, 1450, 2200, 2950];
    var ramps = [];
    FUNNEL_YS.forEach(function (y) {
        ramps.push(Bodies.rectangle(70, y, 150, 8, { isStatic: true, angle: 0.35, friction: 0.02 }));
        ramps.push(Bodies.rectangle(WORLD_W - 70, y, 150, 8, { isStatic: true, angle: -0.35, friction: 0.02 }));
    });

    // 핀: 56px 마다 한 줄, 50px 간격. 홀수 줄은 25px 밀어서 엇갈리게. (핀 사이 40px > 구슬 지름 20px 이라 끼지 않는다)
    var pins = [];
    var row = 0;
    for (var y = 160; y < FINISH_Y - 60; y += 56, row++) {
        var nearFunnel = FUNNEL_YS.some(function (fy) { return Math.abs(y - fy) < 70; });
        if (nearFunnel) continue;
        var offset = row % 2 === 0 ? 30 : 55;
        for (var x = offset; x < WORLD_W - 20; x += 50) {
            pins.push(Bodies.circle(x, y, PIN_R, { isStatic: true, restitution: 0.5, friction: 0 }));
        }
    }

    return { walls: walls, ramps: ramps, pins: pins };
}

// 구슬들. marbles[i] = names[i] 의 구슬. 출발 자리만 섞는다.
function createMarbles(Matter, count) {
    var slots = shuffledIndexes(count);   // 구슬 i 는 slots[i] 번째 자리에서 출발.
    var gap = (WORLD_W - 80) / Math.max(count - 1, 1);
    var marbles = [];
    for (var i = 0; i < count; i++) {
        var x = 40 + slots[i] * gap + (Math.random() - 0.5) * 6;   // 자리 + 살짝 흔들기.
        var marble = Matter.Bodies.circle(x, 60, MARBLE_R, {
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

// 가장 아래(= 앞서가는) 구슬이 화면 위에서 40% 쯤에 오도록 카메라를 부드럽게 옮긴다.
function followLeader(cameraY, marbles) {
    var leaderY = 0;
    marbles.forEach(function (m) { leaderY = Math.max(leaderY, m.position.y); });
    var target = clamp(leaderY - VIEW_H * 0.4, 0, WORLD_H - VIEW_H);
    return cameraY + (target - cameraY) * 0.1;   // 한 번에 다 가지 않고 10% 씩 → 덜컹거리지 않는다.
}

// ── 그리기 ───────────────────────

function draw(ctx, dpr, cameraY, course, marbles, winnerIndex) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);       // 이후 좌표는 CSS 픽셀 기준.
    ctx.clearRect(0, 0, WORLD_W, VIEW_H);
    ctx.save();
    ctx.translate(0, -cameraY);                    // 카메라만큼 코스를 위로 올려서 그린다.

    drawFinishLine(ctx);

    ctx.fillStyle = '#adb5bd';                     // 핀
    course.pins.forEach(function (pin) {
        if (!isVisible(pin.position.y, cameraY, PIN_R)) return;
        ctx.beginPath();
        ctx.arc(pin.position.x, pin.position.y, PIN_R, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#868e96';                     // 깔때기 판. 기울어진 사각형이라 꼭짓점(vertices)을 이어 그린다.
    course.ramps.forEach(function (ramp) {
        if (!isVisible(ramp.position.y, cameraY, 80)) return;
        fillPolygon(ctx, ramp.vertices);
    });

    marbles.forEach(function (marble, i) {
        drawMarble(ctx, marble, i, i === winnerIndex);
    });

    ctx.restore();
}

// 결승선: 체크무늬 띠.
function drawFinishLine(ctx) {
    var size = 10;
    for (var x = 0; x < WORLD_W; x += size) {
        for (var row = 0; row < 2; row++) {
            ctx.fillStyle = ((x / size + row) % 2 === 0) ? '#212529' : '#fff';
            ctx.fillRect(x, FINISH_Y - size + row * size, size, size);
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

// 화면에 보이는 높이인지. (안 보이는 핀은 그리지 않아 가볍게)
function isVisible(y, cameraY, margin) {
    return y + margin >= cameraY && y - margin <= cameraY + VIEW_H;
}

// ── 도구 ───────────────────────

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// 0 ~ count-1 을 무작위 순서로 섞은 배열. (피셔-예이츠 셔플, lottery.js 와 같은 방식)
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
