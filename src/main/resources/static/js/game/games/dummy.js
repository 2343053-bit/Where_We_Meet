// 흐름 확인용 가짜 게임. 버튼을 누르면 아무 후보나 당첨시킨다.
// 게이트(gameHub.js) → 결과창 → 지도 이동이 잘 되는지 보려고 만든 것. 진짜 게임(제비뽑기)이 생기면 지운다.
var container = null;

export default {
    id: 'dummy',
    labelKey: 'game.dummy',
    minCount: 2,
    maxCount: 8,

    mount: function (target, names, onFinish) {
        container = target;
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = '랜덤 뽑기 (테스트용)';
        button.addEventListener('click', function () {
            button.disabled = true;
            onFinish(Math.floor(Math.random() * names.length));   // 0 ~ (후보 수 - 1) 중 하나.
        });
        container.appendChild(button);
    },

    unmount: function () {
        if (container) container.replaceChildren();
        container = null;
    }
};
