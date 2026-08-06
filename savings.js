// Калькулятор экономии — сколько клиент теряет на бумажных журналах
// Формула (из внутренней таблицы): затраты в год = (оклад/раб.часов в месяц) × часов в день ×
//   сотрудников × раб.дней в год × точек + прямые затраты на материалы

function fmtS(n) {
  return Math.round(n).toLocaleString("ru-RU");
}
function rubS(n) {
  return fmtS(n) + " ₽";
}

// фиксированные параметры формулы — не вводятся руками на демонстрации
const S_WORKHOURS = 160; // рабочих часов в месяц
const S_WORKDAYS = 320; // рабочих дней в год
const S_DIRECT = 7000; // прямые затраты на бумагу и материалы, ₽/год на точку

const S_DEFAULTS = { points: 1, employees: 1, hours: 2, salary: 40000 };

function sGetInputs() {
  return {
    points: Math.max(1, parseFloat(document.getElementById("s_points").value) || 0),
    employees: Math.max(1, parseFloat(document.getElementById("s_employees").value) || 0),
    hours: parseFloat(document.getElementById("s_hours").value) || 0,
    salary: parseFloat(document.getElementById("s_salary").value) || 0,
    workhours: S_WORKHOURS,
    workdays: S_WORKDAYS,
    direct: S_DIRECT,
  };
}

function sCalc(v) {
  const hourlyRate = v.salary / v.workhours;
  const hoursYear = v.hours * v.workdays * v.employees * v.points;
  const timeCost = hoursYear * hourlyRate;
  const paperCost = v.direct * v.points;
  const total = timeCost + paperCost;
  return { hourlyRate, hoursYear, timeCost, paperCost, total };
}

function sRenderPreview() {
  const v = sGetInputs();
  const r = sCalc(v);

  document.getElementById("s_out_workhours").textContent = fmtS(v.workhours);
  document.getElementById("s_out_days").textContent = fmtS(v.workdays);
  document.getElementById("s_out_direct").textContent = rubS(v.direct);

  document.getElementById("s_out_rate").textContent = rubS(r.hourlyRate);
  document.getElementById("s_out_hours_year").textContent = fmtS(r.hoursYear) + " ч";
  document.getElementById("s_out_time").textContent = rubS(r.timeCost);
  document.getElementById("s_out_paper").textContent = rubS(r.paperCost);
  document.getElementById("s_out_sum").textContent = rubS(r.total);

  document.getElementById("s_out_total").textContent = rubS(r.total);
  document.getElementById("s_hero_sub").textContent =
    "в год" + (v.points > 1 ? " на сети из " + v.points + " точек" : "") +
    ". Это время сотрудников на заполнение журналов плюс прямые расходы на бумагу и печать.";
}

function sReset() {
  document.getElementById("s_points").value = S_DEFAULTS.points;
  document.getElementById("s_employees").value = S_DEFAULTS.employees;
  document.getElementById("s_hours").value = S_DEFAULTS.hours;
  document.getElementById("s_salary").value = S_DEFAULTS.salary;
  sRenderPreview();
}

async function sDownloadDocx() {
  const v = sGetInputs();
  const r = sCalc(v);

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, ImageRun,
  } = docx;

  const NAVY = "1E3A5F";
  const RED = "8B1C2A";

  function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  const managerName = "Менеджер ХАССП-ТРЕКЕР";
  const managerPhone = "+7 925 710 0944";

  const children = [];

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
      children: [new TextRun({ text: "СКОЛЬКО СТОИТ БУМАЖНЫЙ ХАССП ИМЕННО У ВАС", bold: true, size: 28, color: RED })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Расчёт подготовлен ХАССП-ТРЕКЕР — цифровой платформой для мониторинга соблюдения санитарных норм",
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

  const cellBorder = { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  function labelCell(text) {
    return new TableCell({
      width: { size: 6500, type: WidthType.DXA },
      borders,
      children: [new Paragraph({ children: [new TextRun({ text })] })],
    });
  }
  function valCell(text) {
    return new TableCell({
      width: { size: 2500, type: WidthType.DXA },
      borders,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true })] })],
    });
  }

  const rows = [
    ["Количество точек", String(v.points)],
    ["Количество сотрудников", String(v.employees)],
    ["Часов в день на ведение журналов", String(v.hours)],
    ["Оклад", rubS(v.salary)],
    ["Кол-во рабочих часов в месяц", fmtS(v.workhours)],
    ["Ставка в час", rubS(r.hourlyRate)],
    ["Кол-во рабочих дней в год", fmtS(v.workdays)],
    ["Часов на журналы в год", fmtS(r.hoursYear) + " ч"],
    ["Стоимость времени", rubS(r.timeCost)],
    ["прямые затраты на материальное обеспечение бумажного документооборота", rubS(r.paperCost)],
  ];

  children.push(
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: [6500, 2500],
      rows: rows.map((r2) => new TableRow({ children: [labelCell(r2[0]), valCell(r2[1])] })),
    }),
    new Paragraph({ text: "" })
  );

  function boxWrap(innerChildren) {
    return new Table({
      width: { size: 9350, type: WidthType.DXA },
      columnWidths: [9350],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 9350, type: WidthType.DXA },
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
              shading: { fill: NAVY },
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

  function benefitLine(label, value, big) {
    return [
      new Paragraph({ children: [new TextRun({ text: label, color: "FFFFFF", size: 20 })] }),
      new Paragraph({
        children: [new TextRun({ text: value, color: big ? RED : "FFFFFF", bold: true, size: big ? 40 : 28 })],
      }),
      new Paragraph({ text: "" }),
    ];
  }

  children.push(
    boxWrap(benefitLine("Затраты в год", rubS(r.total), true).slice(0, -1))
  );

  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Менеджер ХАССП-ТРЕКЕР," })] }),
    new Paragraph({ children: [new TextRun({ text: managerName, bold: true })] }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "Готовы ответить на все ваши вопросы:", bold: true, italics: true, color: NAVY })] }),
    new Paragraph({ children: [new TextRun({ text: `Telegram, MAX ${managerPhone}. Эл.почта — sales@haccp-tracker.ru`, bold: true })] }),
    new Paragraph({ text: "" }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "ХАССП-ТРЕКЕР ПОМОЖЕТ ВЕРНУТЬ ЭТИ ДЕНЬГИ И ВРЕМЯ СЕБЕ!", bold: true, size: 24, color: RED })],
    })
  );

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);

  const date = new Date().toISOString().slice(0, 10);
  const filename = `Raschet_ekonomii_klient_${date}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.addEventListener("DOMContentLoaded", () => {
  sRenderPreview();
  document
    .querySelectorAll("#tab-savings input")
    .forEach((el) => el.addEventListener("input", sRenderPreview));
  document.getElementById("s_resetBtn").addEventListener("click", sReset);
  document.getElementById("s_downloadBtn").addEventListener("click", sDownloadDocx);
});
