// 즉시 실행 함수를 사용하여 전역 스코프 오염을 방지합니다.
(function () {
  /* -------------------- DOM -------------------- */
  const canvas = document.getElementById('roulette-canvas');
  const ctx = canvas.getContext('2d');
  const spinButton = document.getElementById('spin-button');
  const optionForm = document.getElementById('option-form');
  const optionInput = document.getElementById('option-input');
  const weightInput = document.getElementById('weight-input');
  const colorInput = document.getElementById('color-input');
  const optionList = document.getElementById('option-list');
  const resetButton = document.getElementById('reset-button');

  /* -------------------- STATE ------------------ */
  const storageKey = 'proRouletteOptions_v2';
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

  const state = { options: [], currentAngle: 0, isSpinning: false };

  /* -------------------- UTILS ------------------ */
  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const col = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * col)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const generateHighContrastColor = () => {
    const h = Math.floor(Math.random() * 360);
    const s = 70 + Math.floor(Math.random() * 30);
    const l = 40 + Math.floor(Math.random() * 20);
    return hslToHex(h, s, l);
  };

  const getUniqueColor = () => {
    const used = state.options.map((o) => o.color);
    const avail = defaultColors.filter((c) => !used.includes(c));
    return avail.length
      ? avail[Math.floor(Math.random() * avail.length)]
      : generateHighContrastColor();
  };

  const getInitialOptions = () => [
    { text: '한식', color: '#F8B195', weight: 1 },
    { text: '중식', color: '#F67280', weight: 1 },
    { text: '일식', color: '#C06C84', weight: 1 },
    { text: '양식', color: '#6C5B7B', weight: 1 },
    { text: '분식', color: '#355C7D', weight: 1 },
  ];

  const loadOptions = () => {
    const saved = localStorage.getItem(storageKey);
    state.options = saved ? JSON.parse(saved) : getInitialOptions();
  };

  const saveOptions = () =>
    localStorage.setItem(storageKey, JSON.stringify(state.options));

  const getTotalWeight = () =>
    state.options.reduce((sum, o) => sum + o.weight, 0);

  /* -------------------- DRAW ------------------- */
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2;

  const drawRoulette = () => {
    const total = getTotalWeight();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (total <= 0) return;

    let start = state.currentAngle;

    state.options.forEach((o) => {
      const arc = (o.weight / total) * 2 * Math.PI;
      const end = start + arc;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = o.color;
      ctx.fill();

      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.max(10, Math.min(18, arc * 20))}px Arial`;

      const mid = start + arc / 2;
      const flipped = mid > Math.PI / 2 && mid < (3 * Math.PI) / 2;
      const rot = flipped ? mid + Math.PI : mid;
      const tx = centerX + (radius / 1.6) * Math.cos(mid);
      const ty = centerY + (radius / 1.6) * Math.sin(mid);
      ctx.translate(tx, ty);
      ctx.rotate(rot);

      let text = o.text;
      if (ctx.measureText(text).width > radius / 2)
        text = text.slice(0, 5) + '..';
      ctx.fillText(text, 0, 0);
      ctx.restore();

      start = end;
    });
  };

  /* -------------------- LIST ------------------- */
  const renderOptionsList = () => {
    optionList.innerHTML = '';
    if (!state.options.length) {
      const p = document.createElement('p');
      p.textContent = '옵션을 추가해주세요.';
      p.style.cssText = 'text-align:center;margin-top:20px';
      optionList.append(p);
      return;
    }
    state.options.forEach((o, i) => {
      const li = document.createElement('li');
      li.dataset.index = i;
      li.innerHTML = `
        <div class="option-content">
          <div class="color-section">
            <div class="color-swatch" style="background:${
              o.color
            }" data-index="${i}"></div>
            <span class="edit-icon">🎨</span>
          </div>
          <div class="text-section">
            <div class="text-edit-group">
              <span class="option-text editable" data-field="text">${
                o.text || '(이름 없음)'
              }</span>
              <span class="edit-icon">✏️</span>
            </div>
            <div class="weight-edit-group">
              <span class="option-weight editable" data-field="weight">비중: ${
                o.weight
              }</span>
              <span class="edit-icon">⚖️</span>
            </div>
          </div>
          <div class="control-section">
            <button class="delete-btn" aria-label="삭제">🗑️</button>
          </div>
        </div>`;
      optionList.append(li);
    });
  };

  const updateAndSave = () => {
    drawRoulette();
    renderOptionsList();
    saveOptions();
  };

  /* -------------------- EVENTS ----------------- */
  const handleAddOption = (e) => {
    e.preventDefault();
    const txt = optionInput.value.trim();
    const wt = parseFloat(weightInput.value);
    if (!txt || !(wt > 0)) {
      alert('옵션명과 유효한 비중 값을 입력해주세요.');
      return;
    }
    state.options.push({ text: txt, weight: wt, color: colorInput.value });

    optionForm.reset();
    weightInput.value = '1';
    colorInput.value = getUniqueColor();
    updateAndSave();
  };

  const handleListClick = (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const idx = parseInt(li.dataset.index, 10);

    if (e.target.closest('.delete-btn')) {
      if (state.options.length <= 2) {
        alert('최소 2개의 옵션이 필요합니다.');
        return;
      }
      state.options.splice(idx, 1);
      updateAndSave();
      return;
    }
    if (e.target.closest('.color-section')) {
      startColorEdit(idx, e);
      return;
    }

    if (e.target.classList.contains('editable'))
      startInlineEdit(e.target, idx, e.target.dataset.field);
    else if (e.target.classList.contains('edit-icon')) {
      const span = e.target.parentElement.querySelector('.editable');
      if (span) startInlineEdit(span, idx, span.dataset.field);
    }
  };

  const startInlineEdit = (el, idx, field) => {
    if (el.querySelector('input')) return;
    const orig =
      field === 'text' ? state.options[idx].text : state.options[idx].weight;
    const input = document.createElement('input');
    input.type = field === 'weight' ? 'number' : 'text';
    input.className = 'inline-input';
    input.value = orig;
    if (field === 'weight') {
      input.min = '0.1';
      input.step = '0.1';
    }

    el.style.display = 'none';
    el.after(input);
    input.focus();
    input.select();

    const finish = () => {
      const val = input.value;
      if (field === 'text' && val.trim()) state.options[idx].text = val.trim();
      else if (field === 'weight' && parseFloat(val) > 0)
        state.options[idx].weight = parseFloat(val);
      input.remove();
      el.style.display = '';
      updateAndSave();
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') input.blur();
      else if (ev.key === 'Escape') {
        input.value = orig;
        input.blur();
      }
    });
  };

  /* --------- 색상 편집: 팔레트 위치 개선 -------- */
  const startColorEdit = (idx, ev) => {
    const { clientX: x, clientY: y } = ev;
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = state.options[idx].color;
    picker.style.cssText = `
      position:fixed;
      left:${x}px;
      top:${y + 10}px; /* 클릭 지점 바로 아래 */
      width:28px;height:28px;
      opacity:0;       /* 시각적 방해 최소화 */
      z-index:9999;`;

    document.body.appendChild(picker);

    /* 일부 브라우저는 click 대신 showPicker() 지원 */
    if (picker.showPicker) picker.showPicker();
    else picker.click();

    const cleanup = () => picker.remove();

    picker.addEventListener(
      'change',
      (e) => {
        const newColor = e.target.value;
        if (state.options.some((o, i) => i !== idx && o.color === newColor)) {
          if (!confirm('이미 사용 중인 색상입니다. 그래도 사용하시겠습니까?')) {
            cleanup();
            return;
          }
        }
        state.options[idx].color = newColor;
        updateAndSave();
        cleanup();
      },
      { once: true }
    );

    picker.addEventListener('blur', cleanup, { once: true });
  };

  const handleResetOptions = () => {
    if (confirm('모든 옵션을 초기 설정으로 되돌리시겠습니까?')) {
      state.options = getInitialOptions();
      state.currentAngle = 0;
      updateAndSave();
    }
  };

  /* -------------------- SPIN ------------------- */
  const spin = () => {
    if (state.isSpinning || state.options.length < 2) return;

    /* 이전 당첨 모달이 열려 있으면 제거 */
    document.getElementById('result-modal')?.remove();

    state.isSpinning = true;
    spinButton.disabled = true;
    spinButton.textContent = 'SPINNING...';

    const total = getTotalWeight();
    const rand = Math.random() * total;
    let acc = 0,
      winIdx = 0;
    for (let i = 0; i < state.options.length; i++) {
      acc += state.options[i].weight;
      if (rand <= acc) {
        winIdx = i;
        break;
      }
    }

    const arcPer = (2 * Math.PI) / total;
    let startArc = 0;
    for (let i = 0; i < winIdx; i++)
      startArc += state.options[i].weight * arcPer;
    const winArcMid = startArc + (state.options[winIdx].weight * arcPer) / 2;

    const pointer = -Math.PI / 2;
    const rotMod = state.currentAngle % (2 * Math.PI);
    let needRot = (pointer - winArcMid - rotMod + 2 * Math.PI) % (2 * Math.PI);

    const totalRot = 5 * 2 * Math.PI + needRot;
    const duration = 5000;
    let startTime = null;
    const baseRot = state.currentAngle;

    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const t = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      state.currentAngle = baseRot + eased * totalRot;
      drawRoulette();
      if (t < 1) requestAnimationFrame(animate);
      else {
        state.currentAngle = (baseRot + totalRot) % (2 * Math.PI);
        drawRoulette();
        showResult(state.options[winIdx]);
        state.isSpinning = false;
        spinButton.disabled = false;
        spinButton.textContent = 'SPIN!';
      }
    };
    requestAnimationFrame(animate);
  };

  /* ------------- RESULT MODAL ------------------ */
  const showResult = (winner) => {
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

    const modal = document.createElement('div');
    modal.id = 'result-modal';
    modal.className = 'modal-container';
    modal.style.cssText = `
      position:fixed;inset:0;display:flex;align-items:center;
      justify-content:center;background:rgba(0,0,0,0.6);z-index:9998;`;
    modal.innerHTML = `
      <div class="modal-content" style="
        background:#222;padding:2rem 2.5rem;border-radius:12px;text-align:center;
        box-shadow:0 8px 20px rgba(0,0,0,0.5);">
        <h2 style="font-size:1.8rem;margin-bottom:1rem;">🎉 당첨 🎉</h2>
        <p style="background:${winner.color};padding:0.8rem 1.2rem;
                  border-radius:6px;font-size:1.2rem;font-weight:700;margin-bottom:1.5rem;">
          ${winner.text}
        </p>
        <button id="close-result" style="
          padding:0.6rem 1.8rem;border:none;border-radius:6px;cursor:pointer;
          font-weight:bold;background:#e94560;color:#fff;">닫기</button>
      </div>`;
    document.body.append(modal);
    modal
      .querySelector('#close-result')
      .addEventListener('click', () => modal.remove());
  };

  /* -------------------- INIT ------------------- */
  const init = () => {
    /* 하단 edit-modal 제거 */
    document.getElementById('edit-modal')?.remove();

    loadOptions();
    colorInput.value = getUniqueColor();
    updateAndSave();

    optionForm.addEventListener('submit', handleAddOption);
    optionList.addEventListener('click', handleListClick);
    resetButton.addEventListener('click', handleResetOptions);
    spinButton.addEventListener('click', spin);
  };
  init();
})();
