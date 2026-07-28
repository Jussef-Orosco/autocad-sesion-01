/**
 * Mini AutoCAD — comandos funcionales: LINE, RECTANG, CIRCLE, PLINE, MOVE, COPY, OFFSET, etc.
 */
(function (global) {
  'use strict';

  const CMD_LABELS = {
    LINE: 'LINE (L)', RECTANG: 'RECTANG (REC)', CIRCLE: 'CIRCLE (C)', PLINE: 'PLINE (PL)',
    MOVE: 'MOVE (M)', COPY: 'COPY (CO)', OFFSET: 'OFFSET (O)',
    ZOOM: 'ZOOM (Z)', PAN: 'PAN (P)', UNITS: 'UNITS', DIST: 'DIST (DI)',
    ERASE: 'ERASE (E)', UNDO: 'UNDO', REDO: 'REDO',
    GRID: 'GRID', SNAP: 'SNAP', ORTHO: 'ORTHO', POLAR: 'POLAR', DYNAMIC: 'DYN', OSNAP: 'OSNAP',
    COORDS: 'COORDENADAS', SELECT: 'SELECCIÓN', FILES: 'ARCHIVOS', UI: 'INTERFAZ', EXPLORE: 'DIBUJO',
    DRAW: 'DIBUJO'
  };

  const DRAW_SET = ['LINE', 'RECTANG', 'CIRCLE', 'PLINE', 'MOVE', 'COPY', 'OFFSET', 'ERASE', 'UNDO', 'REDO', 'ZOOM', 'PAN', 'CLEAR', 'ORTHO', 'SELECT', 'DIST'];

  function resolveDemoCommand(title) {
    const t = String(title || '').toUpperCase();
    if (/DIST|DISTANCIA|MEDIR/.test(t)) return 'DIST';
    if (/CIRCLE|CÍRCULO|CIRCULO/.test(t)) return 'CIRCLE';
    if (/RECTANG|RECTÁNGULO|RECTANGULO/.test(t)) return 'RECTANG';
    if (/POLYLINE|PLINE/.test(t)) return 'PLINE';
    if (/OFFSET|DESFASE/.test(t)) return 'OFFSET';
    if (/MOVE|MOVER/.test(t) && !/REMOVE/.test(t)) return 'MOVE';
    if (/COPY|COPIAR/.test(t)) return 'COPY';
    if (/ERASE VS UNDO|RESUMEN ERASE/.test(t) || /ERASE|BORRAR/.test(t)) return 'ERASE';
    if (/REDO/.test(t)) return 'REDO';
    if (/UNDO|DESHACER/.test(t)) return 'UNDO';
    if (/UNITS|LONGITUD|ÁNGULO|ANGULO|DIRECCIÓN DEL ÁNGULO|EJEMPLO DE CONFIGURACIÓN|RESUMEN UNITS/.test(t)) return 'UNITS';
    if (/ZOOM|EXTENTS|PREVIOUS|REALTIME|ZOOM IN|ZOOM OUT|ZOOM ALL|ZOOM SCALE|ZOOM CENTER|ZOOM OBJECT|ZOOM WINDOW/.test(t)) return 'ZOOM';
    if (/^USO DE PAN$|^COMANDO PAN$|RESUMEN ZOOM\/PAN/.test(t) || (/\bPAN\b/.test(t) && !/ZOOM/.test(t))) return 'PAN';
    if (/LINE|LÍNEA|LINEA|CUADRADO|ATAJOS DE LINE|RESUMEN LINE|CONSEJOS PARA LÍNEAS/.test(t) && !/COORDENAD|SELECCIÓN|MODOS|ZOOM|PAN|ORTHO|SNAP|GRID|POLAR|DYNAMIC|ERASE/.test(t)) return 'LINE';
    if (/ORTHO/.test(t)) return 'ORTHO';
    if (/GRID/.test(t) && !/SNAP/.test(t)) return 'GRID';
    if (/\bSNAP\b/.test(t) && !/OSNAP|OBJECT/.test(t)) return 'SNAP';
    if (/POLAR TRACKING|CONFIGURACIÓN DE POLAR|RESUMEN POLAR|PRÁCTICA CON POLAR/.test(t) || (/POLAR/.test(t) && !/COORDENAD|ABSOLUT|RELATIV/.test(t))) return 'POLAR';
    if (/DYNAMIC/.test(t)) return 'DYNAMIC';
    if (/OSNAP|OBJECT SNAP/.test(t)) return 'OSNAP';
    if (/COORDENAD|CARTESIAN|ABSOLUT|RELATIV|SÍMBOLO @|SIMBOLO @|PENTÁGONO|PLANO CARTESIANO|COMPARATIVA DE SISTEMAS|VENTAJAS RELATIVAS|VENTAJAS POLARES|PRÁCTICA [123]|EJERCICIO [123]|POLARES/.test(t)) return 'COORDS';
    if (/SELECCIÓN|WINDOW|CROSSING|QUICK SELECT|FENCE|POLYGON/.test(t)) return 'SELECT';
    if (/SAVE|GUARDAR|OPEN|ABRIR|NEW|ARCHIVO|DWG|BAK|SV\$|DXF|PLANTILLA|ACADISO|\bACAD\b|RECUPERACIÓN|ADMINISTRACIÓN DE ARCHIVOS/.test(t)) return 'FILES';
    if (/RIBBON|TOOLBAR|APPLICATION|STATUS BAR|VIEWCUBE|COMMAND WINDOW|WORKSPACE|DRAWING SPACE|LAYOUT|MODEL|FICHA|NAVIGATION|PARTES|ORGANIZACIÓN|INTERFAZ|DRAFTING|3D BASICS|3D MODELING|WSCURRENT/.test(t)) return 'UI';
    if (/INICIAR|BIENVENIDA|START DRAWING|RECENT|CONNECT|PREPARACIÓN|PRIMERAS IMPRESIONES|SESIÓN 01|DESCRIPCIÓN|¿QUÉ ES|OBJETIVOS|CAPACIDAD|TEMÁTICA|IMPORTANCIA|VENTAJAS|METODOLOGÍA|ESTRUCTURA|BIBLIOGRAFÍA|RESUMEN|CIERRE|MENSAJE|PREGUNTAS|RECURSOS|HABILIDADES|CONSEJOS FINALES|PRÓXIMOS|EJERCICIO FINAL|PRÁCTICA|CHECKLIST|DIBUJO/.test(t)) return 'DRAW';
    return 'DRAW';
  }

  function createMiniCAD(mountEl) {
    const root = document.createElement('div');
    root.className = 'acad-mini mini-autocad-container';
    root.innerHTML = `
      <div class="acad-titlebar">
        <span class="acad-app">AutoCAD Mini · Simulador</span>
        <button type="button" class="acad-tut-launch" data-tut="open" title="Abrir guía tutorial">📚 Guía</button>
        <span class="acad-active" id="acadActiveCmd">—</span>
      </div>
      <div class="acad-ribbon"></div>
      <div class="acad-hint" id="acadHint">Dibuja con los comandos activos</div>
      <div class="acad-prompt-line" id="acadPromptLine">Command: _</div>
      <div class="acad-viewport">
        <canvas id="acadCanvas"></canvas>
        <div class="acad-dyn" id="acadDyn" hidden></div>
        <div class="acad-tutorial" id="acadTutorial" hidden>
          <div class="acad-tut-header">
            <span id="acadTutTitle">📚 Guía paso a paso</span>
            <div class="acad-tut-actions">
              <button type="button" data-tut="prev" title="Paso anterior">◀</button>
              <button type="button" data-tut="next" title="Siguiente / Omitir">▶</button>
              <button type="button" data-tut="restart" title="Reiniciar guía">↻</button>
              <button type="button" data-tut="close" title="Cerrar guía">✕</button>
            </div>
          </div>
          <div class="acad-tut-progress"><div class="acad-tut-bar" id="acadTutBar"></div></div>
          <div class="acad-tut-body">
            <div class="acad-tut-stepnum" id="acadTutStepNum">Paso 1/8</div>
            <strong id="acadTutStepTitle">Bienvenida</strong>
            <p id="acadTutStepText">Sigue las instrucciones para practicar como en AutoCAD.</p>
            <div class="acad-tut-status" id="acadTutStatus">⏳ Pendiente</div>
          </div>
          <div class="acad-tut-footer">
            <button type="button" data-tut="do" class="acad-tut-do" id="acadTutDo">▶ Empezar este paso</button>
          </div>
        </div>
      </div>
      <div class="acad-cmdline"><span class="acad-prompt" id="acadPromptLabel">Command:</span>
        <input id="acadInput" type="text" autocomplete="off" spellcheck="false" placeholder="Escribe L, REC, C… o usa los botones">
      </div>
      <div class="acad-statusbar"></div>
      <div class="acad-msg" id="acadMsg"></div>
    `;
    mountEl.appendChild(root);

    const canvas = root.querySelector('#acadCanvas');
    const ctx = canvas.getContext('2d');
    const input = root.querySelector('#acadInput');
    const hintEl = root.querySelector('#acadHint');
    const msgEl = root.querySelector('#acadMsg');
    const activeEl = root.querySelector('#acadActiveCmd');
    const dynEl = root.querySelector('#acadDyn');
    const promptLine = root.querySelector('#acadPromptLine');
    const promptLabel = root.querySelector('#acadPromptLabel');
    const tutPanel = root.querySelector('#acadTutorial');
    const tutBar = root.querySelector('#acadTutBar');
    const tutStepNum = root.querySelector('#acadTutStepNum');
    const tutStepTitle = root.querySelector('#acadTutStepTitle');
    const tutStepText = root.querySelector('#acadTutStepText');
    const tutStatus = root.querySelector('#acadTutStatus');
    const tutTitle = root.querySelector('#acadTutTitle');
    const tutDo = root.querySelector('#acadTutDo');

    const state = {
      allowed: 'DRAW',
      title: '',
      entities: [],
      selection: new Set(),
      undoStack: [],
      redoStack: [],
      modes: { grid: true, snap: false, ortho: false, polar: false, dyn: true, osnap: true },
      view: { x: 40, y: 25, scale: 3 },
      tool: null,
      pts: [],
      mouse: { x: 0, y: 0, wx: 0, wy: 0 },
      panning: false,
      panLast: null,
      units: { length: 'Decimal', precision: 2, insert: 'Millimeters', angle: 'Decimal Degrees' },
      selectBox: null,
      offsetDist: 10,
      moveBase: null,
      lastCmd: 'LINE',
      pointerInside: false,
      viewStack: [],
      distPts: [],
      helpVisible: true,
      tutorial: {
        open: false,
        track: 'basico',
        step: 0,
        done: {},
        flags: { measured: false, cancelled: false, zoomed: false, orthoOn: false, moved: false, copied: false, offset: false, erased: false, undid: false, redid: false, panned: false, plineDrawn: false, selected: false, closed: false },
        advancing: false
      }
    };

    function countType(type) {
      return state.entities.filter(e => e.type === type).length;
    }

    function totalEntities() {
      return state.entities.length;
    }

    function blankTutorialFlags() {
      return {
        measured: false, cancelled: false, zoomed: false, orthoOn: false,
        moved: false, copied: false, offset: false, erased: false,
        undid: false, redid: false, panned: false, plineDrawn: false, selected: false, closed: false
      };
    }

    function getTutorialTracks() {
      return {
        basico: {
          title: 'Guía completa (22 ejercicios)',
          steps: [
            { id: 'welcome', title: '1 · Bienvenida', text: '22 ejercicios cortos. Usa «Empezar este paso», completa la acción y avanza solo. Esc cancela · Enter confirma · F8 Ortho.', action: 'LINE', check: () => true, autoPass: true },
            { id: 'grid', title: '2 · GRID (F7)', text: 'Activa la cuadrícula: F7 o botón GRID (debe quedar encendido).', action: 'GRID', check: () => !!state.modes.grid },
            { id: 'snap', title: '3 · SNAP (F9)', text: 'Activa SNAP (F9). Los puntos se ajustarán a la rejilla de 10 unidades.', action: 'SNAP', check: () => !!state.modes.snap },
            { id: 'ortho', title: '4 · ORTHO (F8)', text: 'Activa ORTHO (F8). Las líneas solo serán horizontales o verticales.', action: 'ORTHO', check: () => !!state.modes.ortho },
            { id: 'osnap', title: '5 · OSNAP (F3)', text: 'Activa OSNAP (F3) para capturar extremos y centros.', action: 'OSNAP', check: () => !!state.modes.osnap },
            { id: 'polar', title: '6 · POLAR (F10)', text: 'Activa POLAR (F10). El cursor se orientará a ángulos de 45°.', action: 'POLAR', check: () => !!state.modes.polar },
            { id: 'dyn', title: '7 · DYN (F12)', text: 'Activa DYN (F12). Verás longitud y ángulo dinámicos junto al cursor.', action: 'DYNAMIC', check: () => !!state.modes.dyn },
            { id: 'line1', title: '8 · Primera LINE', text: 'L-LINE: 2 clics y Enter. Crea al menos 1 línea.', action: 'LINE', check: () => countType('line') >= 1 },
            { id: 'line2', title: '9 · Varios segmentos', text: 'Con L-LINE dibuja varios clics (mín. 3 líneas en total) y Enter.', action: 'LINE', check: () => countType('line') >= 3 },
            { id: 'rect', title: '10 · RECTANG', text: 'REC-RECTANG: dos esquinas opuestas (o @80,50 tras el 1.er clic).', action: 'RECTANG', check: () => countType('rect') >= 1 },
            { id: 'circle', title: '11 · CIRCLE', text: 'C-CIRCLE: clic centro y radio (clic o número, ej. 20).', action: 'CIRCLE', check: () => countType('circle') >= 1 },
            { id: 'pline', title: '12 · PLINE', text: 'PL-PLINE: traza al menos un segmento y Enter.', action: 'PLINE', check: () => !!state.tutorial.flags.plineDrawn },
            { id: 'dist', title: '13 · DIST (medir)', text: 'DI-DIST: dos puntos. Verás distancia, ΔX, ΔY y ángulo.', action: 'DIST', check: () => !!state.tutorial.flags.measured },
            { id: 'select', title: '14 · Selección', text: 'Haz clic sobre un objeto (o SEL) hasta resaltarlo en amarillo.', action: 'SELECT', check: () => state.selection.size >= 1 || !!state.tutorial.flags.selected },
            { id: 'move', title: '15 · MOVE', text: 'M-MOVE: selecciona → punto base → destino.', action: 'MOVE', check: () => !!state.tutorial.flags.moved },
            { id: 'copy', title: '16 · COPY', text: 'CO-COPY: selecciona → base → destino para duplicar.', action: 'COPY', check: () => !!state.tutorial.flags.copied },
            { id: 'offset', title: '17 · OFFSET', text: 'O-OFFSET: clic en una línea y luego al lado para el desfase.', action: 'OFFSET', check: () => !!state.tutorial.flags.offset },
            { id: 'erase', title: '18 · ERASE', text: 'E-ERASE: selecciona un objeto y Enter (o Supr).', action: 'ERASE', check: () => !!state.tutorial.flags.erased },
            { id: 'undo', title: '19 · UNDO', text: 'U-UNDO o Ctrl+Z: deshaz la última acción.', action: 'UNDO', check: () => !!state.tutorial.flags.undid },
            { id: 'esc', title: '20 · Esc (cancelar)', text: 'Activa L-LINE y pulsa Esc. Debe aparecer *Cancelado*.', action: 'LINE', check: () => !!state.tutorial.flags.cancelled },
            { id: 'pan', title: '21 · PAN', text: 'P-PAN: arrastra el lienzo (o rueda central / Alt+clic).', action: 'PAN', check: () => !!state.tutorial.flags.panned },
            { id: 'zoom', title: '22 · Zoom Extents', text: 'Z-ZOOM → E + Enter para encajar todo el dibujo.', action: 'ZOOM', check: () => !!state.tutorial.flags.zoomed }
          ]
        },
        line: {
          title: 'Práctica LINE (6 pasos)',
          steps: [
            { id: 'l1', title: 'Ortho ON', text: 'F8 o ORTHO.', action: 'ORTHO', check: () => state.modes.ortho },
            { id: 'l2', title: 'Primera línea', text: 'L-LINE · 2 clics · Enter.', action: 'LINE', check: () => countType('line') >= 1 },
            { id: 'l3', title: 'Cadena', text: 'Dibuja hasta tener ≥3 líneas.', action: 'LINE', check: () => countType('line') >= 3 },
            { id: 'l4', title: 'Cerrar con C', text: 'Con LINE y ≥2 puntos, escribe C + Enter.', action: 'LINE', check: () => !!state.tutorial.flags.closed || countType('line') >= 4 },
            { id: 'l5', title: 'Medir', text: 'DI-DIST entre dos puntos.', action: 'DIST', check: () => !!state.tutorial.flags.measured },
            { id: 'l6', title: 'Extents', text: 'Z-ZOOM → E + Enter.', action: 'ZOOM', check: () => !!state.tutorial.flags.zoomed }
          ]
        },
        rectang: {
          title: 'Práctica RECTANG (5 pasos)',
          steps: [
            { id: 'r1', title: 'Ortho', text: 'Activa F8.', action: 'ORTHO', check: () => state.modes.ortho },
            { id: 'r2', title: 'Activar REC', text: 'Pulsa REC-RECTANG.', action: 'RECTANG', check: () => state.tool === 'RECTANG' || countType('rect') >= 1 },
            { id: 'r3', title: 'Dibujar', text: 'Dos esquinas o @100,60.', action: 'RECTANG', check: () => countType('rect') >= 1 },
            { id: 'r4', title: 'Segundo rect', text: 'Crea otro (total ≥2).', action: 'RECTANG', check: () => countType('rect') >= 2 },
            { id: 'r5', title: 'Medir lado', text: 'DI-DIST en un lado.', action: 'DIST', check: () => !!state.tutorial.flags.measured }
          ]
        },
        circle: {
          title: 'Práctica CIRCLE (5 pasos)',
          steps: [
            { id: 'c1', title: 'OSNAP', text: 'F3 ON.', action: 'OSNAP', check: () => state.modes.osnap },
            { id: 'c2', title: 'Activar C', text: 'C-CIRCLE.', action: 'CIRCLE', check: () => state.tool === 'CIRCLE' || countType('circle') >= 1 },
            { id: 'c3', title: 'Centro + radio', text: 'Clic centro y radio 25.', action: 'CIRCLE', check: () => countType('circle') >= 1 },
            { id: 'c4', title: 'Segundo círculo', text: 'Crea otro (total ≥2).', action: 'CIRCLE', check: () => countType('circle') >= 2 },
            { id: 'c5', title: 'Extents', text: 'Z-ZOOM → E.', action: 'ZOOM', check: () => !!state.tutorial.flags.zoomed }
          ]
        }
      };
    }

    function pickTrackForFocus(focus) {
      if (focus === 'LINE' || focus === 'COORDS') return 'line';
      if (focus === 'RECTANG') return 'rectang';
      if (focus === 'CIRCLE') return 'circle';
      return 'basico';
    }

    function currentTrack() {
      return getTutorialTracks()[state.tutorial.track] || getTutorialTracks().basico;
    }

    function currentStep() {
      const track = currentTrack();
      return track.steps[state.tutorial.step] || track.steps[0];
    }

    function renderTutorial() {
      if (!tutPanel) return;
      const track = currentTrack();
      const step = currentStep();
      const total = track.steps.length;
      const idx = state.tutorial.step;
      const done = !!state.tutorial.done[step.id];
      tutPanel.hidden = !state.tutorial.open;
      if (tutTitle) tutTitle.textContent = '📚 ' + track.title;
      if (tutStepNum) tutStepNum.textContent = 'Paso ' + (idx + 1) + '/' + total;
      if (tutStepTitle) tutStepTitle.textContent = step.title;
      if (tutStepText) tutStepText.textContent = step.text;
      if (tutStatus) {
        tutStatus.textContent = done ? '✅ Completado' : '⏳ Pendiente — haz la acción indicada';
        tutStatus.className = 'acad-tut-status' + (done ? ' ok' : '');
      }
      if (tutBar) tutBar.style.width = (100 * (idx + (done ? 1 : 0)) / total) + '%';
      if (tutDo) {
        tutDo.textContent = done
          ? (idx >= total - 1 ? '🎉 Finalizar guía' : '➡ Siguiente paso')
          : ('▶ ' + (step.action ? 'Activar ' + step.action : 'Empezar'));
      }
    }

    function openTutorial(trackId) {
      state.tutorial.open = true;
      state.tutorial.track = trackId || state.tutorial.track || 'basico';
      state.tutorial.step = 0;
      state.tutorial.done = {};
      state.tutorial.flags = blankTutorialFlags();
      state.tutorial.advancing = false;
      // Lienzo limpio para practicar
      state.entities = [];
      state.selection.clear();
      state.pts = [];
      state.tool = null;
      state.view = { x: 40, y: 40, scale: 2.5 };
      root.classList.add('tut-open');
      rebuildInterface();
      flash('📚 Guía iniciada: ' + currentTrack().title, true);
      renderTutorial();
      const step = currentStep();
      if (step.autoPass) {
        state.tutorial.done[step.id] = true;
        renderTutorial();
      }
      updatePrompt();
      requestAnimationFrame(() => {
        resize();
        draw();
      });
      try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    }

    function closeTutorial() {
      state.tutorial.open = false;
      root.classList.remove('tut-open');
      renderTutorial();
      rebuildInterface();
      flash('Guía cerrada. Puedes reabrirla con 📚 Guía', true);
      requestAnimationFrame(() => resize());
    }

    function tutorialDoStep() {
      const step = currentStep();
      const track = currentTrack();
      if (state.tutorial.done[step.id]) {
        if (state.tutorial.step >= track.steps.length - 1) {
          flash('🎉 ¡Guía completada! Ya manejas lo básico del Mini AutoCAD.', true);
          closeTutorial();
          return;
        }
        state.tutorial.step++;
        state.tutorial.advancing = false;
        prepareStepFlags(currentStep());
        renderTutorial();
        const next = currentStep();
        if (next.autoPass) {
          state.tutorial.done[next.id] = true;
          renderTutorial();
        }
        return;
      }
      // Activar herramienta / modo sugerido
      const modeMap = { ORTHO: 'ortho', GRID: 'grid', SNAP: 'snap', POLAR: 'polar', OSNAP: 'osnap', DYNAMIC: 'dyn' };
      if (step.action && modeMap[step.action]) {
        const key = modeMap[step.action];
        if (!state.modes[key]) toggleMode(key);
      } else if (step.action && isAllowed(step.action)) {
        startTool(step.action);
      } else if (step.action) {
        startTool(step.action);
      }
      flash('Ahora completa: ' + step.title, true);
      tutorialCheck();
    }

    function prepareStepFlags(step) {
      if (!step) return;
      const id = step.id;
      const f = state.tutorial.flags;
      try {
        if (id === 'grid') { state.modes.grid = false; syncModeButtons(); }
        if (id === 'snap') { state.modes.snap = false; syncModeButtons(); }
        if (id === 'ortho' || id === 'l1' || id === 'r1') { state.modes.ortho = false; syncModeButtons(); }
        if (id === 'osnap' || id === 'c1') { state.modes.osnap = false; syncModeButtons(); }
        if (id === 'polar') { state.modes.polar = false; syncModeButtons(); }
        if (id === 'dyn') { state.modes.dyn = false; syncModeButtons(); }
        if (id === 'dist' || id === 'l5' || id === 'r5') f.measured = false;
        if (id === 'esc') f.cancelled = false;
        if (id === 'zoom' || id === 'l6' || id === 'c5') f.zoomed = false;
        if (id === 'move') f.moved = false;
        if (id === 'copy') f.copied = false;
        if (id === 'offset') f.offset = false;
        if (id === 'erase') f.erased = false;
        if (id === 'undo') f.undid = false;
        if (id === 'pan') f.panned = false;
        if (id === 'pline') f.plineDrawn = false;
        if (id === 'select') { f.selected = false; state.selection.clear(); }
        if (id === 'l4') f.closed = false;
        draw();
      } catch (err) { /* ignore */ }
    }

    function tutorialPrev() {
      if (state.tutorial.step > 0) {
        state.tutorial.step--;
        prepareStepFlags(currentStep());
        renderTutorial();
      }
    }

    function tutorialNext() {
      const track = currentTrack();
      if (state.tutorial.step < track.steps.length - 1) {
        state.tutorial.step++;
        prepareStepFlags(currentStep());
        renderTutorial();
      } else {
        flash('Último paso. Complétalo o pulsa Finalizar.', true);
      }
    }

    function tutorialCheck() {
      if (!state.tutorial.open || state.tutorial.advancing) return;
      const step = currentStep();
      if (!step || state.tutorial.done[step.id]) return;
      let ok = false;
      try { ok = !!step.check(); } catch (e) { ok = false; }
      if (!ok) return;
      state.tutorial.done[step.id] = true;
      state.tutorial.advancing = true;
      flash('✅ Paso completado: ' + step.title, true);
      renderTutorial();
      const expectedStepId = step.id;
      setTimeout(() => {
        if (!state.tutorial.open || !state.tutorial.done[expectedStepId]) return;
        state.tutorial.advancing = false;
        try {
          const track = currentTrack();
          if (state.tutorial.step < track.steps.length - 1) {
            state.tutorial.step++;
            prepareStepFlags(currentStep());
            renderTutorial();
            const next = currentStep();
            if (next && next.autoPass) {
              state.tutorial.done[next.id] = true;
              renderTutorial();
            }
          } else {
            flash('🎉 ¡Guía completada! Excelente trabajo.', true);
            if (tutStatus) {
              tutStatus.textContent = '🎉 Guía completada';
              tutStatus.className = 'acad-tut-status ok';
            }
            if (tutBar) tutBar.style.width = '100%';
            if (tutDo) tutDo.textContent = '🎉 Finalizar guía';
          }
        } catch (err) {
          state.tutorial.advancing = false;
        }
      }, 900);
    }

    function flash(text, ok) {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.className = 'acad-msg ' + (ok ? 'ok' : 'warn');
      clearTimeout(flash._t);
      flash._t = setTimeout(() => {
        if (!msgEl) return;
        msgEl.textContent = '';
        msgEl.className = 'acad-msg';
      }, 3500);
    }

    function updatePrompt() {
      let text = 'Command: _';
      const t = state.tool;
      if (t === 'LINE' || t === 'PLINE') {
        text = state.pts.length ? 'Specify next point or [Close/Undo]:' : 'Specify first point:';
      } else if (t === 'RECTANG') {
        text = state.pts.length ? 'Specify other corner point or [@ancho,alto]:' : 'Specify first corner point:';
      } else if (t === 'CIRCLE') {
        text = state.pts.length ? 'Specify radius:' : 'Specify center point:';
      } else if (t === 'MOVE' || t === 'COPY') {
        if (!state.selection.size) text = t + ': Select objects:';
        else if (!state.moveBase) text = 'Specify base point:';
        else text = 'Specify second point:';
      } else if (t === 'OFFSET') {
        text = 'Select line to offset (dist=' + state.offsetDist + ') or type distance:';
      } else if (t === 'ERASE') {
        text = 'Select objects to erase [Enter]:';
      } else if (t === 'SELECT') {
        text = 'Select objects:';
      } else if (t === 'DIST') {
        text = state.distPts.length ? 'Specify second point:' : 'Specify first point:';
      } else if (t === 'ZOOM') {
        text = 'ZOOM: scroll wheel or [E]=Extents [P]=Previous:';
      } else if (t === 'PAN') {
        text = 'PAN: drag to displace view:';
      }
      if (promptLine) promptLine.textContent = text;
      if (promptLabel) {
        promptLabel.textContent = t ? (t + ':') : 'Command:';
      }
      // Resaltar botón activo
      root.querySelectorAll('.acad-ribbon button[data-cmd]').forEach(btn => {
        btn.classList.toggle('active-tool', btn.getAttribute('data-cmd') === t);
      });
      const countEl = root.querySelector('#acadObjCount');
      if (countEl) countEl.textContent = state.entities.length + ' obj';
    }

    function isAllowed(cmd) {
      // Durante la guía se habilitan los comandos de dibujo necesarios
      if (state.tutorial.open && (DRAW_SET.indexOf(cmd) >= 0 || cmd === 'HELP' || cmd === 'ORTHO' || cmd === 'OSNAP' || cmd === 'GRID' || cmd === 'SNAP' || cmd === 'POLAR' || cmd === 'DYNAMIC')) {
        return true;
      }
      const a = state.allowed;
      if (a === 'DRAW' || a === 'EXPLORE') return DRAW_SET.indexOf(cmd) >= 0 || cmd === 'HELP';
      if (a === 'DIST') return ['DIST', 'LINE', 'CLEAR', 'ZOOM', 'PAN'].indexOf(cmd) >= 0;
      if (a === 'LINE') return ['LINE', 'RECTANG', 'CIRCLE', 'PLINE', 'DIST', 'ORTHO', 'UNDO', 'REDO', 'CLEAR', 'ERASE', 'ZOOM', 'PAN'].indexOf(cmd) >= 0;
      if (a === 'RECTANG') return ['RECTANG', 'LINE', 'ORTHO', 'UNDO', 'CLEAR', 'ERASE', 'ZOOM', 'PAN'].indexOf(cmd) >= 0;
      if (a === 'CIRCLE') return ['CIRCLE', 'LINE', 'UNDO', 'CLEAR', 'ERASE', 'ZOOM', 'PAN', 'OSNAP'].indexOf(cmd) >= 0;
      if (a === 'PLINE') return ['PLINE', 'LINE', 'UNDO', 'CLEAR', 'ERASE', 'ORTHO', 'ZOOM', 'PAN'].indexOf(cmd) >= 0;
      if (a === 'MOVE') return ['MOVE', 'SELECT', 'UNDO', 'CLEAR', 'ZOOM', 'PAN'].indexOf(cmd) >= 0;
      if (a === 'COPY') return ['COPY', 'SELECT', 'UNDO', 'CLEAR', 'ZOOM', 'PAN'].indexOf(cmd) >= 0;
      if (a === 'OFFSET') return ['OFFSET', 'SELECT', 'UNDO', 'CLEAR', 'LINE', 'ZOOM', 'PAN'].indexOf(cmd) >= 0;
      if (a === 'COORDS') return ['LINE', 'RECTANG', 'CIRCLE', 'COORDS', 'CLEAR', 'UNDO', 'REDO', 'ORTHO', 'ZOOM', 'PAN'].indexOf(cmd) >= 0;
      if (a === 'FILES') return cmd === 'FILES' || cmd === 'CLEAR';
      if (a === 'SELECT') return ['SELECT', 'ERASE', 'MOVE', 'COPY', 'CLEAR', 'UNDO'].indexOf(cmd) >= 0;
      if (a === 'OSNAP') return ['OSNAP', 'LINE', 'CIRCLE', 'RECTANG', 'CLEAR', 'UNDO'].indexOf(cmd) >= 0;
      if (a === 'GRID' || a === 'SNAP' || a === 'ORTHO' || a === 'POLAR' || a === 'DYNAMIC') {
        return cmd === a || DRAW_SET.indexOf(cmd) >= 0;
      }
      if (a === 'UNITS') return cmd === 'UNITS' || cmd === 'CLEAR';
      if (a === 'ZOOM') return ['ZOOM', 'PAN', 'CLEAR'].indexOf(cmd) >= 0;
      if (a === 'PAN') return ['PAN', 'ZOOM', 'CLEAR'].indexOf(cmd) >= 0;
      if (a === 'ERASE') return ['ERASE', 'SELECT', 'UNDO', 'CLEAR'].indexOf(cmd) >= 0;
      if (a === 'UNDO') return ['UNDO', 'LINE', 'RECTANG', 'CIRCLE', 'CLEAR'].indexOf(cmd) >= 0;
      if (a === 'REDO') return ['REDO', 'UNDO', 'LINE', 'CLEAR'].indexOf(cmd) >= 0;
      if (a === 'UI') return ['PAN', 'ZOOM', 'LINE', 'RECTANG', 'CIRCLE', 'CLEAR'].indexOf(cmd) >= 0;
      return cmd === a || cmd === 'CLEAR';
    }

    function deny(cmd) {
      flash('"' + cmd + '" no está activo aquí. Practica: ' + (CMD_LABELS[state.allowed] || state.allowed), false);
    }

    function pushUndo() {
      state.undoStack.push(JSON.stringify(state.entities));
      if (state.undoStack.length > 50) state.undoStack.shift();
      state.redoStack = [];
    }

    function worldToScreen(wx, wy) {
      const r = canvas.getBoundingClientRect();
      return {
        x: (wx - state.view.x) * state.view.scale + r.width / 2,
        y: r.height / 2 - (wy - state.view.y) * state.view.scale
      };
    }

    function screenToWorld(sx, sy) {
      const r = canvas.getBoundingClientRect();
      return {
        x: (sx - r.width / 2) / state.view.scale + state.view.x,
        y: (r.height / 2 - sy) / state.view.scale + state.view.y
      };
    }

    function snapPoint(wx, wy, useOrthoFrom) {
      let x = wx, y = wy;
      if (state.modes.snap) {
        const s = 10;
        x = Math.round(x / s) * s;
        y = Math.round(y / s) * s;
      }
      const base = useOrthoFrom || (state.pts.length ? state.pts[state.pts.length - 1] : null);
      if (state.modes.ortho && base) {
        if (Math.abs(x - base.x) >= Math.abs(y - base.y)) y = base.y;
        else x = base.x;
      }
      if (state.modes.polar && base) {
        const dx = x - base.x, dy = y - base.y;
        const dist = Math.hypot(dx, dy);
        let ang = Math.atan2(dy, dx) * 180 / Math.PI;
        ang = Math.round(ang / 45) * 45;
        const rad = ang * Math.PI / 180;
        x = base.x + Math.cos(rad) * dist;
        y = base.y + Math.sin(rad) * dist;
      }
      if (state.modes.osnap && state.entities.length) {
        const tol = 12 / state.view.scale;
        let best = null, bestD = tol;
        state.entities.forEach(e => {
          const pts = entitySnapPts(e);
          pts.forEach(p => {
            const d = Math.hypot(x - p.x, y - p.y);
            if (d < bestD) { bestD = d; best = p; }
          });
        });
        if (best) { x = best.x; y = best.y; }
      }
      return { x, y };
    }

    function entitySnapPts(e) {
      if (e.type === 'line') return [
        { x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 },
        { x: (e.x1 + e.x2) / 2, y: (e.y1 + e.y2) / 2 }
      ];
      if (e.type === 'rect') {
        return [
          { x: e.x, y: e.y }, { x: e.x + e.w, y: e.y },
          { x: e.x + e.w, y: e.y + e.h }, { x: e.x, y: e.y + e.h },
          { x: e.x + e.w / 2, y: e.y + e.h / 2 }
        ];
      }
      if (e.type === 'circle') {
        return [
          { x: e.cx, y: e.cy },
          { x: e.cx + e.r, y: e.cy }, { x: e.cx - e.r, y: e.cy },
          { x: e.cx, y: e.cy + e.r }, { x: e.cx, y: e.cy - e.r }
        ];
      }
      return [];
    }

    function entityBounds(e) {
      if (e.type === 'line') {
        return {
          minX: Math.min(e.x1, e.x2), maxX: Math.max(e.x1, e.x2),
          minY: Math.min(e.y1, e.y2), maxY: Math.max(e.y1, e.y2)
        };
      }
      if (e.type === 'rect') {
        const x0 = Math.min(e.x, e.x + e.w), x1 = Math.max(e.x, e.x + e.w);
        const y0 = Math.min(e.y, e.y + e.h), y1 = Math.max(e.y, e.y + e.h);
        return { minX: x0, maxX: x1, minY: y0, maxY: y1 };
      }
      if (e.type === 'circle') {
        return { minX: e.cx - e.r, maxX: e.cx + e.r, minY: e.cy - e.r, maxY: e.cy + e.r };
      }
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    function fmt(n) { return Number(n).toFixed(state.units.precision); }

    function resize() {
      const vp = root.querySelector('.acad-viewport');
      if (!vp || vp.style.display === 'none') return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(vp.clientWidth));
      const h = Math.max(1, Math.floor(vp.clientHeight));
      if (w < 2 || h < 2) return;
      const bw = Math.floor(w * dpr);
      const bh = Math.floor(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      // El CSS absoluto controla el tamaño visual; no forzar px que peleen con !important
      canvas.style.width = '';
      canvas.style.height = '';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function drawEntity(e, selected) {
      ctx.strokeStyle = selected ? '#ffdd00' : '#00f0ff';
      ctx.lineWidth = selected ? 2.4 : 1.5;
      if (e.type === 'line') {
        const a = worldToScreen(e.x1, e.y1), b = worldToScreen(e.x2, e.y2);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      } else if (e.type === 'rect') {
        const a = worldToScreen(e.x, e.y);
        const b = worldToScreen(e.x + e.w, e.y + e.h);
        ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      } else if (e.type === 'circle') {
        const c = worldToScreen(e.cx, e.cy);
        const edge = worldToScreen(e.cx + e.r, e.cy);
        const r = Math.abs(edge.x - c.x);
        ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2); ctx.stroke();
      }
    }

    function draw() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(12,12,16,0.55)';
      ctx.fillRect(0, 0, w, h);

      if (state.modes.grid) {
        const step = 10;
        const tl = screenToWorld(0, 0), br = screenToWorld(w, h);
        const x0 = Math.floor(Math.min(tl.x, br.x) / step) * step;
        const x1 = Math.ceil(Math.max(tl.x, br.x) / step) * step;
        const y0 = Math.floor(Math.min(tl.y, br.y) / step) * step;
        const y1 = Math.ceil(Math.max(tl.y, br.y) / step) * step;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += step) {
          const a = worldToScreen(x, y0), b = worldToScreen(x, y1);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        }
        for (let y = y0; y <= y1; y += step) {
          const a = worldToScreen(x0, y), b = worldToScreen(x1, y);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        }
        ctx.strokeStyle = 'rgba(0,240,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const o = worldToScreen(0, 0);
      ctx.beginPath();
      ctx.moveTo(0, o.y); ctx.lineTo(w, o.y);
      ctx.moveTo(o.x, 0); ctx.lineTo(o.x, h);
      ctx.strokeStyle = 'rgba(255,0,255,0.22)';
      ctx.stroke();

      state.entities.forEach((e, i) => drawEntity(e, state.selection.has(i)));

      // rubber bands
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 1.5;
      if ((state.tool === 'LINE' || state.tool === 'PLINE') && state.pts.length) {
        const last = state.pts[state.pts.length - 1];
        const a = worldToScreen(last.x, last.y);
        const b = worldToScreen(state.mouse.wx, state.mouse.wy);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      if (state.tool === 'RECTANG' && state.pts.length === 1) {
        const p = state.pts[0];
        const a = worldToScreen(p.x, p.y);
        const b = worldToScreen(state.mouse.wx, state.mouse.wy);
        ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      }
      if (state.tool === 'CIRCLE' && state.pts.length === 1) {
        const p = state.pts[0];
        const c = worldToScreen(p.x, p.y);
        const edge = worldToScreen(state.mouse.wx, state.mouse.wy);
        const r = Math.hypot(edge.x - c.x, edge.y - c.y);
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
      }
      if ((state.tool === 'MOVE' || state.tool === 'COPY') && state.moveBase) {
        const a = worldToScreen(state.moveBase.x, state.moveBase.y);
        const b = worldToScreen(state.mouse.wx, state.mouse.wy);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      if (state.tool === 'DIST' && state.distPts.length === 1) {
        const a = worldToScreen(state.distPts[0].x, state.distPts[0].y);
        const b = worldToScreen(state.mouse.wx, state.mouse.wy);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Grips en selección
      state.selection.forEach(i => {
        const e = state.entities[i];
        if (!e) return;
        entitySnapPts(e).forEach(p => {
          const s = worldToScreen(p.x, p.y);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(s.x - 3, s.y - 3, 6, 6);
        });
      });

      if (state.selectBox) {
        const { x0, y0, x1, y1 } = state.selectBox;
        const crossing = x1 < x0;
        ctx.fillStyle = crossing ? 'rgba(0,255,65,0.12)' : 'rgba(0,120,255,0.12)';
        ctx.strokeStyle = crossing ? '#00ff41' : '#3aa0ff';
        ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
        ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      }

      ctx.beginPath();
      ctx.moveTo(state.mouse.x - 12, state.mouse.y); ctx.lineTo(state.mouse.x + 12, state.mouse.y);
      ctx.moveTo(state.mouse.x, state.mouse.y - 12); ctx.lineTo(state.mouse.x, state.mouse.y + 12);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.stroke();

      if (state.modes.dyn) {
        dynEl.hidden = false;
        let t = fmt(state.mouse.wx) + ', ' + fmt(state.mouse.wy);
        if ((state.tool === 'LINE' || state.tool === 'PLINE') && state.pts.length) {
          const p = state.pts[state.pts.length - 1];
          const dx = state.mouse.wx - p.x, dy = state.mouse.wy - p.y;
          let ang = Math.atan2(dy, dx) * 180 / Math.PI;
          if (ang < 0) ang += 360;
          t = 'L=' + fmt(Math.hypot(dx, dy)) + '  ∠' + fmt(ang) + '°';
        } else if (state.tool === 'CIRCLE' && state.pts.length === 1) {
          t = 'R=' + fmt(Math.hypot(state.mouse.wx - state.pts[0].x, state.mouse.wy - state.pts[0].y));
        } else if (state.tool === 'RECTANG' && state.pts.length === 1) {
          t = 'W=' + fmt(Math.abs(state.mouse.wx - state.pts[0].x)) + ' H=' + fmt(Math.abs(state.mouse.wy - state.pts[0].y));
        } else if (state.tool === 'DIST' && state.distPts.length === 1) {
          const dx = state.mouse.wx - state.distPts[0].x, dy = state.mouse.wy - state.distPts[0].y;
          let ang = Math.atan2(dy, dx) * 180 / Math.PI;
          if (ang < 0) ang += 360;
          t = 'DIST=' + fmt(Math.hypot(dx, dy)) + '  ∠' + fmt(ang) + '°';
        }
        dynEl.textContent = t;
        dynEl.style.left = Math.min(state.mouse.x + 14, w - 120) + 'px';
        dynEl.style.top = Math.max(4, state.mouse.y - 22) + 'px';
      } else dynEl.hidden = true;
    }

    function addEntity(ent) {
      pushUndo();
      state.entities.push(ent);
      draw();
      updatePrompt();
      tutorialCheck();
    }

    function parseCoord(str) {
      str = str.trim();
      let m = str.match(/^@\s*([-\d.]+)\s*<\s*([-\d.]+)\s*$/);
      if (m) {
        const d = parseFloat(m[1]), a = parseFloat(m[2]) * Math.PI / 180;
        const base = state.pts[state.pts.length - 1] || state.moveBase || { x: 0, y: 0 };
        return { x: base.x + Math.cos(a) * d, y: base.y + Math.sin(a) * d };
      }
      m = str.match(/^@\s*([-\d.]+)\s*,\s*([-\d.]+)\s*$/);
      if (m) {
        const base = state.pts[state.pts.length - 1] || state.moveBase || { x: 0, y: 0 };
        return { x: base.x + parseFloat(m[1]), y: base.y + parseFloat(m[2]) };
      }
      m = str.match(/^([-\d.]+)\s*,\s*([-\d.]+)\s*$/);
      if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
      m = str.match(/^([-\d.]+)\s*$/);
      if (m && state.pts.length) {
        const d = parseFloat(m[1]);
        const p = state.pts[state.pts.length - 1];
        let dx = state.mouse.wx - p.x, dy = state.mouse.wy - p.y;
        if (state.modes.ortho) {
          if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0;
        }
        const len = Math.hypot(dx, dy) || 1;
        return { x: p.x + dx / len * d, y: p.y + dy / len * d };
      }
      return null;
    }

    function startTool(cmd) {
      if (cmd === 'CLEAR') {
        pushUndo();
        state.entities = [];
        state.selection.clear();
        state.pts = [];
        state.tool = null;
        state.moveBase = null;
        flash('Dibujo limpio', true);
        draw();
        return;
      }
      if (!isAllowed(cmd)) { deny(cmd); return; }

      state.pts = [];
      state.moveBase = null;
      if (['LINE', 'RECTANG', 'CIRCLE', 'PLINE', 'MOVE', 'COPY', 'OFFSET', 'ERASE', 'SELECT', 'PAN', 'ZOOM', 'DIST'].indexOf(cmd) >= 0) {
        state.lastCmd = cmd;
      }

      if (cmd === 'LINE') {
        state.tool = 'LINE';
        flash('LINE: clics sucesivos · Enter termina · C cierra · Esc cancela', true);
        input.focus(); updatePrompt(); return;
      }
      if (cmd === 'PLINE') {
        state.tool = 'PLINE';
        flash('PLINE: clics · Enter termina · C cierra', true);
        input.focus(); updatePrompt(); return;
      }
      if (cmd === 'RECTANG') {
        state.tool = 'RECTANG';
        flash('RECTANG: 1er clic esquina · 2º clic esquina opuesta (o @ancho,alto)', true);
        input.focus(); updatePrompt(); return;
      }
      if (cmd === 'CIRCLE') {
        state.tool = 'CIRCLE';
        flash('CIRCLE: centro · luego radio (clic o número)', true);
        input.focus(); updatePrompt(); return;
      }
      if (cmd === 'MOVE') {
        state.tool = 'MOVE';
        if (!state.selection.size) flash('MOVE: selecciona objetos (clic) · luego punto base · destino', true);
        else flash('MOVE: indica punto base y luego destino', true);
        updatePrompt(); return;
      }
      if (cmd === 'COPY') {
        state.tool = 'COPY';
        if (!state.selection.size) flash('COPY: selecciona · punto base · destino', true);
        else flash('COPY: punto base · destino', true);
        updatePrompt(); return;
      }
      if (cmd === 'OFFSET') {
        state.tool = 'OFFSET';
        flash('OFFSET: selecciona una línea · clic al lado (dist=' + state.offsetDist + '). Escribe distancia antes.', true);
        updatePrompt(); return;
      }
      if (cmd === 'ERASE') {
        state.tool = 'ERASE';
        flash('ERASE: selecciona y Enter (o Supr)', true);
        updatePrompt(); return;
      }
      if (cmd === 'SELECT') {
        state.tool = 'SELECT';
        flash('SELECT: Window (→) o Crossing (←)', true);
        updatePrompt(); return;
      }
      if (cmd === 'PAN') { state.tool = 'PAN'; flash('PAN: arrastra', true); updatePrompt(); return; }
      if (cmd === 'ZOOM') { state.tool = 'ZOOM'; flash('ZOOM: rueda · E=Extents · P=Previous', true); input.focus(); updatePrompt(); return; }
      if (cmd === 'DIST') {
        state.tool = 'DIST';
        state.distPts = [];
        flash('DIST: indica dos puntos para medir', true);
        updatePrompt();
        return;
      }
      if (cmd === 'UNITS') { openUnits(); updatePrompt(); return; }
      if (cmd === 'UNDO') { doUndo(); return; }
      if (cmd === 'REDO') { doRedo(); return; }
      if (cmd === 'FILES') {
        flash('Archivos reales: CTRL+N / O / S · Plantilla ACADISO', true);
        return;
      }
      if (cmd === 'GRID' || cmd === 'SNAP' || cmd === 'ORTHO' || cmd === 'POLAR' || cmd === 'DYNAMIC' || cmd === 'OSNAP') {
        const map = { GRID: 'grid', SNAP: 'snap', ORTHO: 'ortho', POLAR: 'polar', DYNAMIC: 'dyn', OSNAP: 'osnap' };
        toggleMode(map[cmd]);
        return;
      }
      flash(CMD_LABELS[cmd] || cmd, true);
      updatePrompt();
    }

    function openUnits() {
      const length = prompt('UNITS — Tipo de longitud:', state.units.length);
      if (length == null) return;
      const precision = prompt('Precisión (0-8):', String(state.units.precision));
      if (precision == null) return;
      const insert = prompt('Unidades de inserción:', state.units.insert);
      if (insert == null) return;
      state.units.length = length || state.units.length;
      state.units.precision = Math.max(0, Math.min(8, parseInt(precision, 10) || 2));
      state.units.insert = insert || state.units.insert;
      flash('UNITS OK', true);
    }

    function doUndo() {
      if (!isAllowed('UNDO')) { deny('UNDO'); return; }
      if (!state.undoStack.length) { flash('Nada que deshacer', false); return; }
      state.redoStack.push(JSON.stringify(state.entities));
      state.entities = JSON.parse(state.undoStack.pop());
      state.selection.clear();
      flash('UNDO', true);
      state.tutorial.flags.undid = true;
      draw();
      tutorialCheck();
    }

    function doRedo() {
      if (!isAllowed('REDO')) { deny('REDO'); return; }
      if (!state.redoStack.length) { flash('Nada que rehacer', false); return; }
      state.undoStack.push(JSON.stringify(state.entities));
      state.entities = JSON.parse(state.redoStack.pop());
      flash('REDO', true);
      state.tutorial.flags.redid = true;
      draw();
      tutorialCheck();
    }

    function placePoint(pt) {
      pt = snapPoint(pt.x, pt.y);
      const tool = state.tool;

      if (tool === 'LINE' || tool === 'PLINE') {
        if (state.pts.length) {
          addEntity({ type: 'line', x1: state.pts[state.pts.length - 1].x, y1: state.pts[state.pts.length - 1].y, x2: pt.x, y2: pt.y });
          if (tool === 'PLINE') state.tutorial.flags.plineDrawn = true;
        }
        state.pts.push(pt);
        flash('Punto ' + fmt(pt.x) + ',' + fmt(pt.y) + ' · Enter termina', true);
        return;
      }
      if (tool === 'RECTANG') {
        state.pts.push(pt);
        if (state.pts.length === 2) {
          const a = state.pts[0], b = state.pts[1];
          addEntity({ type: 'rect', x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });
          state.pts = [];
          flash('Rectángulo creado', true);
        } else flash('Esquina 1 OK · indica esquina opuesta', true);
        return;
      }
      if (tool === 'CIRCLE') {
        state.pts.push(pt);
        if (state.pts.length === 2) {
          const c = state.pts[0], p = state.pts[1];
          const r = Math.hypot(p.x - c.x, p.y - c.y);
          if (r > 0.01) {
            addEntity({ type: 'circle', cx: c.x, cy: c.y, r: r });
            flash('Círculo R=' + fmt(r), true);
          }
          state.pts = [];
        } else flash('Centro OK · indica radio', true);
        return;
      }
      if (tool === 'MOVE' || tool === 'COPY') {
        if (!state.selection.size) {
          pickNearest(pt);
          return;
        }
        if (!state.moveBase) {
          state.moveBase = pt;
          flash('Punto base OK · indica destino', true);
          draw();
          return;
        }
        const dx = pt.x - state.moveBase.x, dy = pt.y - state.moveBase.y;
        pushUndo();
        const idxs = Array.from(state.selection);
        if (tool === 'COPY') {
          idxs.forEach(i => {
            const e = JSON.parse(JSON.stringify(state.entities[i]));
            translateEntity(e, dx, dy);
            state.entities.push(e);
          });
          flash('COPY OK', true);
          state.tutorial.flags.copied = true;
        } else {
          idxs.forEach(i => translateEntity(state.entities[i], dx, dy));
          flash('MOVE OK', true);
          state.tutorial.flags.moved = true;
        }
        state.moveBase = null;
        state.selection.clear();
        draw();
        tutorialCheck();
        return;
      }
      if (tool === 'OFFSET') {
        const idx = nearestEntity(pt);
        if (idx < 0) { flash('Selecciona una línea', false); return; }
        const e = state.entities[idx];
        if (e.type !== 'line') { flash('OFFSET: solo líneas en este mini', false); return; }
        const d = state.offsetDist;
        const dx = e.x2 - e.x1, dy = e.y2 - e.y1;
        const len = Math.hypot(dx, dy) || 1;
        let nx = -dy / len, ny = dx / len;
        const cx = (e.x1 + e.x2) / 2, cy = (e.y1 + e.y2) / 2;
        const side = (pt.x - cx) * nx + (pt.y - cy) * ny;
        if (side < 0) { nx = -nx; ny = -ny; }
        addEntity({
          type: 'line',
          x1: e.x1 + nx * d, y1: e.y1 + ny * d,
          x2: e.x2 + nx * d, y2: e.y2 + ny * d
        });
        state.tutorial.flags.offset = true;
        flash('OFFSET ' + fmt(d), true);
        updatePrompt();
        tutorialCheck();
        return;
      }
      if (tool === 'DIST') {
        state.distPts.push(pt);
        if (state.distPts.length === 2) {
          const a = state.distPts[0], b = state.distPts[1];
          const dx = b.x - a.x, dy = b.y - a.y;
          let ang = Math.atan2(dy, dx) * 180 / Math.PI;
          if (ang < 0) ang += 360;
          flash('DIST = ' + fmt(Math.hypot(dx, dy)) + '  |  ΔX=' + fmt(dx) + ' ΔY=' + fmt(dy) + '  |  ∠' + fmt(ang) + '°', true);
          state.distPts = [];
          state.tutorial.flags.measured = true;
          tutorialCheck();
        } else {
          flash('Primer punto OK · indica el segundo', true);
        }
        updatePrompt();
        draw();
        return;
      }
      if (tool === 'ERASE' || tool === 'SELECT') {
        pickNearest(pt);
      }
      updatePrompt();
    }

    function translateEntity(e, dx, dy) {
      if (e.type === 'line') { e.x1 += dx; e.y1 += dy; e.x2 += dx; e.y2 += dy; }
      else if (e.type === 'rect') { e.x += dx; e.y += dy; }
      else if (e.type === 'circle') { e.cx += dx; e.cy += dy; }
    }

    function nearestEntity(pt) {
      let best = -1, bestD = 14 / state.view.scale;
      state.entities.forEach((e, i) => {
        entitySnapPts(e).forEach(p => {
          const d = Math.hypot(pt.x - p.x, pt.y - p.y);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (e.type === 'line') {
          // distance to segment approximate via midpoint already in snap pts
        }
        if (e.type === 'circle') {
          const d = Math.abs(Math.hypot(pt.x - e.cx, pt.y - e.cy) - e.r);
          if (d < bestD) { bestD = d; best = i; }
        }
      });
      return best;
    }

    function pickNearest(pt) {
      const idx = nearestEntity(pt);
      if (idx < 0) {
        state.selectBox = { x0: state.mouse.x, y0: state.mouse.y, x1: state.mouse.x, y1: state.mouse.y };
        return;
      }
      if (state.selection.has(idx)) state.selection.delete(idx);
      else state.selection.add(idx);
      if (state.selection.size >= 1) state.tutorial.flags.selected = true;
      flash(state.selection.size + ' seleccionado(s)', true);
      draw();
      tutorialCheck();
    }

    function handleCommandLine(raw) {
      const text = raw.trim();
      if (!text) return;
      const up = text.toUpperCase();

      if (state.tool === 'CIRCLE' && state.pts.length === 1 && /^[-\d.]+$/.test(text)) {
        const r = parseFloat(text);
        if (r > 0) {
          addEntity({ type: 'circle', cx: state.pts[0].x, cy: state.pts[0].y, r: r });
          state.pts = [];
          flash('Círculo R=' + fmt(r), true);
        }
        input.value = '';
        return;
      }
      if (state.tool === 'OFFSET' && /^[-\d.]+$/.test(text)) {
        state.offsetDist = Math.abs(parseFloat(text)) || 10;
        flash('Distancia OFFSET = ' + state.offsetDist, true);
        input.value = '';
        return;
      }
      if (state.tool === 'RECTANG' && state.pts.length === 1) {
        const m = text.match(/^@\s*([-\d.]+)\s*,\s*([-\d.]+)\s*$/);
        if (m) {
          const a = state.pts[0];
          const w = parseFloat(m[1]), h = parseFloat(m[2]);
          addEntity({ type: 'rect', x: Math.min(a.x, a.x + w), y: Math.min(a.y, a.y + h), w: Math.abs(w), h: Math.abs(h) });
          state.pts = [];
          flash('Rectángulo ' + fmt(Math.abs(w)) + '×' + fmt(Math.abs(h)), true);
          input.value = '';
          return;
        }
      }

      if (['LINE', 'PLINE', 'RECTANG', 'CIRCLE', 'MOVE', 'COPY', 'ZOOM'].indexOf(state.tool) >= 0) {
        if ((up === 'C' || up === 'CLOSE') && (state.tool === 'LINE' || state.tool === 'PLINE') && state.pts.length >= 2) {
          addEntity({
            type: 'line',
            x1: state.pts[state.pts.length - 1].x, y1: state.pts[state.pts.length - 1].y,
            x2: state.pts[0].x, y2: state.pts[0].y
          });
          state.pts = [];
          state.tutorial.flags.closed = true;
          if (state.tool === 'PLINE') state.tutorial.flags.plineDrawn = true;
          flash('Cerrado', true);
          input.value = '';
          tutorialCheck();
          return;
        }
        if (up === 'U') {
          if (state.pts.length) state.pts.pop();
          else doUndo();
          input.value = '';
          draw();
          return;
        }
        if (state.tool === 'ZOOM' && (up === 'E' || up === 'EXTENTS')) {
          zoomExtents();
          input.value = '';
          return;
        }
        if (state.tool === 'ZOOM' && (up === 'P' || up === 'PREVIOUS')) {
          zoomPrevious();
          input.value = '';
          return;
        }
        const pt = parseCoord(text);
        if (pt) {
          placePoint(pt);
          input.value = '';
          return;
        }
      }

      const aliases = {
        L: 'LINE', LINE: 'LINE',
        REC: 'RECTANG', RECTANG: 'RECTANG', RECTANGLE: 'RECTANG',
        C: 'CIRCLE', CIRCLE: 'CIRCLE',
        PL: 'PLINE', PLINE: 'PLINE', POLYLINE: 'PLINE',
        M: 'MOVE', MOVE: 'MOVE',
        CO: 'COPY', COPY: 'COPY',
        O: 'OFFSET', OFFSET: 'OFFSET',
        DI: 'DIST', DIST: 'DIST',
        Z: 'ZOOM', ZOOM: 'ZOOM',
        P: 'PAN', PAN: 'PAN',
        E: 'ERASE', ERASE: 'ERASE',
        U: 'UNDO', UNDO: 'UNDO',
        REDO: 'REDO',
        UNITS: 'UNITS',
        CLR: 'CLEAR', CLEAR: 'CLEAR',
        GRID: 'GRID', SNAP: 'SNAP', ORTHO: 'ORTHO', POLAR: 'POLAR',
        DYN: 'DYNAMIC', DYNAMIC: 'DYNAMIC', OSNAP: 'OSNAP'
      };
      // Conflict: C alone during LINE means Close — handled above when tool is LINE
      if (up === 'C' && (state.tool === 'LINE' || state.tool === 'PLINE')) {
        // already handled
      }
      const cmd = aliases[up];
      if (cmd) {
        // Special: bare C starts CIRCLE only if not closing a line
        if (up === 'C' && (state.tool === 'LINE' || state.tool === 'PLINE') && state.pts.length >= 2) {
          input.value = '';
          return;
        }
        startTool(cmd);
        input.value = '';
        return;
      }
      flash('Comando no reconocido. Prueba: L REC C PL M CO O E Z P', false);
      input.value = '';
    }

    function zoomExtents() {
      pushView();
      if (!state.entities.length) {
        state.view = { x: 40, y: 25, scale: 3 };
        draw();
        flash('Extents (vacío)', true);
        return;
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      state.entities.forEach(e => {
        const b = entityBounds(e);
        minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
        maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
      });
      state.view.x = (minX + maxX) / 2;
      state.view.y = (minY + maxY) / 2;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const sx = w / Math.max(20, (maxX - minX) * 1.35);
      const sy = h / Math.max(20, (maxY - minY) * 1.35);
      state.view.scale = Math.max(0.2, Math.min(25, Math.min(sx, sy)));
      flash('Zoom Extents', true);
      state.tutorial.flags.zoomed = true;
      tutorialCheck();
      draw();
    }

    function pushView() {
      state.viewStack.push({ x: state.view.x, y: state.view.y, scale: state.view.scale });
      if (state.viewStack.length > 20) state.viewStack.shift();
    }

    function zoomPrevious() {
      if (!state.viewStack.length) { flash('No hay zoom anterior', false); return; }
      state.view = state.viewStack.pop();
      flash('Zoom Previous', true);
      draw();
    }

    function toggleMode(key) {
      const cmdMap = { grid: 'GRID', snap: 'SNAP', ortho: 'ORTHO', polar: 'POLAR', dyn: 'DYNAMIC', osnap: 'OSNAP' };
      const cmd = cmdMap[key];
      if (!isAllowed(cmd) && state.allowed !== 'DRAW' && state.allowed !== 'EXPLORE' && state.allowed !== 'LINE' && state.allowed !== 'COORDS') {
        // allow mode toggles freely on draw-focused slides
        if (!(state.allowed === 'GRID' || state.allowed === 'SNAP' || state.allowed === 'ORTHO' || state.allowed === 'POLAR' || state.allowed === 'DYNAMIC' || state.allowed === 'OSNAP')) {
          deny(cmd);
          return;
        }
      }
      state.modes[key] = !state.modes[key];
      syncModeButtons();
      flash((cmd || key) + (state.modes[key] ? ' ON' : ' OFF'), true);
      if (key === 'ortho' && state.modes.ortho) state.tutorial.flags.orthoOn = true;
      draw();
      tutorialCheck();
    }

    function toolsFor(focus) {
      const drawTools = ['LINE', 'RECTANG', 'CIRCLE', 'PLINE', 'MOVE', 'COPY', 'OFFSET', 'DIST', 'ERASE', 'UNDO', 'REDO', 'ZOOM', 'PAN', 'CLEAR'];
      if (state.tutorial.open) return drawTools;
      const map = {
        DRAW: drawTools,
        EXPLORE: drawTools,
        LINE: ['LINE', 'RECTANG', 'CIRCLE', 'PLINE', 'DIST', 'ORTHO', 'ERASE', 'UNDO', 'CLEAR'],
        RECTANG: ['RECTANG', 'LINE', 'ORTHO', 'DIST', 'ERASE', 'UNDO', 'CLEAR'],
        CIRCLE: ['CIRCLE', 'LINE', 'OSNAP', 'DIST', 'ERASE', 'UNDO', 'CLEAR'],
        PLINE: ['PLINE', 'LINE', 'ORTHO', 'ERASE', 'UNDO', 'CLEAR'],
        MOVE: ['MOVE', 'SELECT', 'UNDO', 'CLEAR'],
        COPY: ['COPY', 'SELECT', 'UNDO', 'CLEAR'],
        OFFSET: ['OFFSET', 'LINE', 'UNDO', 'CLEAR'],
        DIST: ['DIST', 'LINE', 'CLEAR'],
        COORDS: ['LINE', 'RECTANG', 'CIRCLE', 'DIST', 'UNDO', 'CLEAR'],
        ZOOM: ['ZOOM', 'PAN', 'CLEAR'],
        PAN: ['PAN', 'ZOOM', 'CLEAR'],
        UNITS: ['UNITS'],
        ERASE: ['ERASE', 'SELECT', 'UNDO', 'CLEAR'],
        UNDO: ['UNDO', 'LINE', 'RECTANG', 'CIRCLE', 'CLEAR'],
        REDO: ['REDO', 'UNDO', 'CLEAR'],
        GRID: ['GRID', 'LINE', 'RECTANG', 'CIRCLE', 'CLEAR'],
        SNAP: ['SNAP', 'LINE', 'RECTANG', 'CLEAR'],
        ORTHO: ['ORTHO', 'LINE', 'RECTANG', 'CLEAR'],
        POLAR: ['POLAR', 'LINE', 'CLEAR'],
        DYNAMIC: ['DYNAMIC', 'LINE', 'CIRCLE', 'CLEAR'],
        OSNAP: ['OSNAP', 'LINE', 'CIRCLE', 'RECTANG', 'CLEAR'],
        SELECT: ['SELECT', 'ERASE', 'MOVE', 'COPY', 'CLEAR'],
        FILES: ['FILES'],
        UI: ['LINE', 'RECTANG', 'CIRCLE', 'DIST', 'PAN', 'ZOOM', 'CLEAR']
      };
      return map[focus] || drawTools;
    }

    function modesFor(focus) {
      if (state.tutorial.open) return ['grid', 'snap', 'ortho', 'polar', 'dyn', 'osnap'];
      if (focus === 'UNITS' || focus === 'FILES') return [];
      if (focus === 'GRID') return ['grid'];
      if (focus === 'SNAP') return ['snap', 'grid'];
      if (focus === 'ORTHO') return ['ortho'];
      if (focus === 'POLAR') return ['polar'];
      if (focus === 'DYNAMIC') return ['dyn'];
      if (focus === 'OSNAP') return ['osnap'];
      if (focus === 'ZOOM' || focus === 'PAN') return [];
      return ['grid', 'snap', 'ortho', 'polar', 'dyn', 'osnap'];
    }

    const ribbonLabels = {
      LINE: 'L-LINE', RECTANG: 'REC-RECTANG', CIRCLE: 'C-CIRCLE', PLINE: 'PL-PLINE',
      MOVE: 'M-MOVE', COPY: 'CO-COPY', OFFSET: 'O-OFFSET', DIST: 'DI-DIST',
      ZOOM: 'Z-ZOOM', PAN: 'P-PAN', ERASE: 'E-ERASE',
      UNITS: 'UNITS', UNDO: 'U-UNDO', REDO: 'Y-REDO', CLEAR: 'CLR',
      SELECT: 'SEL', FILES: 'FILES',
      GRID: 'F7-GRID', SNAP: 'F9-SNAP', ORTHO: 'F8-ORTHO', POLAR: 'F10-POLAR',
      DYNAMIC: 'F12-DYN', OSNAP: 'F3-OSNAP'
    };

    function rebuildInterface() {
      const focus = state.allowed;
      root.setAttribute('data-focus', focus);
      const tools = toolsFor(focus);
      const modes = modesFor(focus);
      root.querySelector('.acad-ribbon').innerHTML = tools.map(cmd =>
        '<button type="button" data-cmd="' + cmd + '" class="hot" title="' + (CMD_LABELS[cmd] || cmd) + '">' + (ribbonLabels[cmd] || cmd) + '</button>'
      ).join('');
      const status = root.querySelector('.acad-statusbar');
      status.innerHTML = modes.map(m => {
        const label = m === 'dyn' ? 'DYN' : m.toUpperCase();
        return '<button type="button" data-mode="' + m + '" class="acad-mode' + (state.modes[m] ? ' on' : '') + '">' + label + '</button>';
      }).join('') +
        '<span class="acad-coords" id="acadObjCount">' + state.entities.length + ' obj</span>' +
        '<span class="acad-coords" id="acadCoords">0.00, 0.00</span>';

      root.querySelector('.acad-cmdline').style.display = (focus === 'FILES') ? 'none' : 'flex';
      const vpEl = root.querySelector('.acad-viewport');
      // '' restaura el CSS (flex item); 'block' rompía el encogimiento del lienzo
      vpEl.style.display = (focus === 'FILES' || focus === 'UNITS') ? 'none' : '';
      vpEl.style.flex = '';
      vpEl.style.minHeight = '';

      let panel = root.querySelector('.acad-focus-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'acad-focus-panel';
        root.insertBefore(panel, root.querySelector('.acad-cmdline'));
      }
      if (focus === 'UNITS') {
        panel.style.display = 'block';
        panel.innerHTML = '<p><strong>UNITS</strong></p><p>' + state.units.length + ' · prec ' + state.units.precision + ' · ' + state.units.insert + '</p><button type="button" data-cmd="UNITS" class="acad-panel-btn">Configurar</button>';
      } else if (focus === 'FILES') {
        panel.style.display = 'block';
        panel.innerHTML = '<p><strong>Archivos</strong></p><p>CTRL+N / O / S · ACADISO</p><button type="button" data-cmd="FILES" class="acad-panel-btn">Tip</button>';
      } else {
        panel.style.display = 'none';
        panel.innerHTML = '';
      }
    }

    function syncModeButtons() {
      root.querySelectorAll('.acad-mode').forEach(btn => {
        btn.classList.toggle('on', !!state.modes[btn.getAttribute('data-mode')]);
      });
    }

    function syncContext() {
      rebuildInterface();
      activeEl.textContent = (CMD_LABELS[state.allowed] || state.allowed);
      const hints = {
        DRAW: 'Esc cancela · Enter/clic-derecho confirma · F8 Ortho · Ctrl+Z deshace · DI mide',
        EXPLORE: 'Esc · Enter · Espacio · F3/F7/F8/F9/F10/F12 · Ctrl+Z/Y',
        LINE: 'Specify next point · Enter termina · C cierra · Dyn muestra L y ángulo',
        DIST: 'DIST: dos puntos → distancia, ΔX, ΔY y ángulo',
        RECTANG: 'RECTANG: dos esquinas o @ancho,alto',
        CIRCLE: 'CIRCLE: centro + radio (clic o número)',
        PLINE: 'PLINE: segmentos continuos · C cierra',
        MOVE: 'MOVE: selecciona · base · destino',
        COPY: 'COPY: selecciona · base · destino',
        OFFSET: 'OFFSET: escribe distancia · clic en línea · lado',
        COORDS: 'Usa L/REC/C con 0,0 · @50,0 · @30<90',
        ZOOM: 'Rueda · E Extents',
        PAN: 'Arrastra la vista',
        ERASE: 'Selecciona · Enter',
        UNITS: 'Configura unidades',
        UNDO: 'Deshacer',
        REDO: 'Rehacer',
        GRID: 'GRID + dibujo',
        SNAP: 'SNAP + dibujo',
        ORTHO: 'ORTHO + LINE/REC',
        POLAR: 'POLAR + LINE',
        DYNAMIC: 'DYN + dibujo',
        OSNAP: 'OSNAP + LINE/C/REC',
        SELECT: 'Window/Crossing',
        FILES: 'New/Open/Save',
        UI: 'Explora dibujando'
      };
      hintEl.textContent = hints[state.allowed] || 'Practica los comandos activos';
      syncModeButtons();

      if (['LINE', 'DRAW', 'EXPLORE', 'COORDS', 'ORTHO', 'GRID', 'SNAP', 'POLAR', 'DYNAMIC', 'OSNAP', 'UI'].indexOf(state.allowed) >= 0) startTool('LINE');
      else if (state.allowed === 'RECTANG') startTool('RECTANG');
      else if (state.allowed === 'CIRCLE') startTool('CIRCLE');
      else if (state.allowed === 'PLINE') startTool('PLINE');
      else if (state.allowed === 'DIST') startTool('DIST');
      else if (state.allowed === 'MOVE') startTool('MOVE');
      else if (state.allowed === 'COPY') startTool('COPY');
      else if (state.allowed === 'OFFSET') startTool('OFFSET');
      else if (state.allowed === 'ERASE' || state.allowed === 'SELECT') startTool(state.allowed);
      else if (state.allowed === 'PAN') startTool('PAN');
      else if (state.allowed === 'ZOOM') startTool('ZOOM');
      else { state.tool = null; updatePrompt(); }

      setTimeout(resize, 20);
      draw();
      updatePrompt();
      // Ofrecer guía contextual (no forzar si ya está abierta)
      const track = pickTrackForFocus(state.allowed);
      state.tutorial.track = track;
      if (!state.tutorial.open) {
        const baseHint = hints[state.allowed] || 'Practica los comandos activos';
        if (hintEl) {
          hintEl.innerHTML = baseHint + ' · <button type="button" data-tut="open" class="acad-hint-link">📚 Abrir guía</button>';
        }
      } else {
        rebuildInterface();
        renderTutorial();
      }
    }

    function applySelectBox(box) {
      const crossing = box.x1 < box.x0;
      const xA = Math.min(box.x0, box.x1), xB = Math.max(box.x0, box.x1);
      const yA = Math.min(box.y0, box.y1), yB = Math.max(box.y0, box.y1);
      state.selection.clear();
      state.entities.forEach((e, i) => {
        const pts = entitySnapPts(e).map(p => worldToScreen(p.x, p.y));
        const fully = pts.every(p => p.x >= xA && p.x <= xB && p.y >= yA && p.y <= yB);
        const overlap = pts.some(p => p.x >= xA && p.x <= xB && p.y >= yA && p.y <= yB);
        if (crossing ? overlap : fully) state.selection.add(i);
      });
      flash((crossing ? 'Crossing' : 'Window') + ': ' + state.selection.size, true);
    }

    function eraseSelection() {
      if (!isAllowed('ERASE') && state.tool !== 'ERASE') { deny('ERASE'); return; }
      if (!state.selection.size) { flash('Nada seleccionado', false); return; }
      pushUndo();
      state.entities = state.entities.filter((_, i) => !state.selection.has(i));
      state.selection.clear();
      flash('ERASE OK', true);
      state.tutorial.flags.erased = true;
      draw();
      tutorialCheck();
    }

    root.addEventListener('click', (e) => {
      const tutBtn = e.target.closest('[data-tut]');
      if (tutBtn && root.contains(tutBtn)) {
        const act = tutBtn.getAttribute('data-tut');
        if (act === 'open') openTutorial(pickTrackForFocus(state.allowed));
        else if (act === 'close') closeTutorial();
        else if (act === 'prev') tutorialPrev();
        else if (act === 'next') tutorialNext();
        else if (act === 'restart') openTutorial(state.tutorial.track);
        else if (act === 'do') tutorialDoStep();
        return;
      }
      const btn = e.target.closest('button[data-cmd]');
      if (btn && root.contains(btn)) { startTool(btn.getAttribute('data-cmd')); tutorialCheck(); return; }
      const modeBtn = e.target.closest('button[data-mode]');
      if (modeBtn && root.contains(modeBtn)) toggleMode(modeBtn.getAttribute('data-mode'));
    });

    root.addEventListener('mouseenter', () => { state.pointerInside = true; });
    root.addEventListener('mouseleave', () => { state.pointerInside = false; });
    root.addEventListener('mousedown', () => {
      state.pointerInside = true;
      if (document.activeElement !== input) {
        // Mantener foco útil para teclear coordenadas sin perder Esc/Enter globales
        try { input.focus({ preventScroll: true }); } catch (err) { input.focus(); }
      }
    });

    function isCapturingKeys() {
      return state.pointerInside ||
        !!state.tool ||
        state.pts.length > 0 ||
        !!state.moveBase ||
        state.selection.size > 0 ||
        document.activeElement === input;
    }

    /** ENTER / ESPACIO — como AutoCAD: confirma, termina o repite último comando */
    function pressEnter() {
      const typed = input.value.trim();
      if (typed) {
        handleCommandLine(typed);
        return;
      }

      if (state.tool === 'LINE' || state.tool === 'PLINE') {
        const ended = state.tool;
        state.pts = [];
        state.tool = null;
        flash(ended + ' terminado · Enter otra vez para repetir', true);
        updatePrompt();
        draw();
        return;
      }
      if (state.tool === 'RECTANG' || state.tool === 'CIRCLE') {
        if (state.pts.length) {
          state.pts = [];
          flash('Puntos parciales descartados · comando sigue activo', true);
          draw();
          return;
        }
        state.tool = null;
        flash((state.lastCmd || 'CMD') + ' terminado · Enter para repetir', true);
        return;
      }
      if (state.tool === 'ERASE') {
        eraseSelection();
        return;
      }
      if (state.tool === 'MOVE' || state.tool === 'COPY' || state.tool === 'OFFSET' || state.tool === 'SELECT') {
        if (state.moveBase) {
          state.moveBase = null;
          flash('Punto base cancelado · indica de nuevo', true);
          draw();
          return;
        }
        state.tool = null;
        flash('Comando terminado · Enter para repetir', true);
        return;
      }
      if (state.tool === 'ZOOM' || state.tool === 'PAN') {
        state.tool = null;
        flash('Vista · Enter repite último comando de dibujo', true);
        return;
      }

      // Sin comando activo: repetir el último (comportamiento AutoCAD)
      if (state.lastCmd && isAllowed(state.lastCmd)) {
        startTool(state.lastCmd);
        flash('Repite: ' + (CMD_LABELS[state.lastCmd] || state.lastCmd), true);
      } else if (isAllowed('LINE')) {
        startTool('LINE');
      }
    }

    /** ESC — cancela comando / selección, como AutoCAD */
    function pressEscape() {
      const hadWork = !!state.tool || state.pts.length > 0 || state.selection.size > 0 || !!state.moveBase || !!state.selectBox || state.distPts.length > 0;
      state.pts = [];
      state.distPts = [];
      state.moveBase = null;
      state.selectBox = null;
      state.tool = null;
      state.panning = false;
      state.panLast = null;
      if (state.selection.size) state.selection.clear();
      input.value = '';
      flash(hadWork ? '*Cancelado*' : 'Listo (Esc)', true);
      if (hadWork) {
        state.tutorial.flags.cancelled = true;
        tutorialCheck();
      }
      updatePrompt();
      draw();
      try { input.focus({ preventScroll: true }); } catch (err) { input.focus(); }
    }

    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        pressEnter();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        pressEscape();
      } else if (e.key === ' ' && !input.value) {
        // Espacio vacío = Enter (AutoCAD)
        e.preventDefault();
        pressEnter();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !input.value && state.selection.size) {
        e.preventDefault();
        eraseSelection();
      }
    });

    // Captura global Esc / Enter / Espacio / F-keys / Ctrl+Z mientras se usa el mini AutoCAD
    document.addEventListener('keydown', (e) => {
      if (!isCapturingKeys()) return;
      if (e.target && e.target.id === 'gotoInput') return;

      if (e.key === 'F3') { e.preventDefault(); e.stopPropagation(); toggleMode('osnap'); return; }
      if (e.key === 'F7') { e.preventDefault(); e.stopPropagation(); toggleMode('grid'); return; }
      if (e.key === 'F8') { e.preventDefault(); e.stopPropagation(); toggleMode('ortho'); return; }
      if (e.key === 'F9') { e.preventDefault(); e.stopPropagation(); toggleMode('snap'); return; }
      if (e.key === 'F10') { e.preventDefault(); e.stopPropagation(); toggleMode('polar'); return; }
      if (e.key === 'F12') { e.preventDefault(); e.stopPropagation(); toggleMode('dyn'); return; }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault(); e.stopPropagation(); doUndo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault(); e.stopPropagation(); doRedo(); return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        pressEscape();
        return;
      }
      if (e.key === 'Enter') {
        if (document.activeElement === input) return;
        e.preventDefault();
        e.stopPropagation();
        pressEnter();
        return;
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        if (document.activeElement === input && input.value) return;
        e.preventDefault();
        e.stopPropagation();
        pressEnter();
      }
    }, true);

    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      state.mouse.x = e.clientX - r.left;
      state.mouse.y = e.clientY - r.top;
      let wpt = screenToWorld(state.mouse.x, state.mouse.y);
      wpt = snapPoint(wpt.x, wpt.y);
      state.mouse.wx = wpt.x;
      state.mouse.wy = wpt.y;
      const live = root.querySelector('#acadCoords');
      if (live) live.textContent = fmt(wpt.x) + ', ' + fmt(wpt.y);
      if (state.panning && state.panLast) {
        state.view.x -= (e.clientX - state.panLast.x) / state.view.scale;
        state.view.y += (e.clientY - state.panLast.y) / state.view.scale;
        state.panLast = { x: e.clientX, y: e.clientY };
      }
      if (state.selectBox) {
        state.selectBox.x1 = state.mouse.x;
        state.selectBox.y1 = state.mouse.y;
      }
      draw();
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || state.tool === 'PAN' || (e.button === 0 && e.altKey)) {
        if (!isAllowed('PAN') && state.tool !== 'PAN' && e.button !== 1) { deny('PAN'); return; }
        state.panning = true;
        state.panLast = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;
      placePoint({ x: state.mouse.wx, y: state.mouse.wy });
    });

    window.addEventListener('mouseup', () => {
      if (state.selectBox) {
        applySelectBox(state.selectBox);
        state.selectBox = null;
        if (state.selection.size >= 1) {
          state.tutorial.flags.selected = true;
          tutorialCheck();
        }
        draw();
      }
      if (state.panning) {
        state.tutorial.flags.panned = true;
        tutorialCheck();
      }
      state.panning = false;
      state.panLast = null;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      pushView();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      state.view.scale = Math.max(0.15, Math.min(40, state.view.scale * factor));
      draw();
    }, { passive: false });

    // Clic derecho = Enter (como AutoCAD)
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      pressEnter();
    });

    function seedDemo() {
      state.entities = [
        { type: 'rect', x: 0, y: 0, w: 80, h: 50 },
        { type: 'circle', cx: 40, cy: 25, r: 12 },
        { type: 'line', x1: 0, y1: 0, x2: 80, y2: 50 }
      ];
      state.view = { x: 40, y: 25, scale: 3.2 };
      state.undoStack = [];
      state.redoStack = [];
      state.selection.clear();
    }

    function setContext(title) {
      // Al cambiar de diapositiva, cerrar guía para evitar estados inconsistentes
      if (state.tutorial.open) {
        state.tutorial.open = false;
        state.tutorial.advancing = false;
        root.classList.remove('tut-open');
        if (tutPanel) tutPanel.hidden = true;
      }
      state.allowed = resolveDemoCommand(title);
      state.title = title || '';
      state.pts = [];
      state.moveBase = null;
      state.tool = null;
      state.distPts = [];
      state.selectBox = null;
      state.panning = false;
      state.panLast = null;
      state.selection.clear();
      seedDemo();
      if (state.allowed === 'GRID') state.modes.grid = true;
      if (state.allowed === 'SNAP') { state.modes.snap = true; state.modes.grid = true; }
      if (state.allowed === 'ORTHO') state.modes.ortho = true;
      if (state.allowed === 'POLAR') state.modes.polar = true;
      if (state.allowed === 'DYNAMIC') state.modes.dyn = true;
      if (state.allowed === 'OSNAP') state.modes.osnap = true;
      try {
        syncContext();
        resize();
      } catch (err) {
        try { draw(); } catch (e2) { /* ignore */ }
      }
    }

    window.addEventListener('resize', resize);
    setTimeout(resize, 30);

    return { setContext, resize, resolveDemoCommand, root, isCapturingKeys, closeTutorial };
  }

  global.MiniAutoCAD = { create: createMiniCAD, resolveDemoCommand };
})(window);
