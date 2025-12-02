// src/api/items.ts
import { RoomId } from "../data/roomCoords";

export type ItemType = "lost" | "found";
export type StatusType = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type CategoryType = "electronics" | "clothes" | "personal" | "documents";

export type MapItem = {
    id: number;
    title: string;
    type: ItemType;
    status: StatusType;
    category: CategoryType;
    roomId: RoomId;        // ← теперь RoomId
    roomLabel: string;
    floorLabel: string;
    timeAgo: string;
    description: string;
};

export type ItemCreatePayload = Omit<MapItem, "id">;

const BASE_URL = "http://localhost:8000/api/v1";

export async function fetchItems(): Promise<MapItem[]> {
    const res = await fetch(`${BASE_URL}/items`);
    if (!res.ok) throw new Error("Failed to fetch items");
    return res.json();
}

export async function createItem(payload: ItemCreatePayload): Promise<MapItem> {
    const res = await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create item");
    return res.json();
}
