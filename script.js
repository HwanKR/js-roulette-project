// --- DOM 요소 가져오기 ---
const $canvas = document.getElementById('roulette-canvas');
const $spinButton = document.getElementById('spin-button');
const $optionForm = document.getElementById('option-form');
const $optionInput = document.getElementById('option-input');
const $weightInput = document.getElementById('weight-input');
const $optionList = document.getElementById('option-list');
// 모달 관련 요소
const $editModal = document.getElementById('edit-modal');
const $modalForm = document.getElementById('modal-form');
const $modalOptionInput = document.getElementById('modal-option-input');
const $modalWeightInput = document.getElementById('modal-weight-input');
const $cancelEditButton = document.getElementById('cancel-edit');

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

// --- 애플리케이션 상태 관리 ---
const state = {
  options: [
    { text: '한식', weight: 2 },
    { text: '일식', weight: 1 },
    { text: '중식', weight: 1.5 },
  ],
  currentAngle: 0,
  isSpinning: false,
  editingIndex: null, // 현재 수정 중인 옵션의 인덱스
};

// --- 데이터 처리 함수 ---
const storageKey = 'rouletteOptionsWeighted_v1';
function loadOptions() {
  const savedOptions = localStorage.getItem(storageKey);
  if (savedOptions) {
    state.options = JSON.parse(savedOptions);
  }
}

function saveOptions() {
  localStorage.setItem(storageKey, JSON.stringify(state.options));
}

// --- 렌더링 및 UI 업데이트 함수 ---
function drawRoulette() {
  const totalWeight = state.options.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight <= 0) return;

  const centerX = $canvas.width / 2;
  const centerY = $canvas.height / 2;
  const radius = $canvas.width / 2 - 10;

  let currentDrawingAngle = 0;

  ctx.clearRect(0, 0, $canvas.width, $canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(state.currentAngle);

  state.options.forEach((option, i) => {
    const arcSize = (option.weight / totalWeight) * 2 * Math.PI;
    const endDrawingAngle = currentDrawingAngle + arcSize;

    ctx.beginPath();
    ctx.arc(0, 0, radius, currentDrawingAngle, endDrawingAngle, false);
    ctx.arc(0, 0, 0, endDrawingAngle, currentDrawingAngle, true);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.save();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textAngle = currentDrawingAngle + arcSize / 2;
    ctx.rotate(textAngle);
    ctx.fillText(option.text, radius * 0.6, 0);
    ctx.restore();

    currentDrawingAngle = endDrawingAngle;
  });
  ctx.restore();
}

function updateOptionListUI() {
  $optionList.innerHTML = '';
  state.options.forEach((option, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
            <div class="option-details">
                <span class="option-text">${option.text}</span>
                <span class="option-weight">비중: ${option.weight}</span>
            </div>
            <div class="option-controls">
                <button class="edit-btn" data-index="${index}" aria-label="수정">✏️</button>
                <button class="delete-btn" data-index="${index}" aria-label="삭제">🗑️</button>
            </div>
        `;
    $optionList.appendChild(li);
  });
}

function render() {
  drawRoulette();
  updateOptionListUI();
}

// --- 이벤트 핸들러 및 로직 함수 ---
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

function handleListClick(e) {
  const editBtn = e.target.closest('.edit-btn');
  const deleteBtn = e.target.closest('.delete-btn');

  if (editBtn) {
    const index = parseInt(editBtn.dataset.index, 10);
    openEditModal(index);
  } else if (deleteBtn) {
    const index = parseInt(deleteBtn.dataset.index, 10);
    removeOption(index);
  }
}

function removeOption(index) {
  if (state.options.length > 2) {
    state.options.splice(index, 1);
    saveOptions();
    render();
  } else {
    alert('최소 2개의 옵션이 필요합니다.');
  }
}

// 모달 관련 함수
function openEditModal(index) {
  state.editingIndex = index;
  const option = state.options[index];
  $modalOptionInput.value = option.text;
  $modalWeightInput.value = option.weight;
  $editModal.classList.add('visible');
}

function closeEditModal() {
  state.editingIndex = null;
  $editModal.classList.remove('visible');
}

function handleEditSubmit(e) {
  e.preventDefault();
  const newText = $modalOptionInput.value.trim();
  const newWeight = parseFloat($modalWeightInput.value) || 1;

  if (newText && newWeight > 0 && state.editingIndex !== null) {
    state.options[state.editingIndex] = { text: newText, weight: newWeight };
    saveOptions();
    render();
    closeEditModal();
  }
}

// 회전 관련 함수
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
  if (!winner) {
    winner = state.options[state.options.length - 1]?.text || '결과 없음';
  }

  setTimeout(() => {
    alert(`🎉 당첨: ${winner} 🎉`);
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
  }, 100);
}

// --- 초기화 및 이벤트 리스너 등록 ---
function init() {
  loadOptions();
  render();

  $optionForm.addEventListener('submit', addOption);
  $spinButton.addEventListener('click', spin);
  $optionList.addEventListener('click', handleListClick); // 이벤트 위임
  $modalForm.addEventListener('submit', handleEditSubmit);
  $cancelEditButton.addEventListener('click', closeEditModal);
  // 모달 바깥 영역 클릭 시 닫기
  $editModal.addEventListener('click', (e) => {
    if (e.target === $editModal) {
      closeEditModal();
    }
  });
}

init();
