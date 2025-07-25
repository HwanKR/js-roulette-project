// DOM 요소 가져오기
const $canvas = document.getElementById('roulette-canvas');
const $spinButton = document.getElementById('spin-button');
const $optionForm = document.getElementById('option-form');
const $optionInput = document.getElementById('option-input');
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

// 애플리케이션의 상태 관리 객체
const state = {
  options: ['옵션 1', '옵션 2', '옵션 3', '옵션 4'],
  currentAngle: 0,
  isSpinning: false,
};

// 로컬 스토리지에서 옵션 불러오기
function loadOptions() {
  const savedOptions = localStorage.getItem('rouletteOptions');
  if (savedOptions) {
    state.options = JSON.parse(savedOptions);
  }
}

// 로컬 스토리지에 옵션 저장하기
function saveOptions() {
  localStorage.setItem('rouletteOptions', JSON.stringify(state.options));
}

// 룰렛 그리기 함수
function drawRoulette() {
  const arcSize = (2 * Math.PI) / state.options.length;
  const centerX = $canvas.width / 2;
  const centerY = $canvas.height / 2;
  const radius = $canvas.width / 2 - 10;

  ctx.clearRect(0, 0, $canvas.width, $canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(state.currentAngle);

  state.options.forEach((option, i) => {
    const angle = i * arcSize;
    ctx.beginPath();
    ctx.arc(0, 0, radius, angle, angle + arcSize, false);
    ctx.arc(0, 0, 0, angle + arcSize, angle, true);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // 텍스트 그리기
    ctx.save();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.rotate(angle + arcSize / 2);
    ctx.fillText(option, radius * 0.6, 0);
    ctx.restore();
  });
  ctx.restore();
}

// 옵션 리스트 UI 업데이트
function updateOptionListUI() {
  $optionList.innerHTML = '';
  state.options.forEach((option, index) => {
    const li = document.createElement('li');
    li.textContent = option;
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => removeOption(index);
    li.appendChild(deleteBtn);
    $optionList.appendChild(li);
  });
}

// 옵션 추가
function addOption(e) {
  e.preventDefault();
  const newOption = $optionInput.value.trim();
  if (newOption && state.options.length < 12) {
    // 최대 12개 옵션
    state.options.push(newOption);
    $optionInput.value = '';
    saveOptions();
    render();
  }
}

// 옵션 제거
function removeOption(index) {
  if (state.options.length > 2) {
    // 최소 2개 옵션 유지
    state.options.splice(index, 1);
    saveOptions();
    render();
  } else {
    alert('최소 2개의 옵션이 필요합니다.');
  }
}

// 회전 애니메이션
function spin() {
  if (state.isSpinning) return;
  state.isSpinning = true;
  $spinButton.disabled = true;

  const totalRotation = Math.random() * 360 + 360 * 5; // 최소 5바퀴 + 랜덤 회전
  const duration = 5000; // 5초
  let startTime = null;

  function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    // ease-out-cubic 효과
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

  // 효과음 재생 (필요시 주석 해제)
  // new Audio('spin_sound.mp3').play();
  requestAnimationFrame(animate);
}

// 회전 종료 및 결과 처리
function finishSpin() {
  state.isSpinning = false;
  $spinButton.disabled = false;

  const totalAngle = (state.currentAngle * 180) / Math.PI;
  const degreesPerOption = 360 / state.options.length;
  // 화살표가 가리키는 위치 (90도 보정)
  const winningAngle = (360 - (totalAngle % 360) + 270) % 360;
  const winningIndex = Math.floor(winningAngle / degreesPerOption);
  const winner = state.options[winningIndex];

  setTimeout(() => {
    alert(`🎉 당첨: ${winner} 🎉`);
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
    // new Audio('win_sound.mp3').play();
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
