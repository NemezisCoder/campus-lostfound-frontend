import { api } from "./client";

export type ThreadOut = {
    id: number;
    item_id: number;
    peer_id: number;
    last_message_at?: string | null;
    last_message_text?: string | null;
};

export type MessageOut = {
    id: number;
    thread_id: number;
    sender_id: number;
    text: string;
    created_at: string;
    client_id?: string | null;
};

export async function createOrGetThread(itemId: number, peerId: number) {
    const r = await api.post<ThreadOut>("/chat/thread", { item_id: itemId, peer_id: peerId });
    return r.data;
}

export async function fetchThreads() {
    const r = await api.get<ThreadOut[]>("/chat/threads");
    return r.data;
}

export async function fetchMessages(threadId: number, limit = 50) {
    const r = await api.get<MessageOut[]>(`/chat/threads/${threadId}/messages`, { params: { limit } });
    return r.data;
}
