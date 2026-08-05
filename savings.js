// Калькулятор экономии — сколько клиент теряет на бумажных журналах
// Формула (из внутренней таблицы): затраты в год = (оклад/раб.часов в месяц) × часов в день ×
//   сотрудников × раб.дней в год × точек + прямые затраты на материалы

function fmtS(n) {
  return Math.round(n).toLocaleString("ru-RU");
}

// фиксированные параметры формулы — не вводятся руками на демонстрации
const S_WORKHOURS = 160; // рабочих часов в месяц
const S_WORKDAYS = 320; // рабочих дней в год
const S_DIRECT = 7000; // прямые затраты на бумагу и материалы, ₽/год

function sGetInputs() {
  return {
    points: parseFloat(document.getElementById("s_points").value) || 0,
    employees: parseFloat(document.getElementById("s_employees").value) || 0,
    hours: parseFloat(document.getElementById("s_hours").value) || 0,
    salary: parseFloat(document.getElementById("s_salary").value) || 0,
    workhours: S_WORKHOURS,
    workdays: S_WORKDAYS,
    direct: S_DIRECT,
  };
}

function sCalc(v) {
  const hourlyRate = v.salary / v.workhours;
  const laborCost = hourlyRate * v.hours * v.employees * v.workdays * v.points;
  const total = laborCost + v.direct;
  return { hourlyRate, laborCost, total };
}

function sRenderPreview() {
  const v = sGetInputs();
  const r = sCalc(v);
  document.getElementById("s_out_workhours").textContent = fmtS(v.workhours);
  document.getElementById("s_out_rate").textContent = fmtS(r.hourlyRate) + " ₽";
  document.getElementById("s_out_days").textContent = fmtS(v.workdays);
  document.getElementById("s_out_direct").textContent = fmtS(v.direct) + " ₽";
  document.getElementById("s_out_total").textContent = fmtS(r.total) + " ₽";
}

async function sDownloadDocx() {
  const v = sGetInputs();
  const r = sCalc(v);

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, ImageRun,
  } = docx;

  const NAVY = "0F3D5C";
  const RED = "E2231A";

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
      children: [new TextRun({ text: "СКОЛЬКО ВЫ ТЕРЯЕТЕ НА БУМАЖНЫХ ЖУРНАЛАХ", bold: true, size: 28, color: RED })],
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
    ["Оклад", fmtS(v.salary) + " ₽"],
    ["Кол-во рабочих часов в месяц", fmtS(v.workhours)],
    ["Ставка в час", fmtS(r.hourlyRate) + " ₽"],
    ["Кол-во рабочих дней в год", fmtS(v.workdays)],
    ["прямые затраты на материальное обеспечение бумажного документооборота", fmtS(v.direct) + " ₽"],
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
    boxWrap(benefitLine("Затраты в год", fmtS(r.total) + " ₽", true).slice(0, -1))
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
  document.getElementById("s_downloadBtn").addEventListener("click", sDownloadDocx);
});
