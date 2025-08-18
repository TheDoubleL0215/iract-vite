import type { DatasetField } from "./DatasetField";

export interface Dataset {
  [key: string]: DatasetField;
}