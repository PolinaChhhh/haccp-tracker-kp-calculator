// Калькулятор индивидуального расчёта ХАССП-Трекер
// Формула (из тарифной сетки): цена = база(модуль) × месяцы × коэф_срока × коэф_точек

const BASE = {
  ej: { key: "ej", label: "МОДУЛЬ «ЭЛЕКТРОННЫЕ ЖУРНАЛЫ»", price: 3000 },
  cl: { key: "cl", label: "МОДУЛЬ «ЧЕК-ЛИСТЫ КОНТРОЛЯ»", price: 2450 },
  complex: {
    key: "complex",
    label: "ЭКОСИСТЕМА «КОМПЛЕКС» — полный контроль: журналы + индивидуальные чек-листы для любых процессов",
    // база подобрана так, чтобы 1 точка / 12 мес (коэф. срока 0.6) давала реальную цену — 41 568 ₽/год
    price: 41568 / (0.6 * 12),
  },
};

const SROK_COEF = { 1: 1, 3: 0.8, 6: 0.7, 12: 0.6 };
const DURATIONS = [1, 3, 6, 12];

// границы пересекаются в исходной таблице (2–5 и 5–10, 10+ и 50+) —
// разрешаем через убывающие пороги: чем больше точек, тем ниже коэффициент.
// если реальная граница отличается (напр. 5 точек должно попадать в 0.85, а не 0.8) — поправить здесь.
function tochkiCoef(n) {
  if (n >= 50) return 0.6;
  if (n >= 10) return 0.7;
  if (n >= 5) return 0.8;
  if (n >= 2) return 0.85;
  return 1;
}

function calcCell(basePrice, months, points) {
  const perMonthPerPoint = basePrice * SROK_COEF[months] * tochkiCoef(points);
  const total = Math.round(perMonthPerPoint * months * points);
  const perMonth = Math.round(perMonthPerPoint);
  return { total, perMonth };
}

function fmt(n) {
  return n.toLocaleString("ru-RU");
}

function pointsWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "точек";
  if (mod10 === 1) return "точка";
  if (mod10 >= 2 && mod10 <= 4) return "точки";
  return "точек";
}

// ---------- состояние ----------

let pointColumns = [1]; // текущий набор колонок "точки" для расчёта

function renderPointChips() {
  const box = document.getElementById("pointChips");
  box.innerHTML = "";
  pointColumns.forEach((n, idx) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${n} ${pointsWord(n)}`;
    const rm = document.createElement("button");
    rm.textContent = "×";
    rm.type = "button";
    rm.className = "chip-remove";
    rm.onclick = () => {
      pointColumns.splice(idx, 1);
      renderPointChips();
    };
    chip.appendChild(rm);
    box.appendChild(chip);
  });
}

function addPreset(n) {
  if (!pointColumns.includes(n)) {
    pointColumns.push(n);
    pointColumns.sort((a, b) => a - b);
    renderPointChips();
  }
}

function addCustomPoint() {
  const input = document.getElementById("customPoints");
  const n = parseInt(input.value, 10);
  if (Number.isFinite(n) && n > 0 && !pointColumns.includes(n)) {
    pointColumns.push(n);
    pointColumns.sort((a, b) => a - b);
    renderPointChips();
  }
  input.value = "";
}

function selectedModules() {
  return Object.keys(BASE).filter((k) => document.getElementById("mod_" + k).checked);
}

function buildRows(basePrice) {
  return DURATIONS.map((months) => {
    const cells = pointColumns.map((points) => calcCell(basePrice, months, points));
    return { months, cells };
  });
}

// ---------- превью на странице ----------

function renderPreview() {
  const modules = selectedModules();
  const container = document.getElementById("preview");
  container.innerHTML = "";

  if (modules.length === 0 || pointColumns.length === 0) {
    container.innerHTML = '<p class="hint">выберите хотя бы один модуль и хотя бы одно значение точек</p>';
    return;
  }

  modules.forEach((key) => {
    const mod = BASE[key];
    const rows = buildRows(mod.price);

    const box = document.createElement("div");
    box.className = "module-box";

    const h = document.createElement("h3");
    h.textContent = mod.label;
    box.appendChild(h);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.innerHTML =
      "<th>Срок</th>" + pointColumns.map((p) => `<th>${p} ${pointsWord(p)}</th>`).join("");
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${row.months} мес.</td>` +
        row.cells.map((c) => `<td>${fmt(c.total)} ₽<br><span class="sub">(${fmt(c.perMonth)} ₽/мес)</span></td>`).join("");
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.appendChild(table);
    container.appendChild(box);
  });
}

// ---------- генерация .docx ----------

async function downloadDocx() {
  const modules = selectedModules();
  if (modules.length === 0 || pointColumns.length === 0) {
    alert("выберите хотя бы один модуль и хотя бы одно значение точек");
    return;
  }

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, ShadingType, ImageRun,
  } = docx;

  const NAVY = "0F3D5C";
  const RED = "E2231A";
  const LIGHTGRAY = "CCCCCC";

  const company = document.getElementById("company").value.trim();
  const managerName = document.getElementById("managerName").value.trim() || "Менеджер ХАССП-ТРЕКЕР";
  const managerPhone = document.getElementById("managerPhone").value.trim() || "+7 925 710 0944";

  function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  const children = [];

  // ---- шапка: логотип + заголовки в фирменных цветах ----
  children.push(
    new Paragraph({
      children: [
        new ImageRun({
          type: "png",
          data: base64ToUint8Array(LOGO_BASE64),
          transformation: { width: 150, height: 67 },
        }),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", bold: true, size: 28, color: RED })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "ХАССП-ТРЕКЕР — ЦИФРОВАЯ ПЛАТФОРМА ДЛЯ МОНИТОРИНГА СОБЛЮДЕНИЯ САНИТАРНЫХ НОРМ И ФИКСАЦИИ НАРУШЕНИЙ",
          bold: true,
          size: 20,
          color: NAVY,
        }),
      ],
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 4 } },
      children: [new TextRun({ text: "" })],
    }),
    new Paragraph({ text: "" })
  );

  const pointsLabel = pointColumns.map((p) => `${p} ${pointsWord(p)}`).join(", ");
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Индивидуальный расчёт. ${pointsLabel}.`, bold: true, size: 24 })],
    })
  );
  if (company) {
    children.push(new Paragraph({ children: [new TextRun({ text: `Для: ${company}`, italics: true })] }));
  }
  children.push(new Paragraph({ text: "" }));

  const cellBorder = { style: BorderStyle.SINGLE, size: 2, color: LIGHTGRAY };
  const priceBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  // ширины считаем в twips (1440 = 1 дюйм), явно — иначе конвертеры (в т.ч. Google Docs)
  // сжимают таблицу по содержимому вместо растягивания на всю страницу
  const OUTER_WIDTH = 9350;
  const INNER_WIDTH = 9000;
  const FIRST_COL_WIDTH = 1600;
  const dataColWidth = Math.floor((INNER_WIDTH - FIRST_COL_WIDTH) / pointColumns.length);
  const priceColumnWidths = [FIRST_COL_WIDTH, ...pointColumns.map(() => dataColWidth)];

  function headerCell(text, width) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: priceBorders,
      shading: { type: ShadingType.CLEAR, fill: NAVY },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: "FFFFFF" })] })],
    });
  }
  function bodyCell(text, width, center) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: priceBorders,
      children: [new Paragraph({ alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text })] })],
    });
  }

  // рамка-бокс (как в фирменном КП) — таблица 1x1 с толстой навy-рамкой и внутренними отступами
  function boxWrap(innerChildren) {
    return new Table({
      width: { size: OUTER_WIDTH, type: WidthType.DXA },
      columnWidths: [OUTER_WIDTH],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: OUTER_WIDTH, type: WidthType.DXA },
              margins: { top: 150, bottom: 150, left: 150, right: 150 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 8, color: NAVY },
                bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY },
                left: { style: BorderStyle.SINGLE, size: 8, color: NAVY },
                right: { style: BorderStyle.SINGLE, size: 8, color: NAVY },
              },
              children: innerChildren,
            }),
          ],
        }),
      ],
    });
  }

  modules.forEach((key) => {
    const mod = BASE[key];
    const rows = buildRows(mod.price);

    const headerRow = new TableRow({
      children: [
        headerCell("Срок", FIRST_COL_WIDTH),
        ...pointColumns.map((p) => headerCell(`${p} ${pointsWord(p)}`, dataColWidth)),
      ],
    });
    const bodyRows = rows.map(
      (row) =>
        new TableRow({
          children: [
            bodyCell(`${row.months} мес.`, FIRST_COL_WIDTH, true),
            ...row.cells.map((c) => bodyCell(`${fmt(c.total)} ₽ (${fmt(c.perMonth)} ₽/мес)`, dataColWidth, true)),
          ],
        })
    );

    children.push(
      boxWrap([
        new Paragraph({ children: [new TextRun({ text: mod.label, bold: true, size: 22, color: NAVY })] }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: INNER_WIDTH, type: WidthType.DXA },
          columnWidths: priceColumnWidths,
          rows: [headerRow, ...bodyRows],
        }),
      ])
    );
    children.push(new Paragraph({ text: "" }));
  });

  function bonusLine(title, text) {
    return new Paragraph({
      children: [new TextRun({ text: title + " ", bold: true, color: NAVY }), new TextRun({ text })],
    });
  }

  children.push(
    new Paragraph({ children: [new TextRun({ text: "ДОПОЛНИТЕЛЬНЫЕ БОНУСЫ И ВЫГОДЫ", bold: true, size: 22, color: NAVY })] }),
    new Paragraph({ text: "" }),
    boxWrap([
      bonusLine(
        "1. СТОИМОСТЬ МОДУЛЕЙ.",
        "Цена зафиксирована на 18 месяцев с момента подписания договора при условии оплаты в течение 30 дней после завершения тестирования."
      ),
      new Paragraph({ text: "" }),
      bonusLine(
        "2. СОПРОВОЖДЕНИЕ.",
        "Техническая поддержка на всех этапах масштабирования. Обучение ключевых сотрудников и администраторов сети в формате онлайн-демонстрации + видеоинструкции для линейного персонала. В процессе тестирования обсудим и адаптируем функционал сервиса под особенности вашей сети."
      ),
    ]),
    new Paragraph({ text: "" }),
    boxWrap([
      bonusLine(
        "3. НАШ ОПЫТ И ФОРМАТ СОТРУДНИЧЕСТВА.",
        "16 лет опыта в пищевом производстве, санитарных нормах и проверках. Команда ХАССП-АУДИТ — эксперты, которые помогли сотням заведений внедрить ХАССП, избежать штрафов и пройти проверки с первого раза. Поможем, проконсультируем, расскажем. Собственная разработка и IT-платформа — учитываем ваши пожелания."
      ),
    ]),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Менеджер ХАССП-ТРЕКЕР," })] }),
    new Paragraph({ children: [new TextRun({ text: managerName, bold: true })] }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Готовы ответить на все ваши вопросы:", bold: true, italics: true, color: NAVY })] }),
    new Paragraph({ children: [new TextRun({ text: `Telegram, MAX ${managerPhone}. Эл.почта — sales@haccp-tracker.ru`, bold: true })] }),
    new Paragraph({ text: "" }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "БУДЕМ РАДЫ ВИДЕТЬ ВАС В ЧИСЛЕ НАШИХ КЛИЕНТОВ!", bold: true, size: 24, color: RED })],
    })
  );

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);

  const date = new Date().toISOString().slice(0, 10);
  const namePart = company ? company.replace(/[^\wа-яА-ЯёЁ0-9-]+/g, "_") : "клиент";
  const filename = `KP_raschet_${namePart}_${date}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- init ----------

window.addEventListener("DOMContentLoaded", () => {
  renderPointChips();
  renderPreview();

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => addPreset(parseInt(btn.dataset.points, 10)));
  });
  document.getElementById("addCustomBtn").addEventListener("click", addCustomPoint);
  document.getElementById("customPoints").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addCustomPoint();
  });
  document.querySelectorAll('input[id^="mod_"]').forEach((el) => el.addEventListener("change", renderPreview));
  document.getElementById("downloadBtn").addEventListener("click", downloadDocx);

  const observer = new MutationObserver(renderPreview);
  observer.observe(document.getElementById("pointChips"), { childList: true });
});
