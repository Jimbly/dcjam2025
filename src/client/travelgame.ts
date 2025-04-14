import { crawlerGameState } from './crawler_play';

type TravelGameState = {
  pos: number;
};

let travel_state: TravelGameState | null = null;

export function travelGameActive(): boolean {
  return Boolean(travel_state);
}

export function travelGameCheck(force_no: boolean): boolean {
  let game_state = crawlerGameState();
  let { floor_id } = game_state;
  if (floor_id !== 7 || force_no) {
    travel_state = null;
    return false;
  }
  if (!travel_state) {
    travel_state = {
      pos: 0,
    };
  }
  return true;
}

export function doTravelGame(): void {
  // TODO
}
