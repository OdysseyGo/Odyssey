import api from "./client";

export interface AnchorVector {
  x: number;
  y: number;
  z: number;
}

export interface AnchorDraft {
  id: string;
  label: string;
  position: AnchorVector;
  normal?: AnchorVector | null;
  order: number;
}

export interface CatalogModel {
  id: number;
  slug: string;
  name: string;
  preview_image_url: string;
  scene_asset_url: string;
  anchors: AnchorDraft[];
  anchor_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SaveCatalogModelInput {
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  anchors: AnchorDraft[];
  sceneAssetFile?: File | null;
  previewImageFile?: File | null;
}

function buildPayload(input: SaveCatalogModelInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("slug", input.slug);
  formData.append("is_active", String(input.is_active));
  formData.append("sort_order", String(input.sort_order));
  formData.append("anchors", JSON.stringify(input.anchors));

  if (input.sceneAssetFile) {
    formData.append("scene_asset_file", input.sceneAssetFile);
  }

  if (input.previewImageFile) {
    formData.append("preview_image", input.previewImageFile);
  }

  return formData;
}

export const listARModels = () => api.get("/admin/ar-models/");

export const getARModel = (id: number) => api.get(`/admin/ar-models/${id}/`);

export const createARModel = (input: SaveCatalogModelInput) =>
  api.post("/admin/ar-models/", buildPayload(input), {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateARModel = (id: number, input: SaveCatalogModelInput) =>
  api.patch(`/admin/ar-models/${id}/`, buildPayload(input), {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteARModel = (id: number) => api.delete(`/admin/ar-models/${id}/`);
