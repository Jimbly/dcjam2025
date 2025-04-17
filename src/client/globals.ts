// Virtual viewport for our game logic
export const game_width = 448;
export const game_height = 252;
// export const game_width = 256;
// export const game_height = 192;
export const render_width = 332;
export const render_height = 238;
export const VIEWPORT_X0 = 5;
export const VIEWPORT_Y0 = 5;

export const HUD_PAD = 8;
export const HUD_W_FULL = game_width - (VIEWPORT_X0 + render_width + VIEWPORT_X0);
export const HUD_X0 = game_width - HUD_W_FULL + 2;
export const HUD_W = game_width - HUD_PAD - HUD_X0;
export const HUD_Y0 = HUD_PAD;

export const BUTTON_W = 26; // square controller buttons
export const MOVE_BUTTONS_X0 = HUD_X0 + (HUD_W - BUTTON_W * 3) / 2 - 1;
export const MOVE_BUTTONS_Y0 = game_height - 71;
