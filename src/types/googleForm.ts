export type GoogleFormFieldType =
  | "short_text"
  | "paragraph"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "date"
  | "time"
  | "linear_scale"
  | "unknown"
  | "unsupported";

export type GoogleFormField = {
  id: string;
  entryId: string;
  label: string;
  helpText?: string;
  type: GoogleFormFieldType;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  unsupportedReason?: string;
};

export type GoogleFormSchema = {
  title: string;
  description?: string;
  sourceUrl: string;
  submitUrl: string;
  fields: GoogleFormField[];
  warnings: string[];
};
