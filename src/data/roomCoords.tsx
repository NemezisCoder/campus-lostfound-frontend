
export type RoomId = "A-101" | "A-120" | "A-165" | "A-170";
// сюда добавишь остальные при необходимости

export type RoomCoords = { x: number; y: number };

// Координаты для БОЛЬШОЙ карты (главная страница)
export const MAIN_MAP_COORDS: Record<RoomId, RoomCoords> = {
    "A-101": { x: 0.7, y: 28.7 },
    "A-120": { x: 32.3, y: 73 },
    "A-165": { x: 85.3, y: 47.6 },
    "A-170": { x: 90, y: 37 },
};
export const PREVIEW_MAP_COORDS: Record<RoomId, RoomCoords> = {
    "A-101": { x: 7.5, y: 26 },
    "A-120": { x: 35.5, y: 72.75 },
    "A-165": { x: 79, y: 47.5 },
    "A-170": { x: 82.9, y: 37 },
};
// Координаты для МАЛЕНЬКОЙ карты в "Создать пост"
