/* eslint prefer-template:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
import { playUISound } from 'glov/client/ui';
import { clone } from 'glov/common/util';
import {
  CrawlerScriptAPI,
  crawlerScriptRegisterEvent,
  CrawlerScriptWhen,
} from '../common/crawler_script';
import { CrawlerCell, DirType, JSVec3 } from '../common/crawler_state';
import { crawlerEntFactory } from './crawler_entity_client';
import { crawlerController } from './crawler_play';
import { signWithName } from './dialog_data';
import { EntityDemoClient, StatsData } from './entity_demo_client';
import { autosave, myEnt, queueTransition } from './play';
import { travelTo } from './travelgame';
import { startTravel } from './travelmap';

type Entity = EntityDemoClient;

crawlerScriptRegisterEvent({
  key: 'key_set',
  when: CrawlerScriptWhen.PRE, // Must be PRE so that the if happens before the server applies it
  // map_icon: CrawlerScriptEventMapIcons.EXCLAMATION,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    if (!param && cell.props?.key_cell) {
      param = cell.props?.key_cell;
    }
    if (!param) {
      api.status('key_pickup', '"key_set" event requires a string parameter');
    } else {
      if (!api.keyGet(param)) {
        api.keySet(param);
        playUISound('unlock_door'); // DCJAM25
        //api.status('key_pickup', `Acquired key "${param}"`);
      }
    }
  },
});

crawlerScriptRegisterEvent({
  key: 'travel',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    startTravel();
  },
});
crawlerScriptRegisterEvent({
  key: 'return',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    travelTo(-1, 'station');
  },
});

crawlerScriptRegisterEvent({
  key: 'shipgo',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let params = param.split(' ');
    let floor = Number(params[0]);
    if (!isFinite(floor)) {
      api.status('shipgo', '"shipgo" event requires a floor number parameter');
      return;
    }
    let { data } = myEnt();
    data.last_ship_floor = data.floor;
    data.last_ship_pos = data.pos.slice(0) as JSVec3;
    data.last_ship_pos[2] = crawlerController().getMoveFromDir();
    let delta = floor - api.getFloor();
    let idx = 1;
    let special_pos = params[idx++] || (delta < 0 ? 'stairs_out' : 'stairs_in');
    api.floorDelta(delta, special_pos, false);
  },
});

crawlerScriptRegisterEvent({
  key: 'shipreturn',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let { data } = myEnt();
    let floor = data.last_ship_floor || 10;
    let pos = data.last_ship_pos || [6,8,1];
    let delta = floor - api.getFloor();
    api.floorAbsolute(floor, pos[0], pos[1], ((pos[2] + 2) % 4) as DirType);
  },
});

export function appTraitsStartup(): void {
  let ent_factory = crawlerEntFactory<Entity>();

  ent_factory.registerTrait<StatsData, undefined>('stats_default', {
    default_opts: {
      hp: 10,
      hp_max: 0, // inherit from hp
      attack: 4,
      defense: 4,
      accuracy: 0,
      dodge: 0,
    },
    alloc_state: function (opts: StatsData, ent: Entity) {
      if (!ent.data.stats) {
        ent.data.stats = clone(opts);
        if (!ent.data.stats.hp_max) {
          ent.data.stats.hp_max = ent.data.stats.hp;
        }
      }
      return undefined;
    }
  });
}
