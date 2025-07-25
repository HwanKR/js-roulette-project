// DOM 요소 가져오기
const $canvas = document.getElementById('roulette-canvas');
const $spinButton = document.getElementById('spin-button');
const $optionForm = document.getElementById('option-form');
const $optionInput = document.getElementById('option-input');
const $weightInput = document.getElementById('weight-input'); // 비중 입력 필드 추가
const $optionList = document.getElementById('option-list');

const ctx = $canvas.getContext('2d');
const colors = [
  '#F8B195',
  '#F67280',
  '#C06C84',
  '#6C5B7B',
  '#355C7D',
  '#99B898',
  '#FECEAB',
  '#FF847C',
];

// 애플리케이션의 상태 관리 객체 (옵션 구조 변경)
const state = {
  options: [
    { text: '한식', weight: 2 },
    { text: '일식', weight: 1 },
    { text: '중식', weight: 1.5 },
  ],
  currentAngle: 0,
  isSpinning: false,
};

// 로컬 스토리지에서 옵션 불러오기
function loadOptions() {
  const savedOptions = localStorage.getItem('rouletteOptionsWeighted');
  if (savedOptions) {
    state.options = JSON.parse(savedOptions);
  }
}

// 로컬 스토리지에 옵션 저장하기
function saveOptions() {
  localStorage.setItem(
    'rouletteOptionsWeighted',
    JSON.stringify(state.options)
  );
}

// 룰렛 그리기 함수 (비중 기반으로 로직 변경)
function drawRoulette() {
  const totalWeight = state.options.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight <= 0) return;

  const centerX = $canvas.width / 2;
  const centerY = $canvas.height / 2;
  const radius = $canvas.width / 2 - 10;

  let currentDrawingAngle = 0; // 각 조각의 시작 각도

  ctx.clearRect(0, 0, $canvas.width, $canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(state.currentAngle); // 전체 회전 적용

  state.options.forEach((option, i) => {
    const arcSize = (option.weight / totalWeight) * 2 * Math.PI;
    const endDrawingAngle = currentDrawingAngle + arcSize;

    // 조각 그리기
    ctx.beginPath();
    ctx.arc(0, 0, radius, currentDrawingAngle, endDrawingAngle, false);
    ctx.arc(0, 0, 0, endDrawingAngle, currentDrawingAngle, true);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // 텍스트 그리기
    ctx.save();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textAngle = currentDrawingAngle + arcSize / 2;
    ctx.rotate(textAngle);
    ctx.fillText(option.text, radius * 0.6, 0);
    ctx.restore();

    currentDrawingAngle = endDrawingAngle; // 다음 조각을 위해 시작 각도 업데이트
  });
  ctx.restore();
}

// 옵션 리스트 UI 업데이트 (비중 표시)
function updateOptionListUI() {
  $optionList.innerHTML = '';
  state.options.forEach((option, index) => {
    const li = document.createElement('li');
    const content = document.createElement('span');
    content.textContent = `${option.text} (비중: ${option.weight})`;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => removeOption(index);

    li.appendChild(content);
    li.appendChild(deleteBtn);
    $optionList.appendChild(li);
  });
}

// 옵션 추가 (비중 값 포함)
function addOption(e) {
  e.preventDefault();
  const newOption = $optionInput.value.trim();
  const weight = parseFloat($weightInput.value) || 1;
  if (newOption && weight > 0 && state.options.length < 12) {
    state.options.push({ text: newOption, weight: weight });
    $optionInput.value = '';
    $weightInput.value = '1';
    saveOptions();
    render();
  }
}

// 옵션 제거
function removeOption(index) {
  if (state.options.length > 2) {
    state.options.splice(index, 1);
    saveOptions();
    render();
  } else {
    alert('최소 2개의 옵션이 필요합니다.');
  }
}

// 회전 애니메이션 (변경 없음)
function spin() {
  if (state.isSpinning) return;
  state.isSpinning = true;
  $spinButton.disabled = true;

  const totalRotation = Math.random() * 360 + 360 * 5;
  const duration = 5000;
  let startTime = null;

  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const rotation = totalRotation * easeProgress;
    state.currentAngle = (rotation * Math.PI) / 180;

    drawRoulette();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin();
    }
  }

  requestAnimationFrame(animate);
}

// 회전 종료 및 결과 처리 (비중 기반으로 로직 변경)
function finishSpin() {
  state.isSpinning = false;
  $spinButton.disabled = false;

  const totalWeight = state.options.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight <= 0) return;

  const finalAngleInDegrees = (state.currentAngle * 180) / Math.PI;
  const pointerAngle = (360 - (finalAngleInDegrees % 360) + 270) % 360;

  let cumulativeAngle = 0;
  let winner = null;

  for (const option of state.options) {
    const optionAngle = (option.weight / totalWeight) * 360;
    if (
      pointerAngle >= cumulativeAngle &&
      pointerAngle < cumulativeAngle + optionAngle
    ) {
      winner = option.text;
      break;
    }
    cumulativeAngle += optionAngle;
  }

  // 혹시 모를 오차를 위한 폴백
  if (!winner) {
    winner = state.options[state.options.length - 1].text;
  }

  setTimeout(() => {
    alert(`🎉 당첨: ${winner} 🎉`);
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
  }, 100);
}

// 전체 렌더링 함수
function render() {
  drawRoulette();
  updateOptionListUI();
}

// 이벤트 리스너 등록
$spinButton.addEventListener('click', spin);
$optionForm.addEventListener('submit', addOption);

// 초기화
function init() {
  loadOptions();
  render();
}

init();
