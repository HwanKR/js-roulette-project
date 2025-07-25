// --- DOM 요소 가져오기 ---
const $canvas = document.getElementById('roulette-canvas');
const $spinButton = document.getElementById('spin-button');
const $optionForm = document.getElementById('option-form');
const $optionInput = document.getElementById('option-input');
const $weightInput = document.getElementById('weight-input');
const $colorInput = document.getElementById('color-input');
const $optionList = document.getElementById('option-list');
const $resetButton = document.getElementById('reset-button');
const $editModal = document.getElementById('edit-modal');
const $modalForm = document.getElementById('modal-form');
const $modalOptionInput = document.getElementById('modal-option-input');
const $modalWeightInput = document.getElementById('modal-weight-input');
const $modalColorInput = document.getElementById('modal-color-input');
const $cancelEditButton = document.getElementById('cancel-edit');

const ctx = $canvas.getContext('2d');

// --- 애플리케이션 상태 및 설정 ---
const state = {
  options: [],
  totalRotation: 0,
  isSpinning: false,
  editingIndex: null,
};

const defaultColors = [
  '#F8B195',
  '#F67280',
  '#C06C84',
  '#6C5B7B',
  '#355C7D',
  '#99B898',
  '#FECEAB',
  '#FF847C',
];

// 기본 옵션에 의미있는 텍스트 추가
const getInitialOptions = () => [
  { text: '옵션 1', weight: 1, color: '#F8B195' },
  { text: '옵션 2', weight: 1, color: '#F67280' },
];

const storageKey = 'rouletteOptions_final_v3';

// --- 데이터 처리 함수 ---
const loadOptions = () => {
  const savedOptions = localStorage.getItem(storageKey);
  state.options = savedOptions ? JSON.parse(savedOptions) : getInitialOptions();
};

const saveOptions = () => {
  localStorage.setItem(storageKey, JSON.stringify(state.options));
};

const getRandomColor = () => {
  const usedColors = state.options.map((opt) => opt.color);
  const availableColors = defaultColors.filter((c) => !usedColors.includes(c));
  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
  );
};

// --- 렌더링 및 UI 업데이트 함수 ---
const drawRoulette = () => {
  const totalWeight = state.options.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight <= 0) {
    ctx.clearRect(0, 0, $canvas.width, $canvas.height);
    return;
  }

  const centerX = $canvas.width / 2;
  const centerY = $canvas.height / 2;
  const radius = $canvas.width / 2;

  ctx.clearRect(0, 0, $canvas.width, $canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);

  let currentAngle = -Math.PI / 2; // 12시 방향에서 시작
  const segments = [];

  // 1단계: 조각 정보 계산 및 색상 조각 그리기
  for (let i = 0; i < state.options.length; i++) {
    const option = state.options[i];
    const arcSize = (option.weight / totalWeight) * 2 * Math.PI;
    const endAngle = currentAngle + arcSize;

    // 조각 정보 저장
    segments.push({
      option,
      startAngle: currentAngle,
      endAngle: endAngle,
      arcSize: arcSize,
      centerAngle: currentAngle + arcSize / 2,
    });

    // 색상 조각 그리기
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, currentAngle, endAngle, false);
    ctx.closePath();
    ctx.fillStyle = option.color;
    ctx.fill();

    // 조각 경계선 그리기
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos(currentAngle) * radius,
      Math.sin(currentAngle) * radius
    );
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle = endAngle;
  }

  // 마지막 경계선 그리기
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(currentAngle) * radius, Math.sin(currentAngle) * radius);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2단계: 텍스트 그리기
  for (const segment of segments) {
    const { option, centerAngle, arcSize } = segment;

    // 조각이 너무 작으면 텍스트 생략
    const minAngleForText = Math.PI / 8; // 22.5도로 조정 (더 많은 텍스트 표시)
    if (arcSize < minAngleForText || !option.text.trim()) {
      continue;
    }

    ctx.save();

    // 텍스트 스타일 설정
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 조각 크기에 따른 폰트 크기 조정
    let fontSize = 16;
    if (arcSize < Math.PI / 6) {
      // 30도 미만
      fontSize = 10;
    } else if (arcSize < Math.PI / 4) {
      // 45도 미만
      fontSize = 12;
    } else if (arcSize < Math.PI / 3) {
      // 60도 미만
      fontSize = 14;
    }

    ctx.font = `bold ${fontSize}px sans-serif`;

    // 텍스트 위치 계산
    const textRadius = radius * 0.65;
    const textX = Math.cos(centerAngle) * textRadius;
    const textY = Math.sin(centerAngle) * textRadius;

    ctx.translate(textX, textY);
    let rotationAngle = centerAngle;

    // 텍스트가 뒤집히지 않도록 조정
    if (centerAngle > Math.PI / 2 && centerAngle < (3 * Math.PI) / 2) {
      rotationAngle += Math.PI;
    }

    ctx.rotate(rotationAngle);

    // 텍스트 길이 조정
    let displayText = option.text;
    const maxLength = Math.max(3, Math.floor(arcSize * 6));

    if (displayText.length > maxLength) {
      displayText = displayText.substring(0, maxLength - 2) + '..';
    }

    // 텍스트 그리기
    ctx.strokeText(displayText, 0, 0);
    ctx.fillText(displayText, 0, 0);

    ctx.restore();
  }

  ctx.restore();
};

const updateOptionListUI = () => {
  $optionList.innerHTML = '';
  state.options.forEach((option, index) => {
    const li = document.createElement('li');
    li.dataset.index = index;
    li.innerHTML = `
      <div class="option-details">
        <div class="color-swatch" style="background-color: ${
          option.color
        };"></div>
        <div class="option-text-details">
          <span class="option-text">${option.text || '(이름 없음)'}</span>
          <span class="option-weight">비중: ${option.weight}</span>
        </div>
      </div>
      <div class="option-controls">
        <button class="edit-btn" aria-label="수정">✏️</button>
        <button class="delete-btn" aria-label="삭제">🗑️</button>
      </div>
    `;
    $optionList.appendChild(li);
  });
};

const render = () => {
  drawRoulette();
  updateOptionListUI();
};

// --- 이벤트 핸들러 및 로직 함수 ---
const addOption = (e) => {
  e.preventDefault();
  const newOptionText = $optionInput.value.trim();
  const weight = parseFloat($weightInput.value);

  if (!newOptionText || !(weight > 0)) {
    alert('옵션명과 유효한 비중 값을 입력해주세요.');
    return;
  }

  const newOption = { text: newOptionText, weight, color: $colorInput.value };

  // 기본 옵션을 제거하지 않고 그대로 유지
  state.options.push(newOption);

  $optionInput.value = '';
  $weightInput.value = '1';
  $colorInput.value = getRandomColor();
  saveOptions();
  render();
};

const handleListClick = (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const index = parseInt(li.dataset.index, 10);

  if (e.target.closest('.edit-btn')) {
    openEditModal(index);
  } else if (e.target.closest('.delete-btn')) {
    removeOption(index);
  }
};

const removeOption = (index) => {
  if (state.options.length <= 2) {
    alert('최소 2개의 옵션이 필요합니다.');
    return;
  }
  state.options.splice(index, 1);
  saveOptions();
  render();
};

const resetOptions = () => {
  if (confirm('모든 옵션을 초기 설정으로 되돌리시겠습니까?')) {
    state.options = getInitialOptions();
    state.totalRotation = 0;
    $canvas.style.transition = 'none';
    $canvas.style.transform = 'rotate(0deg)';
    saveOptions();
    render();
  }
};

const openEditModal = (index) => {
  state.editingIndex = index;
  const option = state.options[index];
  $modalOptionInput.value = option.text;
  $modalWeightInput.value = option.weight;
  $modalColorInput.value = option.color;
  $editModal.classList.add('visible');
};

const closeEditModal = () => {
  state.editingIndex = null;
  $editModal.classList.remove('visible');
};

const handleEditSubmit = (e) => {
  e.preventDefault();
  const newText = $modalOptionInput.value.trim();
  const newWeight = parseFloat($modalWeightInput.value);

  if (!newText || !(newWeight > 0)) {
    alert('옵션명과 유효한 비중 값을 입력해주세요.');
    return;
  }

  state.options[state.editingIndex] = {
    text: newText,
    weight: newWeight,
    color: $modalColorInput.value,
  };
  saveOptions();
  render();
  closeEditModal();
};

// 룰렛 회전 및 당첨 계산 로직
const spin = () => {
  if (state.isSpinning || state.options.length < 2) return;
  state.isSpinning = true;
  $spinButton.disabled = true;

  // 1. 당첨자 선택 (가중치 기반)
  const totalWeight = state.options.reduce((sum, opt) => sum + opt.weight, 0);
  const randomWeight = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  let winnerIndex = 0;
  for (let i = 0; i < state.options.length; i++) {
    cumulativeWeight += state.options[i].weight;
    if (randomWeight <= cumulativeWeight) {
      winnerIndex = i;
      break;
    }
  }
  const winner = state.options[winnerIndex];

  // 2. 각 조각의 각도 계산 (12시 방향 기준으로 통일)
  const segmentAngles = [];
  let accumulatedAngle = 0; // 12시 방향(0도)에서 시작

  for (let i = 0; i < state.options.length; i++) {
    const segmentSize = (state.options[i].weight / totalWeight) * 360;
    segmentAngles.push({
      start: accumulatedAngle,
      end: accumulatedAngle + segmentSize,
      center: accumulatedAngle + segmentSize / 2,
    });
    accumulatedAngle += segmentSize;
  }

  // 3. 당첨 조각의 중심 각도 (12시 방향 기준)
  const winnerSegment = segmentAngles[winnerIndex];
  const winnerCenterAngle = winnerSegment.center;

  // 4. 당첨 조각 내에서 랜덤한 위치 선택
  const segmentSize = winnerSegment.end - winnerSegment.start;
  const randomOffset = (Math.random() - 0.5) * segmentSize * 0.6;
  const targetAngle = winnerCenterAngle + randomOffset;

  // 5. 화살표(12시)가 목표 지점을 가리키도록 회전 각도 계산
  // 목표 각도만큼 시계방향으로 회전시켜야 화살표가 해당 위치를 가리킴
  const baseRotation = targetAngle;

  // 6. 추가 회전 (시각적 효과) - 시계 방향으로 여러 바퀴
  const extraSpins = 360 * (5 + Math.random() * 4); // 5-9바퀴 추가

  // 7. 최종 회전 각도 (시계 방향이므로 양수)
  const finalRotation = baseRotation + extraSpins;
  state.totalRotation += finalRotation;

  // 8. 애니메이션 적용
  $canvas.style.transition =
    'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  $canvas.style.transform = `rotate(${state.totalRotation}deg)`;

  // 9. 애니메이션 완료 후 결과 표시
  $canvas.addEventListener('transitionend', () => finishSpin(winner), {
    once: true,
  });

  // 디버깅용 콘솔 로그
  console.log(`당첨: ${winner.text} (인덱스: ${winnerIndex})`);
  console.log(`당첨 조각 중심: ${winnerCenterAngle}°`);
  console.log(`목표 각도: ${targetAngle}°, 최종 회전: ${finalRotation}°`);
};

// 스핀 완료 처리 함수 (누락된 함수 추가)
const finishSpin = (winner) => {
  state.isSpinning = false;
  $spinButton.disabled = false;
  const winnerText = winner.text || '(이름 없는 옵션)';

  setTimeout(() => {
    alert(`🎉 당첨: ${winnerText} 🎉`);
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
  }, 100);
};

// --- 초기화 및 이벤트 리스너 등록 ---
const init = () => {
  loadOptions();
  render();
  $colorInput.value = getRandomColor();

  $optionForm.addEventListener('submit', addOption);
  $spinButton.addEventListener('click', spin);
  $optionList.addEventListener('click', handleListClick);
  $resetButton.addEventListener('click', resetOptions);
  $modalForm.addEventListener('submit', handleEditSubmit);
  $cancelEditButton.addEventListener('click', closeEditModal);
  $editModal.addEventListener('click', (e) => {
    if (e.target === $editModal) closeEditModal();
  });
};

init();
