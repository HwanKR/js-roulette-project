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

// 구분이 잘 되는 고대비 색상 팔레트로 변경
const defaultColors = [
  '#E63946', // 빨간색
  '#F77F00', // 주황색
  '#FCBF49', // 노란색
  '#06D6A0', // 청록색
  '#118AB2', // 파란색
  '#8338EC', // 보라색
  '#FB8500', // 진한 주황색
  '#219EBC', // 밝은 파란색
  '#023047', // 네이비
  '#FFB3C6', // 핑크색
  '#8ECAE6', // 하늘색
  '#FFD166', // 밝은 노란색
  '#06FFA5', // 형광 청록색
  '#FF006E', // 마젠타
  '#3A86FF', // 밝은 파란색
  '#FF7B00', // 밝은 주황색
];

// 기본 옵션에 의미있는 텍스트 추가
const getInitialOptions = () => [
  { text: '옵션 1', weight: 1, color: '#E63946' },
  { text: '옵션 2', weight: 1, color: '#F77F00' },
];

const storageKey = 'rouletteOptions_final_v4'; // 색상 시스템 업데이트 반영

// --- 데이터 처리 함수 ---
const loadOptions = () => {
  const savedOptions = localStorage.getItem(storageKey);
  state.options = savedOptions ? JSON.parse(savedOptions) : getInitialOptions();
};

const saveOptions = () => {
  localStorage.setItem(storageKey, JSON.stringify(state.options));
};

// 색상 중복 방지 시스템
const getUniqueColor = () => {
  const usedColors = state.options.map((opt) => opt.color);
  const availableColors = defaultColors.filter((c) => !usedColors.includes(c));

  if (availableColors.length > 0) {
    // 사용 가능한 기본 색상이 있으면 랜덤하게 선택
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  // 기본 팔레트가 모두 사용되었을 경우, 고대비 랜덤 색상 생성
  return generateHighContrastColor();
};

// 고대비 색상 생성 함수
const generateHighContrastColor = () => {
  const usedColors = state.options.map((opt) => opt.color);
  let attempts = 0;
  let newColor;

  do {
    // HSL을 사용하여 더 구분되는 색상 생성
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 30); // 70-100% 채도
    const lightness = 40 + Math.floor(Math.random() * 20); // 40-60% 명도

    newColor = hslToHex(hue, saturation, lightness);
    attempts++;
  } while (usedColors.includes(newColor) && attempts < 50);

  return newColor;
};

// HSL을 HEX로 변환하는 함수
const hslToHex = (h, s, l) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
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

    // 조각 경계선 그리기 (더 두껍게)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos(currentAngle) * radius,
      Math.sin(currentAngle) * radius
    );
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3; // 경계선을 더 두껍게
    ctx.stroke();

    currentAngle = endAngle;
  }

  // 마지막 경계선 그리기
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(currentAngle) * radius, Math.sin(currentAngle) * radius);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 2단계: 텍스트 그리기
  for (const segment of segments) {
    const { option, centerAngle, arcSize } = segment;

    // 조각이 너무 작으면 텍스트 생략
    const minAngleForText = Math.PI / 8; // 22.5도
    if (arcSize < minAngleForText || !option.text.trim()) {
      continue;
    }

    ctx.save();

    // 텍스트 스타일 설정
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4; // 텍스트 테두리 더 두껍게
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 조각 크기에 따른 폰트 크기 조정
    let fontSize = 16;
    if (arcSize < Math.PI / 6) {
      fontSize = 10;
    } else if (arcSize < Math.PI / 4) {
      fontSize = 12;
    } else if (arcSize < Math.PI / 3) {
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

    // 텍스트 그리기 (테두리 먼저, 그 다음 내용)
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
      <div class="option-content">
        <div class="color-section">
          <div class="color-swatch" style="background-color: ${
            option.color
          }; border: 2px solid #fff;" data-index="${index}" data-field="color"></div>
          <span class="edit-icon">🎨</span>
        </div>
        
        <div class="text-section">
          <div class="text-edit-group">
            <span class="option-text editable" data-index="${index}" data-field="text">${
      option.text || '(이름 없음)'
    }</span>
            <span class="edit-icon">✏️</span>
          </div>
          <div class="weight-edit-group">
            <span class="option-weight editable" data-index="${index}" data-field="weight">비중: ${
      option.weight
    }</span>
            <span class="edit-icon">⚖️</span>
          </div>
        </div>
        
        <div class="control-section">
          <button class="delete-btn" aria-label="삭제">🗑️</button>
        </div>
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
  $colorInput.value = getUniqueColor(); // 고유한 색상 자동 할당
  saveOptions();
  render();
};

const handleListClick = (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const index = parseInt(li.dataset.index, 10);

  // 삭제 버튼 클릭
  if (e.target.closest('.delete-btn')) {
    removeOption(index);
    return;
  }

  // 색상 견본 직접 클릭
  if (e.target.classList.contains('color-swatch')) {
    startColorEdit(e.target, index, e);
    return;
  }

  // 편집 아이콘 클릭 처리
  if (e.target.classList.contains('edit-icon')) {
    const parent = e.target.parentElement;

    // 색상 편집 아이콘 클릭
    if (parent.classList.contains('color-section')) {
      const colorSwatch = parent.querySelector('.color-swatch');
      startColorEdit(colorSwatch, index, e);
      return;
    }

    // 텍스트 편집 아이콘 클릭
    if (parent.classList.contains('text-edit-group')) {
      const textElement = parent.querySelector('.option-text');
      startInlineEdit(textElement, index);
      return;
    }

    // 비중 편집 아이콘 클릭
    if (parent.classList.contains('weight-edit-group')) {
      const weightElement = parent.querySelector('.option-weight');
      startInlineEdit(weightElement, index);
      return;
    }
  }

  // 편집 가능한 요소 직접 클릭
  if (e.target.classList.contains('editable')) {
    startInlineEdit(e.target, index);
    return;
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

// 인라인 텍스트/비중 편집 시작 (개선)
const startInlineEdit = (element, index) => {
  const field = element.dataset.field;
  const currentValue =
    field === 'text' ? state.options[index].text : state.options[index].weight;

  // 이미 편집 중인 경우 무시
  if (element.querySelector('input') || element.style.display === 'none') {
    return;
  }

  // 입력 필드 생성
  const input = document.createElement('input');
  input.type = field === 'weight' ? 'number' : 'text';
  input.value = currentValue;
  input.className = 'inline-input';

  if (field === 'weight') {
    input.min = '0.1';
    input.step = '0.1';
  }

  // 원래 요소 숨기기
  element.style.display = 'none';

  // 입력 필드를 같은 위치에 삽입
  element.parentNode.insertBefore(input, element);

  // 포커스 및 선택
  input.focus();
  input.select();

  // 편집 완료 핸들러
  const finishEdit = () => {
    const newValue = input.value.trim();

    // 유효성 검사
    if (field === 'text' && !newValue) {
      alert('옵션명을 입력해주세요.');
      input.focus();
      return;
    }

    if (field === 'weight') {
      const numValue = parseFloat(newValue);
      if (!(numValue > 0)) {
        alert('유효한 비중 값을 입력해주세요.');
        input.focus();
        return;
      }
      state.options[index].weight = numValue;
    } else {
      state.options[index].text = newValue;
    }

    // 저장 및 렌더링
    saveOptions();
    render();
  };

  // 취소 핸들러
  const cancelEdit = () => {
    input.remove();
    element.style.display = '';
  };

  // 이벤트 리스너
  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  });
};

// 색상 편집(팝업 팔레트) — 레이아웃 깨짐 방지
// 색상 편집 – 팔레트를 클릭 지점 근처에 띄우기
// 색상 편집 – 팔레트를 클릭 지점 근처에 띄우기 (개선)
const startColorEdit = (swatchEl, index, event) => {
  // ① 히든 컬러-피커 생성
  const picker = document.createElement('input');
  picker.type = 'color';
  picker.value = state.options[index].color;

  // ② 마우스 좌표 계산 (안전한 방식)
  let clickX, clickY;

  if (event && event.clientX !== undefined && event.clientY !== undefined) {
    // 유효한 이벤트 객체가 있는 경우
    clickX = event.clientX;
    clickY = event.clientY;
  } else if (swatchEl) {
    // 이벤트 객체가 없으면 색상 견본 요소의 위치 계산
    const rect = swatchEl.getBoundingClientRect();
    clickX = rect.left + rect.width / 2;
    clickY = rect.top + rect.height / 2;
  } else {
    // 모든 방법이 실패하면 화면 중앙
    clickX = window.innerWidth / 2;
    clickY = window.innerHeight / 2;
  }

  // ③ 컬러-피커를 계산된 지점에 배치
  picker.style.position = 'fixed';
  picker.style.left = `${clickX}px`;
  picker.style.top = `${clickY}px`;
  picker.style.opacity = '0';
  picker.style.pointerEvents = 'none';
  picker.style.zIndex = '9999'; // 최상위 레이어 보장

  document.body.appendChild(picker);

  // ④ 팔레트 오픈
  picker.focus();
  picker.click();

  // ⑤ 색상 변경 처리
  picker.addEventListener('input', (e) => {
    const newColor = e.target.value;

    // 중복 색상 확인 (선택사항)
    const isDuplicate = state.options.some(
      (opt, i) => i !== index && opt.color === newColor
    );

    if (isDuplicate) {
      if (!confirm('이미 사용 중인 색상입니다. 그래도 사용하시겠습니까?')) {
        return;
      }
    }

    state.options[index].color = newColor;
    saveOptions();
    render();
  });

  // ⑥ 팔레트가 닫히면 정리
  const cleanup = () => {
    if (picker && picker.parentNode) {
      picker.parentNode.removeChild(picker);
    }
  };

  picker.addEventListener('change', cleanup, { once: true });
  picker.addEventListener('blur', cleanup, { once: true });

  // 추가 안전장치: 3초 후 자동 정리
  setTimeout(cleanup, 3000);
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

// 룰렛 회전 및 당첨 계산 로직
const spin = () => {
  if (state.isSpinning || state.options.length < 2) return;
  state.isSpinning = true;
  $spinButton.disabled = true; // 1. 당첨자 선택 (가중치 기반)

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
  const winner = state.options[winnerIndex]; // 2. Canvas 그리기와 완전히 동일한 방식으로 각도 계산

  let currentAngle = -Math.PI / 2; // Canvas와 동일하게 라디안 사용
  const segmentAngles = [];

  for (let i = 0; i < state.options.length; i++) {
    const arcSize = (state.options[i].weight / totalWeight) * 2 * Math.PI;
    const endAngle = currentAngle + arcSize;

    segmentAngles.push({
      start: currentAngle,
      end: endAngle,
      center: currentAngle + arcSize / 2,
    });
    currentAngle = endAngle;
  } // 3. 당첨 조각의 중심 각도 (라디안)

  const winnerSegment = segmentAngles[winnerIndex];
  const winnerCenterAngle = winnerSegment.center; // 4. 당첨 조각 내에서 랜덤한 위치 선택

  const segmentSize = winnerSegment.end - winnerSegment.start;
  const randomOffset = (Math.random() - 0.5) * segmentSize * 0.6;
  const targetAngleRad = winnerCenterAngle + randomOffset; // 5. 라디안을 도로 변환

  const targetAngleDeg = (targetAngleRad * 180) / Math.PI; // 6. 회전 계산: 화살표(12시)가 목표를 가리키도록

  const rotationNeeded = -targetAngleDeg;

  // ==================================================================
  // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 최종 수정 로직 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
  // ==================================================================

  // 8. 최종 회전 각도 계산 (단순하고 확실한 새 로직)

  // 8-1. 현재 회전량에서 소수점 자리를 버려 온전한 바퀴 수만 남깁니다.
  // 예: -1890°(5.25바퀴) -> -1800°(5바퀴). 음수이므로 ceil을 사용합니다.
  const floorRotation = Math.ceil(state.totalRotation / 360) * 360;

  // 8-2. 추가로 회전할 바퀴 수를 계산합니다.
  const extraSpins = 360 * (5 + Math.random() * 4);

  // 8-3. 새로운 총 회전량을 설정합니다.
  // (이전 바퀴 수) - (이번에 추가할 바퀴 수) + (최종적으로 멈출 위치)
  // 이렇게 하면 항상 이전보다 더 많이 회전하면서 정확한 위치에 멈춥니다.
  state.totalRotation = floorRotation - extraSpins + rotationNeeded; // 9. 애니메이션 적용

  $canvas.style.transition =
    'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
  $canvas.style.transform = `rotate(${state.totalRotation}deg)`; // 10. 애니메이션 완료 후 결과 표시

  $canvas.addEventListener('transitionend', () => finishSpin(winner), {
    once: true,
  }); // 디버깅 로그

  console.log(
    `당첨: ${winner.text}, 목표각도: ${targetAngleDeg.toFixed(
      2
    )}°, 최종위치: ${rotationNeeded.toFixed(
      2
    )}°, 총회전량: ${state.totalRotation.toFixed(2)}°`
  );
};

// 스핀 완료 처리 함수
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
  $colorInput.value = getUniqueColor();

  $optionForm.addEventListener('submit', addOption);
  $spinButton.addEventListener('click', spin);
  $optionList.addEventListener('click', handleListClick);
  $resetButton.addEventListener('click', resetOptions);
};

// 테스트용 함수 (콘솔에서 실행)
const testRouletteAccuracy = (testCount = 100) => {
  const results = {};

  // 각 옵션별 실제 나올 확률 계산
  const totalWeight = state.options.reduce((sum, opt) => sum + opt.weight, 0);
  state.options.forEach((option, index) => {
    const expectedProbability = ((option.weight / totalWeight) * 100).toFixed(
      2
    );
    results[option.text] = {
      expected: expectedProbability + '%',
      actual: 0,
      count: 0,
    };
  });

  // 테스트 실행
  for (let i = 0; i < testCount; i++) {
    const randomWeight = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let winnerIndex = 0;

    for (let j = 0; j < state.options.length; j++) {
      cumulativeWeight += state.options[j].weight;
      if (randomWeight <= cumulativeWeight) {
        winnerIndex = j;
        break;
      }
    }

    const winner = state.options[winnerIndex];
    results[winner.text].count++;
  }

  // 결과 계산 및 출력
  console.log(`=== ${testCount}회 테스트 결과 ===`);
  Object.keys(results).forEach((optionText) => {
    const actualProbability = (
      (results[optionText].count / testCount) *
      100
    ).toFixed(2);
    results[optionText].actual = actualProbability + '%';
    console.log(
      `${optionText}: 예상 ${results[optionText].expected} | 실제 ${results[optionText].actual} (${results[optionText].count}회)`
    );
  });

  return results;
};

init();
