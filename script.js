// 즉시 실행 함수를 사용하여 전역 스코프 오염을 방지합니다.
(function () {
  // --- DOM 요소 가져오기 ---
  const canvas = document.getElementById('roulette-canvas');
  const ctx = canvas.getContext('2d');
  const spinButton = document.getElementById('spin-button');
  const optionForm = document.getElementById('option-form');
  const optionInput = document.getElementById('option-input');
  const weightInput = document.getElementById('weight-input');
  const colorInput = document.getElementById('color-input');
  const optionList = document.getElementById('option-list');
  const resetButton = document.getElementById('reset-button');

  // --- 애플리케이션 상태 및 설정 ---
  const storageKey = 'proRouletteOptions_v2'; // 새로운 버전의 저장 키

  // 구분이 잘 되는 고대비 색상 팔레트
  const defaultColors = [
    '#E63946',
    '#F77F00',
    '#FCBF49',
    '#06D6A0',
    '#118AB2',
    '#8338EC',
    '#FB8500',
    '#219EBC',
    '#023047',
    '#FFB3C6',
    '#8ECAE6',
    '#FFD166',
  ];

  const state = {
    options: [],
    currentAngle: 0,
    isSpinning: false,
  };

  // --- 유틸리티 및 데이터 처리 함수 ---

  /**
   * HSL 색상을 HEX로 변환합니다.
   * @param {number} h - 색상(0-360)
   * @param {number} s - 채도(0-100)
   * @param {number} l - 명도(0-100)
   * @returns {string} HEX 색상 코드 (예: #ffffff)
   */
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

  /**
   * 고대비의 랜덤 색상을 생성합니다.
   * @returns {string} HEX 색상 코드
   */
  const generateHighContrastColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 30); // 70-100% 채도
    const lightness = 40 + Math.floor(Math.random() * 20); // 40-60% 명도
    return hslToHex(hue, saturation, lightness);
  };

  /**
   * 현재 사용 중이지 않은 고유한 색상을 반환합니다.
   * @returns {string} HEX 색상 코드
   */
  const getUniqueColor = () => {
    const usedColors = state.options.map((opt) => opt.color);
    const availableColors = defaultColors.filter(
      (c) => !usedColors.includes(c)
    );
    if (availableColors.length > 0) {
      return availableColors[
        Math.floor(Math.random() * availableColors.length)
      ];
    }
    return generateHighContrastColor();
  };

  /**
   * 기본 옵션 목록을 반환합니다.
   * @returns {Array<object>} 기본 옵션 배열
   */
  const getInitialOptions = () => [
    { text: '한식', color: '#F8B195', weight: 1 },
    { text: '중식', color: '#F67280', weight: 1 },
    { text: '일식', color: '#C06C84', weight: 1 },
    { text: '양식', color: '#6C5B7B', weight: 1 },
    { text: '분식', color: '#355C7D', weight: 1 },
  ];

  /**
   * localStorage에서 옵션을 불러옵니다.
   */
  const loadOptions = () => {
    const savedOptions = localStorage.getItem(storageKey);
    state.options = savedOptions
      ? JSON.parse(savedOptions)
      : getInitialOptions();
  };

  /**
   * 현재 옵션 상태를 localStorage에 저장합니다.
   */
  const saveOptions = () => {
    localStorage.setItem(storageKey, JSON.stringify(state.options));
  };

  /**
   * 모든 옵션의 가중치(비중)의 합을 계산합니다.
   * @returns {number} 총 가중치
   */
  const getTotalWeight = () => {
    return state.options.reduce((sum, option) => sum + option.weight, 0);
  };

  // --- 렌더링 및 UI 업데이트 함수 ---
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2;

  /**
   * 현재 상태를 기반으로 룰렛 캔버스를 그립니다. (시각적 요소 개선 버전)
   */
  const drawRoulette = () => {
    const totalWeight = getTotalWeight();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (totalWeight <= 0) return;

    let startAngle = state.currentAngle;

    state.options.forEach((option) => {
      const arcSize = (option.weight / totalWeight) * (2 * Math.PI);
      const endAngle = startAngle + arcSize;

      // 파이 조각 그리기
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = option.color;
      ctx.fill();

      // 조각 경계선 그리기
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 텍스트 그리기
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 조각 크기에 따른 폰트 크기 동적 조절
      const fontSize = Math.max(10, Math.min(18, arcSize * 20));
      ctx.font = `bold ${fontSize}px Arial`;

      const textAngle = startAngle + arcSize / 2;

      // 텍스트가 뒤집히지 않도록 각도 조정
      const isFlipped =
        textAngle > Math.PI / 2 && textAngle < (3 * Math.PI) / 2;
      const rotation = isFlipped ? textAngle + Math.PI : textAngle;

      const textX = centerX + (radius / 1.6) * Math.cos(textAngle);
      const textY = centerY + (radius / 1.6) * Math.sin(textAngle);

      ctx.translate(textX, textY);
      ctx.rotate(rotation);

      // 텍스트 길이 조절
      let displayText = option.text;
      if (ctx.measureText(displayText).width > radius / 2) {
        displayText = displayText.substring(0, 5) + '..';
      }

      ctx.fillText(displayText, 0, 0);
      ctx.restore();

      startAngle = endAngle;
    });
  };

  /**
   * 옵션 목록을 화면에 렌더링합니다. (인라인 편집 UI 적용 버전)
   */
  const renderOptionsList = () => {
    optionList.innerHTML = '';
    if (state.options.length === 0) {
      const p = document.createElement('p');
      p.textContent = '옵션을 추가해주세요.';
      p.style.textAlign = 'center';
      p.style.marginTop = '20px';
      optionList.appendChild(p);
      return;
    }
    state.options.forEach((option, index) => {
      const li = document.createElement('li');
      li.dataset.index = index;
      li.innerHTML = `
        <div class="option-content">
          <div class="color-section">
            <div class="color-swatch" style="background-color: ${
              option.color
            };" data-index="${index}"></div>
            <span class="edit-icon">🎨</span>
          </div>
          <div class="text-section">
            <div class="text-edit-group">
                <span class="option-text editable" data-field="text">${
                  option.text || '(이름 없음)'
                }</span>
                <span class="edit-icon">✏️</span>
            </div>
            <div class="weight-edit-group">
                <span class="option-weight editable" data-field="weight">비중: ${
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
      optionList.appendChild(li);
    });
  };

  /**
   * 상태를 업데이트하고, 화면을 다시 그리고, localStorage에 저장합니다.
   */
  const updateAndSave = () => {
    drawRoulette();
    renderOptionsList();
    saveOptions();
  };

  // --- 이벤트 핸들러 및 로직 함수 ---

  /**
   * 옵션 추가 폼 제출 이벤트를 처리합니다.
   */
  const handleAddOption = (e) => {
    e.preventDefault();
    const newOptionText = optionInput.value.trim();
    const weight = parseFloat(weightInput.value);

    if (!newOptionText || !(weight > 0)) {
      // TODO: alert 대신 커스텀 모달로 교체하는 것이 좋음
      alert('옵션명과 유효한 비중 값을 입력해주세요.');
      return;
    }

    state.options.push({
      text: newOptionText,
      weight,
      color: colorInput.value,
    });

    optionForm.reset();
    weightInput.value = '1';
    colorInput.value = getUniqueColor(); // 다음 추가를 위해 새로운 색상 제안

    updateAndSave();
  };

  /**
   * 옵션 목록의 클릭 이벤트를 처리합니다. (이벤트 위임)
   */
  const handleListClick = (e) => {
    const target = e.target;
    const li = target.closest('li');
    if (!li) return;

    const index = parseInt(li.dataset.index, 10);

    if (target.closest('.delete-btn')) {
      if (state.options.length <= 2) {
        alert('최소 2개의 옵션이 필요합니다.');
        return;
      }
      state.options.splice(index, 1);
      updateAndSave();
    } else if (target.closest('.color-section')) {
      startColorEdit(index);
    } else if (target.classList.contains('editable')) {
      startInlineEdit(target, index, target.dataset.field);
    } else if (target.classList.contains('edit-icon')) {
      const editableSpan = target.parentElement.querySelector('.editable');
      if (editableSpan) {
        startInlineEdit(editableSpan, index, editableSpan.dataset.field);
      }
    }
  };

  /**
   * 옵션 텍스트/비중의 인라인 편집을 시작합니다.
   */
  const startInlineEdit = (element, index, field) => {
    if (element.querySelector('input')) return; // 이미 편집 중이면 중단

    const originalValue =
      field === 'text'
        ? state.options[index].text
        : state.options[index].weight;

    const input = document.createElement('input');
    input.type = field === 'weight' ? 'number' : 'text';
    input.className = 'inline-input';
    input.value = originalValue;
    if (field === 'weight') {
      input.min = '0.1';
      input.step = '0.1';
    }

    element.style.display = 'none';
    element.parentNode.insertBefore(input, element.nextSibling);
    input.focus();
    input.select();

    const finishEdit = () => {
      const newValue = input.value;
      if (field === 'text' && newValue.trim()) {
        state.options[index].text = newValue.trim();
      } else if (field === 'weight' && parseFloat(newValue) > 0) {
        state.options[index].weight = parseFloat(newValue);
      }

      input.remove();
      element.style.display = '';
      updateAndSave();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') {
        input.value = originalValue; // 취소 시 원상 복구
        input.blur();
      }
    });
  };

  /**
   * 옵션 색상의 편집을 시작합니다. (숨겨진 input[type=color] 사용)
   */
  const startColorEdit = (index) => {
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = state.options[index].color;
    picker.style.position = 'absolute';
    picker.style.opacity = '0';
    document.body.appendChild(picker);
    picker.click();

    picker.addEventListener('input', () => {
      state.options[index].color = picker.value;
      updateAndSave();
    });

    picker.addEventListener('change', () => {
      picker.remove();
    });
  };

  /**
   * 옵션 초기화 버튼 클릭 이벤트를 처리합니다.
   */
  const handleResetOptions = () => {
    if (confirm('모든 옵션을 초기 설정으로 되돌리시겠습니까?')) {
      state.options = getInitialOptions();
      state.currentAngle = 0;
      updateAndSave();
    }
  };

  /**
   * 룰렛을 돌립니다. (requestAnimationFrame 기반)
   */
  const spin = () => {
    if (state.isSpinning || state.options.length < 2) return;

    state.isSpinning = true;
    spinButton.disabled = true;
    spinButton.textContent = 'SPINNING...';

    const totalWeight = getTotalWeight();
    const randomValue = Math.random() * totalWeight;
    let accumulatedWeight = 0;
    let targetOptionIndex = -1;

    for (let i = 0; i < state.options.length; i++) {
      accumulatedWeight += state.options[i].weight;
      if (randomValue <= accumulatedWeight) {
        targetOptionIndex = i;
        break;
      }
    }

    let anglePerWeight = (2 * Math.PI) / totalWeight;
    let startAngle = 0;
    for (let i = 0; i < targetOptionIndex; i++) {
      startAngle += state.options[i].weight * anglePerWeight;
    }
    const targetArcSize =
      state.options[targetOptionIndex].weight * anglePerWeight;
    const randomAngleInSlice = Math.random() * targetArcSize;
    const targetAngle = startAngle + randomAngleInSlice;

    const fullRotations = 5 * (2 * Math.PI);
    const finalAngle = fullRotations + 2 * Math.PI - targetAngle;

    let startTime = null;
    const duration = 5000;

    const animateSpin = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const t = Math.min(progress / duration, 1);
      const easedProgress = 1 - Math.pow(1 - t, 4);
      const rotation = easedProgress * finalAngle;
      state.currentAngle = rotation;
      drawRoulette();

      if (progress < duration) {
        requestAnimationFrame(animateSpin);
      } else {
        state.currentAngle = finalAngle;
        drawRoulette();
        const winner = getWinner();
        showResult(winner);
        state.isSpinning = false;
        spinButton.disabled = false;
        spinButton.textContent = 'SPIN!';
      }
    };

    requestAnimationFrame(animateSpin);
  };

  /**
   * 회전이 멈춘 후 최종 각도를 기준으로 당첨자를 결정합니다.
   */
  const getWinner = () => {
    const totalWeight = getTotalWeight();
    const finalAngle = state.currentAngle % (2 * Math.PI);
    const winningAngle = 2 * Math.PI - finalAngle;

    let startAngle = 0;
    for (const option of state.options) {
      const arcSize = (option.weight / totalWeight) * (2 * Math.PI);
      const endAngle = startAngle + arcSize;
      if (winningAngle >= startAngle && winningAngle < endAngle) {
        return option;
      }
      startAngle = endAngle;
    }
    return state.options[0]; // Fallback
  };

  /**
   * 당첨 결과를 화면에 모달과 폭죽 효과로 보여줍니다.
   */
  const showResult = (winner) => {
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

    const resultModal = document.createElement('div');
    resultModal.className = 'modal-container';
    resultModal.id = 'result-modal';
    resultModal.style.display = 'flex';
    resultModal.innerHTML = `
      <div class="modal-content">
        <h2>🎉 당첨 🎉</h2>
        <p class="result-text" style="background-color:${winner.color};">${winner.text}</p>
        <button id="close-result">닫기</button>
      </div>
    `;
    document.body.appendChild(resultModal);

    document.getElementById('close-result').addEventListener('click', () => {
      resultModal.remove();
    });
  };

  /**
   * 초기화 함수
   */
  const init = () => {
    loadOptions();
    colorInput.value = getUniqueColor();
    updateAndSave();

    optionForm.addEventListener('submit', handleAddOption);
    optionList.addEventListener('click', handleListClick);
    resetButton.addEventListener('click', handleResetOptions);
    spinButton.addEventListener('click', spin);
  };

  // 애플리케이션 시작
  init();
})();
