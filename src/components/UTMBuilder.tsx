"use client";

import { useMemo, useState } from "react";

type PresetKey = "manual" | "email" | "organic_social" | "offline_qr" | "custom";

type FormState = {
  baseUrl: string;
  preset: PresetKey;
  campaign: string;
  source: string;
  medium: string;
  content: string;
  term: string;
  saleName: string;
};

const PRESETS: Record<PresetKey, { label: string; source: string; medium: string; helper: string }> = {
  manual: {
    label: "Sale gửi thủ công",
    source: "sales_manual",
    medium: "manual_share",
    helper: "Dùng chung cho mọi kênh sale tự gửi (Facebook, Zalo, email cá nhân...)."
  },
  email: {
    label: "Chiến dịch email",
    source: "crm",
    medium: "email",
    helper: "Dùng cho email marketing, newsletter hoặc automation."
  },
  organic_social: {
    label: "Bài đăng social tự nhiên",
    source: "facebook",
    medium: "social_organic",
    helper: "Dùng cho bài đăng không chạy ads trên fanpage hoặc profile."
  },
  offline_qr: {
    label: "QR offline",
    source: "offline",
    medium: "qr",
    helper: "Dùng cho tờ rơi, banner, standee, sự kiện quét QR."
  },
  custom: {
    label: "Link chiến dịch tùy chỉnh",
    source: "",
    medium: "",
    helper: "Tự đặt quy ước nếu không phù hợp các preset có sẵn."
  }
};

const SALE_NAMES = ["anh_ly", "bao_tran", "chi_linh", "duy_nguyen", "ha_pham"];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-]/g, "");
}

export default function UTMBuilder() {
  const [state, setState] = useState<FormState>({
    baseUrl: "",
    preset: "manual",
    campaign: "",
    source: PRESETS.manual.source,
    medium: PRESETS.manual.medium,
    content: "",
    term: "",
    saleName: ""
  });

  const [copied, setCopied] = useState(false);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};

    try {
      const u = new URL(state.baseUrl);
      if (!["http:", "https:"].includes(u.protocol)) {
        e.baseUrl = "URL gốc phải bắt đầu bằng http:// hoặc https://";
      }
    } catch {
      e.baseUrl = "Nhập URL đầy đủ hợp lệ (ví dụ: https://example.com/landing-page)";
    }

    if (!state.campaign.trim()) e.campaign = "Vui lòng nhập tên chiến dịch.";
    if (!state.source.trim()) e.source = "Vui lòng nhập source.";
    if (!state.medium.trim()) e.medium = "Vui lòng nhập medium.";
    if (state.medium.trim() === "manual_share" && !state.saleName.trim()) {
      e.saleName = "Vui lòng chọn sale name.";
    }

    return e;
  }, [state]);

  const trackingUrl = useMemo(() => {
    if (Object.keys(errors).length) return "";

    const url = new URL(state.baseUrl);
    url.searchParams.set("utm_source", slugify(state.source));
    url.searchParams.set("utm_medium", slugify(state.medium));
    url.searchParams.set("utm_campaign", slugify(state.campaign));
    if (state.content.trim()) url.searchParams.set("utm_content", slugify(state.content));
    if (state.term.trim()) url.searchParams.set("utm_term", slugify(state.term));
    return url.toString();
  }, [errors, state]);

  function onPresetChange(preset: PresetKey) {
    setState((prev) => ({
      ...prev,
      preset,
      source: PRESETS[preset].source || prev.source,
      medium: PRESETS[preset].medium || prev.medium,
      saleName: "",
      content: ""
    }));
  }

  function onMediumChange(value: string) {
    setState((prev) => ({
      ...prev,
      medium: value,
      content: value.trim() === "manual_share" ? prev.saleName || SALE_NAMES[0] : prev.content
    }));
  }

  function onSaleNameChange(value: string) {
    setState((prev) => ({
      ...prev,
      saleName: value,
      content: prev.medium.trim() === "manual_share" ? value : prev.content
    }));
  }

  async function copyLink() {
    if (!trackingUrl) return;
    await navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold">UTM Builder</h2>
        <p className="mt-1 text-sm text-slate-600">Tạo link tracking với hướng dẫn rõ ràng để sale tự thao tác.</p>
        <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="font-semibold">Quy ước chuẩn để không sai báo cáo</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Dùng chữ thường, không dấu, cách nhau bằng dấu gạch dưới `_`.</li>
            <li>Không dùng khoảng trắng hoặc ký tự đặc biệt.</li>
            <li>Giữ cách đặt tên cố định giữa các chiến dịch để dễ lọc dữ liệu.</li>
          </ul>
          <p className="mt-2 font-semibold">Quy ước cho sale tự phân phối link</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Dùng chung `utm_source=sales_manual`, `utm_medium=manual_share` cho mọi kênh tự gửi.</li>
            <li>Không cần tách riêng Facebook/Zalo/email cá nhân.</li>
            <li>
              Dùng <code>utm_content=sale_name</code> để biết lead đến từ sale nào.
            </li>
          </ul>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">URL đích</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="https://example.com/landing-page"
              value={state.baseUrl}
              onChange={(e) => setState((p) => ({ ...p, baseUrl: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-500">Dán URL landing page gốc, chưa gắn UTM.</p>
            <p className="mt-1 text-xs text-slate-500">Ví dụ chuẩn: `https://truongabc.edu.vn/tuyen-sinh`</p>
            {errors.baseUrl ? <p className="mt-1 text-xs text-red-600">{errors.baseUrl}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Mục đích sử dụng / Preset</label>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={state.preset}
              onChange={(e) => onPresetChange(e.target.value as PresetKey)}
            >
              {Object.entries(PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">{PRESETS[state.preset].helper}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Tên chiến dịch</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="tuyensinh_tieuhoc_2026"
              value={state.campaign}
              onChange={(e) => setState((p) => ({ ...p, campaign: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-500">Đặt theo mục tiêu/thời điểm. Ví dụ: `back_to_school_2026`.</p>
            <p className="mt-1 text-xs text-slate-500">Mẫu nên dùng: `tuyensinh_tieuhoc_2026`, `open_day_2026_q1`</p>
            {errors.campaign ? <p className="mt-1 text-xs text-red-600">{errors.campaign}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Source</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="facebook"
              value={state.source}
              onChange={(e) => setState((p) => ({ ...p, source: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-500">Nguồn traffic đến từ đâu. Ví dụ: `facebook`, `zalo`, `crm`.</p>
            <p className="mt-1 text-xs text-slate-500">Cho sale tự gửi nên dùng chuẩn: `sales_manual`.</p>
            {errors.source ? <p className="mt-1 text-xs text-red-600">{errors.source}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Medium</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="cpc"
              value={state.medium}
              onChange={(e) => onMediumChange(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">Kênh marketing. Ví dụ: `email`, `social_organic`, `qr`.</p>
            <p className="mt-1 text-xs text-slate-500">Cho sale tự gửi nên dùng chuẩn: `manual_share`.</p>
            {errors.medium ? <p className="mt-1 text-xs text-red-600">{errors.medium}</p> : null}
          </div>

          {state.medium.trim() === "manual_share" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">Sale name</label>
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={state.saleName}
                onChange={(e) => onSaleNameChange(e.target.value)}
              >
                <option value="">-- Chọn sale --</option>
                {SALE_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Khi medium là `manual_share`, content sẽ tự lấy theo sale name.</p>
              {errors.saleName ? <p className="mt-1 text-xs text-red-600">{errors.saleName}</p> : null}
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-slate-700">Content</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="ad_01"
              value={state.content}
              onChange={(e) => setState((p) => ({ ...p, content: e.target.value }))}
              readOnly={state.medium.trim() === "manual_share"}
            />
            <p className="mt-1 text-xs text-slate-500">
              Không bắt buộc. Dùng để phân biệt mẫu ads/nội dung. Ví dụ: `banner_a`, `ad_01`.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Với `manual_share`, trường này tự điền theo sale name để đo theo từng sale.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Term</label>
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="truong_tieu_hoc"
              value={state.term}
              onChange={(e) => setState((p) => ({ ...p, term: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-500">Không bắt buộc. Từ khóa/chủ đề để phân nhóm traffic.</p>
            <p className="mt-1 text-xs text-slate-500">Mẫu nên dùng: `truong_tieu_hoc`, `hoc_phi`, `ban_tru`</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700">Link UTM đã tạo</h3>
        <textarea
          className="mt-2 h-28 w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs"
          readOnly
          value={trackingUrl}
          placeholder="Nhập đủ các trường bắt buộc để tạo link tracking."
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={!trackingUrl}
            onClick={copyLink}
          >
            {copied ? "Đã copy" : "Copy link"}
          </button>
          <p className="text-xs text-slate-500">Hệ thống tự chuẩn hóa chữ thường và dấu gạch dưới để đồng nhất báo cáo.</p>
        </div>
      </div>
    </div>
  );
}
