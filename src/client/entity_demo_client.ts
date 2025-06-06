import { getFrameTimestamp } from 'glov/client/engine';
import { EntityBaseClient } from 'glov/client/entity_base_client';
import { ClientEntityManagerInterface } from 'glov/client/entity_manager_client';
import {
  ActionDataAssignments,
} from 'glov/common/entity_base_common';
import {
  DataObject,
  NetErrorCallback,
} from 'glov/common/types.js';
import type { ROVec2 } from 'glov/common/vmath';
import { EntityCrawlerDataCommon, entSamePos } from '../common/crawler_entity_common';
import type { JSVec3 } from '../common/crawler_state';
import {
  crawlerEntClientDefaultDraw2D,
  crawlerEntClientDefaultOnDelete,
  crawlerEntityManager,
  EntityCrawlerClient,
  EntityDraw2DOpts,
  EntityDrawOpts,
  EntityOnDeleteSubParam,
  Floater,
} from './crawler_entity_client';

const { random } = Math;

type Entity = EntityDemoClient;

export function entitiesAt(cem: ClientEntityManagerInterface<Entity>,
  pos: [number, number] | ROVec2,
  floor_id: number,
  skip_fading_out:boolean
): Entity[] {
  return cem.entitiesFind((ent) => entSamePos(ent, pos) && ent.data.floor === floor_id, skip_fading_out);
}

export function entityManager(): ClientEntityManagerInterface<Entity> {
  return crawlerEntityManager() as ClientEntityManagerInterface<Entity>;
}

export type StatsData = {
  hp: number;
  hp_max: number;
  attack: number;
  defense: number;
  accuracy: number;
  dodge: number;
  tier?: number;
};

export type Item = {
  item_id: string;
  count?: number;
  equipped?: boolean;
};

export type EntityDataClient = {
  type: string;
  pos: JSVec3;
  state: string;
  floor: number;
  stats: StatsData;
  // Player:
  money: number;
  last_floor: number;
  inventory: Item[];
  cheat?: number;
  score_money: number;
  score_won?: number;
  events_done?: Partial<Record<string, boolean>>;
  last_ship_pos?: JSVec3;
  last_ship_floor?: number;
} & EntityCrawlerDataCommon;


export class EntityDemoClient extends EntityBaseClient implements EntityCrawlerClient {
  declare entity_manager: ClientEntityManagerInterface<Entity>;
  declare data: EntityDataClient;

  floaters: Floater[];
  delete_reason?: string;

  declare onDelete: (reason: string) => number;
  declare draw2D: (param: EntityDraw2DOpts) => void;
  declare draw?: (param: EntityDrawOpts) => void;
  declare onDeleteSub?: (param: EntityOnDeleteSubParam) => void;
  declare triggerAnimation?: (anim: string) => void;

  // On prototype properties:
  declare type_id: string; // will be constant on the prototype
  declare do_split: boolean;
  declare is_player: boolean;
  declare is_enemy: boolean;
  declare is_chest: boolean;
  declare respawns: boolean;
  declare blocks_player: boolean;
  declare ai_move_min_time: number;
  declare ai_move_rand_time: number;
  declare name?: string;
  declare theguard?: boolean;
  declare enemytype?: string;

  not_dead_yet = false;
  fade_out_at?: number;

  constructor(data_in: DataObject) {
    super(data_in);
    let data = this.data;

    if (!data.pos) {
      data.pos = [0,0,0];
    }
    while (data.pos.length < 3) {
      data.pos.push(0);
    }

    if (this.is_player) {
      if (!data.stats || !data.stats.dodge) {
        data.stats = {
          hp: 15,
          hp_max: 15,
          attack: 6,
          defense: 4,
          accuracy: 4,
          dodge: 4,
        };
        data.floor = 10;
        data.money = 200;
      }
      if (!data.money) {
        data.money = 0;
      }
      if (data.score_money === undefined) {
        data.score_money = data.money;
      }
      if (!data.inventory) {
        data.inventory = [{
          item_id: 'med1',
          count: 2,
        }];
      }
    }

    this.floaters = [];
    this.aiResetMoveTime(true);
  }
  applyAIUpdate(
    action_id: string,
    data_assignments: ActionDataAssignments,
    payload?: unknown,
    resp_func?: NetErrorCallback,
  ): void {
    this.actionSend({
      action_id,
      data_assignments,
      payload,
    }, resp_func);
  }
  aiLastUpdatedBySomeoneElse(): boolean {
    return false;
  }
  ai_next_move_time!: number;
  aiResetMoveTime(initial: boolean): void {
    this.ai_next_move_time = getFrameTimestamp() + this.ai_move_min_time + random() * this.ai_move_rand_time;
  }

  isAlive(): boolean {
    return this.data.stats ? this.data.stats.hp > 0 || this.not_dead_yet : true;
  }

  isEnemy(): boolean {
    return this.is_enemy;
  }
  isPlayer(): boolean {
    return this.is_player;
  }

  onCreate(is_initial: boolean): number {
    return is_initial ? 0 : 250;
  }
}
EntityDemoClient.prototype.draw2D = crawlerEntClientDefaultDraw2D;
EntityDemoClient.prototype.onDelete = crawlerEntClientDefaultOnDelete;
EntityDemoClient.prototype.do_split = true;
EntityDemoClient.prototype.is_chest = false;
EntityDemoClient.prototype.respawns = false;
EntityDemoClient.prototype.ai_move_min_time = 500;
EntityDemoClient.prototype.ai_move_rand_time = 500;
