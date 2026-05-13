import { detectHiddenKey } from "@/lib/normalize";
import { htmlEscape } from "@/lib/htmlEscape";
import type { GoogleFormField, GoogleFormSchema } from "@/types/googleForm";

function fieldHtml(field: GoogleFormField): string {
  const safeLabel = htmlEscape(field.label);
  const req = field.required ? ' <span class="gfs-required">*</span>' : "";
  const hiddenKey = detectHiddenKey(field.label);

  if (hiddenKey) {
    return `<input type="hidden" name="entry.${field.entryId}" data-gfs-hidden-key="${hiddenKey}">`;
  }

  switch (field.type) {
    case "short_text":
      return `<div class="gfs-field" data-field="${field.id}">\n  <label class="gfs-label">${safeLabel}${req}</label>\n  <input class="gfs-input" type="text" name="entry.${field.entryId}" ${field.required ? "required" : ""}>\n</div>`;
    case "paragraph":
      return `<div class="gfs-field" data-field="${field.id}">\n  <label class="gfs-label">${safeLabel}${req}</label>\n  <textarea class="gfs-textarea" name="entry.${field.entryId}" ${field.required ? "required" : ""}></textarea>\n</div>`;
    case "dropdown":
      return `<div class="gfs-field" data-field="${field.id}">\n  <label class="gfs-label">${safeLabel}${req}</label>\n  <select class="gfs-select" name="entry.${field.entryId}" ${field.required ? "required" : ""}>\n    <option value="">Chọn...</option>\n    ${(field.options ?? []).map((o) => `<option value="${htmlEscape(o)}">${htmlEscape(o)}</option>`).join("\\n    ")}\n  </select>\n</div>`;
    case "multiple_choice":
    case "linear_scale":
      return `<div class="gfs-field" data-field="${field.id}">\n  <label class="gfs-label">${safeLabel}${req}</label>\n  <div class="gfs-radio-group">\n    ${(field.options ?? []).map((o) => `<label class="gfs-option"><input type="radio" name="entry.${field.entryId}" value="${htmlEscape(o)}" ${field.required ? "required" : ""}> <span>${htmlEscape(o)}</span></label>`).join("\\n    ")}\n  </div>\n</div>`;
    case "checkboxes":
      return `<div class="gfs-field" data-field="${field.id}">\n  <label class="gfs-label">${safeLabel}${req}</label>\n  <div class="gfs-checkbox-group">\n    ${(field.options ?? []).map((o) => `<label class="gfs-option"><input type="checkbox" name="entry.${field.entryId}" value="${htmlEscape(o)}"> <span>${htmlEscape(o)}</span></label>`).join("\\n    ")}\n  </div>\n</div>`;
    case "date":
      return `<div class="gfs-field" data-field="${field.id}">\n  <label class="gfs-label">${safeLabel}${req}</label>\n  <input class="gfs-input" type="date" name="entry.${field.entryId}" ${field.required ? "required" : ""}>\n</div>`;
    case "time":
      return `<div class="gfs-field" data-field="${field.id}">\n  <label class="gfs-label">${safeLabel}${req}</label>\n  <input class="gfs-input" type="time" name="entry.${field.entryId}" ${field.required ? "required" : ""}>\n</div>`;
    default:
      return "";
  }
}

export function generateHtml(schema: GoogleFormSchema): string {
  const renderedFields = schema.fields
    .filter((field) => field.type !== "unsupported" && field.type !== "unknown")
    .map(fieldHtml)
    .filter(Boolean)
    .join("\n");

  return `<iframe name="gfs_hidden_iframe" class="gfs-hidden-iframe gfs-hidden"></iframe>\n\n<form id="gfs-form" class="gfs-form" action="${htmlEscape(schema.submitUrl)}" method="POST" target="gfs_hidden_iframe">\n${renderedFields}\n  <button class="gfs-submit" type="submit">Gửi</button>\n  <p class="gfs-message gfs-hidden" id="gfs-message">Gửi thành công. Cảm ơn bạn!</p>\n</form>`;
}

export function generateJs(): string {
  return `(function () {\n  var form = document.getElementById('gfs-form');\n  if (!form) return;\n\n  var message = document.getElementById('gfs-message');\n  var submitButton = form.querySelector('button[type="submit"]');\n  var params = new URLSearchParams(window.location.search);\n\n  var hiddenMap = {\n    utm_source: params.get('utm_source') || '',\n    utm_medium: params.get('utm_medium') || '',\n    utm_campaign: params.get('utm_campaign') || '',\n    utm_content: params.get('utm_content') || '',\n    utm_term: params.get('utm_term') || '',\n    page_url: window.location.href || '',\n    referrer: document.referrer || ''\n  };\n\n  var hiddenInputs = form.querySelectorAll('[data-gfs-hidden-key]');\n  hiddenInputs.forEach(function (input) {\n    var key = input.getAttribute('data-gfs-hidden-key');\n    if (key && Object.prototype.hasOwnProperty.call(hiddenMap, key)) {\n      input.value = hiddenMap[key];\n    }\n  });\n\n  form.addEventListener('submit', function () {\n    if (submitButton) {\n      submitButton.disabled = true;\n      submitButton.dataset.defaultText = submitButton.textContent || 'Gửi';\n      submitButton.textContent = 'Đang gửi...';\n    }\n\n    setTimeout(function () {\n      if (message) {\n        message.classList.remove('gfs-hidden');\n      }\n      form.reset();\n      if (submitButton) {\n        submitButton.disabled = false;\n        submitButton.textContent = submitButton.dataset.defaultText || 'Gửi';\n      }\n    }, 700);\n  });\n})();`;
}

export function generateCombined(schema: GoogleFormSchema): string {
  return `${generateHtml(schema)}\n\n<script>\n${generateJs()}\n</script>`;
}
