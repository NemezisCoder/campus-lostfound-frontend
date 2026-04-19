import axios from "axios";
import { RoomId } from "../data/roomCoords";
import { api } from "./client";

const API_URL = import.meta.env.VITE_API_URL;

export type ItemType = "lost" | "found";
export type StatusType = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type CategoryType = "electronics" | "clothes" | "personal" | "documents";
export type ItemSort = "id_desc" | "id_asc" | "title_asc" | "title_desc";

export type MapItem = {
  id: number;
  owner_id: number;
  title: string;
  type: ItemType;
  status: StatusType;
  category: CategoryType;
  roomId: RoomId;
  roomLabel: string;
  floorLabel: string;
  timeAgo: string;
  description: string;
  image_url?: string | null;
};

export type ItemCreatePayload = Omit<MapItem, "id" | "owner_id" | "status">;

export type ItemsQuery = {
  q?: string;
  type?: ItemType;
  status?: StatusType;
  category?: CategoryType;
  sort?: ItemSort;
  page?: number;
  page_size?: number;
};

export type ItemsPage = {
  items: MapItem[];
  total: number;
  page: number;
  page_size: number;
};

export async function fetchItemsPage(params: ItemsQuery = {}): Promise<ItemsPage> {
  const res = await api.get<ItemsPage>("/items/", { params });
  return res.data;
}

export async function fetchItem(itemId: number): Promise<MapItem> {
  const res = await api.get<MapItem>(`/items/${itemId}`);
  return res.data;
}

export async function createItem(payload: ItemCreatePayload): Promise<MapItem> {
  const res = await api.post<MapItem>("/items/", payload);
  return res.data;
}

export async function uploadItemImage(
  itemId: number,
  file: File,
  token: string,
  onProgress?: (percent: number) => void,
): Promise<MapItem> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post<MapItem>(
    `${API_URL}/items/${itemId}/image`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: (event) => {
        if (!event.total) return;
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress?.(percent);
      },
    }
  );

  return response.data;
}

export type SimilarMatch = { item: MapItem; similarity: number };

export async function searchSimilarByImage(file: File, topK = 5): Promise<SimilarMatch[]> {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post<{ matches: SimilarMatch[] }>(
    `/search/similar-by-image?top_k=${topK}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data.matches;
}

export async function deduplicateItem(
  itemId: number,
  topK = 20,
  minSimilarity = 0.0
): Promise<SimilarMatch[]> {
  const res = await api.post<{ possible_duplicates: SimilarMatch[] }>(
    `/search/deduplicate?item_id=${itemId}&top_k=${topK}&min_similarity=${minSimilarity}`
  );

  return res.data.possible_duplicates ?? [];
}

export async function fetchMyItems(): Promise<MapItem[]> {
  const res = await api.get<MapItem[]>("/items/mine");
  return res.data;
}

export async function deleteItem(itemId: number): Promise<void> {
  await api.delete(`/items/${itemId}`);
}