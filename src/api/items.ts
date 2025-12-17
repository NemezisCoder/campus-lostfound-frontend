// src/api/items.ts
import { RoomId } from "../data/roomCoords";
import { api } from "./client";

export type ItemType = "lost" | "found";
export type StatusType = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type CategoryType = "electronics" | "clothes" | "personal" | "documents";

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

export type ItemCreatePayload = Omit<MapItem, "id" | "owner_id">;

export async function fetchItems(): Promise<MapItem[]> {
    const res = await api.get<MapItem[]>("/items/");
    return res.data;
}

export async function createItem(payload: ItemCreatePayload): Promise<MapItem> {
    const res = await api.post<MapItem>("/items/", payload);
    return res.data;
}

export async function uploadItemImage(itemId: number, file: File): Promise<MapItem> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<MapItem>(`/items/${itemId}/image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
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
    minSimilarity = 0.0,
): Promise<SimilarMatch[]> {
    const res = await api.post<{ possible_duplicates: SimilarMatch[] }>(
        `/search/deduplicate?item_id=${itemId}&top_k=${topK}&min_similarity=${minSimilarity}`,
    );

    return res.data.possible_duplicates ?? [];
}