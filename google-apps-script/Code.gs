// ХАССП-Трекер — генератор КП в Google Docs
// Деплоится как Web App, выполняется от имени владельца скрипта (твоего аккаунта).
// Калькулятор (app.js) шлёт сюда POST с посчитанными цифрами, скрипт создаёт
// Google Doc в твоём Drive, открывает доступ по ссылке и возвращает URL.

var LOGO_BASE64 = "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";

var NAVY = "#0F3D5C";
var RED = "#E2231A";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var title = "КП ХАССП-Трекер — " + (data.company || "клиент") + " — " + Utilities.formatDate(new Date(), "GMT+3", "dd.MM.yyyy");
    var doc = DocumentApp.create(title);
    var body = doc.getBody();
    body.clear();
    body.setMarginTop(36).setMarginBottom(36).setMarginLeft(50).setMarginRight(50);

    // ---- логотип ----
    var imgBlob = Utilities.newBlob(Utilities.base64Decode(LOGO_BASE64), "image/png", "logo.png");
    var img = body.appendImage(imgBlob);
    img.setWidth(150);
    img.setHeight(67);

    // ---- заголовки ----
    var titlePar = body.appendParagraph("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ");
    titlePar.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    titlePar.editAsText().setBold(true).setFontSize(16).setForegroundColor(RED);

    var subtitlePar = body.appendParagraph(
      "ХАССП-ТРЕКЕР — ЦИФРОВАЯ ПЛАТФОРМА ДЛЯ МОНИТОРИНГА СОБЛЮДЕНИЯ САНИТАРНЫХ НОРМ И ФИКСАЦИИ НАРУШЕНИЙ"
    );
    subtitlePar.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    subtitlePar.editAsText().setBold(true).setFontSize(11).setForegroundColor(NAVY);

    body.appendParagraph("");

    var pointsPar = body.appendParagraph("Индивидуальный расчёт. " + data.pointsLabel + ".");
    pointsPar.editAsText().setBold(true).setFontSize(13);

    if (data.company) {
      var compPar = body.appendParagraph("Для: " + data.company);
      compPar.editAsText().setItalic(true);
    }
    body.appendParagraph("");

    // ---- модули (таблица с навy-рамкой на каждый) ----
    data.modules.forEach(function (mod) {
      var modTitle = body.appendParagraph(mod.label);
      modTitle.editAsText().setBold(true).setFontSize(12).setForegroundColor(NAVY);

      var headerRow = ["Срок"].concat(mod.pointHeaders);
      var tableData = [headerRow].concat(
        mod.rows.map(function (r) {
          return [r.months].concat(r.cells);
        })
      );
      var table = body.appendTable(tableData);
      table.setBorderColor(NAVY);
      table.setBorderWidth(1.5);

      for (var row = 0; row < table.getNumRows(); row++) {
        var tr = table.getRow(row);
        for (var col = 0; col < tr.getNumCells(); col++) {
          var cell = tr.getCell(col);
          cell.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(6).setPaddingRight(6);
          var cellText = cell.editAsText();
          if (row === 0) {
            cell.setBackgroundColor(NAVY);
            cellText.setForegroundColor("#FFFFFF").setBold(true);
          }
          cell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        }
      }
      body.appendParagraph("");
    });

    // ---- бонусы (боксы через 1-ячеечные таблицы с навy-рамкой) ----
    var bonusHeading = body.appendParagraph("ДОПОЛНИТЕЛЬНЫЕ БОНУСЫ И ВЫГОДЫ");
    bonusHeading.editAsText().setBold(true).setFontSize(12).setForegroundColor(NAVY);
    body.appendParagraph("");

    function appendBox(lines) {
      var box = body.appendTable([[""]]);
      box.setBorderColor(NAVY);
      box.setBorderWidth(1.5);
      var cell = box.getRow(0).getCell(0);
      cell.setPaddingTop(8).setPaddingBottom(8).setPaddingLeft(10).setPaddingRight(10);
      cell.getChild(0).asParagraph().removeFromParent();
      lines.forEach(function (line) {
        var p = cell.appendParagraph("");
        var titleRun = p.appendText(line.title + " ");
        titleRun.setBold(true).setForegroundColor(NAVY);
        p.appendText(line.text);
      });
      body.appendParagraph("");
    }

    appendBox([
      {
        title: "1. СТОИМОСТЬ МОДУЛЕЙ.",
        text: "Цена зафиксирована на 18 месяцев с момента подписания договора при условии оплаты в течение 30 дней после завершения тестирования.",
      },
      {
        title: "2. СОПРОВОЖДЕНИЕ.",
        text: "Техническая поддержка на всех этапах масштабирования. Обучение ключевых сотрудников и администраторов сети в формате онлайн-демонстрации + видеоинструкции для линейного персонала. В процессе тестирования обсудим и адаптируем функционал сервиса под особенности вашей сети.",
      },
    ]);

    appendBox([
      {
        title: "3. НАШ ОПЫТ И ФОРМАТ СОТРУДНИЧЕСТВА.",
        text: "16 лет опыта в пищевом производстве, санитарных нормах и проверках. Команда ХАССП-АУДИТ — эксперты, которые помогли сотням заведений внедрить ХАССП, избежать штрафов и пройти проверки с первого раза. Поможем, проконсультируем, расскажем. Собственная разработка и IT-платформа — учитываем ваши пожелания.",
      },
    ]);

    // ---- подпись ----
    body.appendParagraph("Менеджер ХАССП-ТРЕКЕР,");
    var namePar = body.appendParagraph(data.managerName || "Менеджер ХАССП-ТРЕКЕР");
    namePar.editAsText().setBold(true);
    body.appendParagraph("");

    var readyPar = body.appendParagraph("Готовы ответить на все ваши вопросы:");
    readyPar.editAsText().setBold(true).setItalic(true).setForegroundColor(NAVY);

    var contactPar = body.appendParagraph(
      "Telegram, MAX " + (data.managerPhone || "+7 925 710 0944") + ". Эл.почта — sales@haccp-tracker.ru"
    );
    contactPar.editAsText().setBold(true);
    body.appendParagraph("");

    var ctaPar = body.appendParagraph("БУДЕМ РАДЫ ВИДЕТЬ ВАС В ЧИСЛЕ НАШИХ КЛИЕНТОВ!");
    ctaPar.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    ctaPar.editAsText().setBold(true).setFontSize(13).setForegroundColor(RED);

    doc.saveAndClose();

    var file = DriveApp.getFileById(doc.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, url: doc.getUrl() })).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(
      ContentService.MimeType.JSON
    );
  }
}
