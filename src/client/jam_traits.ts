/* eslint prefer-template:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
import { clone } from 'glov/common/util';
import {
  CrawlerScriptAPI,
  crawlerScriptRegisterEvent,
  CrawlerScriptWhen,
} from '../common/crawler_script';
import { CrawlerCell, DirType, JSVec3 } from '../common/crawler_state';
import { crawlerEntFactory } from './crawler_entity_client';
import { signWithName } from './dialog_data';
import { EntityDemoClient, StatsData } from './entity_demo_client';
import { autosave, myEnt, queueTransition } from './play';
import { travelTo } from './travelgame';

type Entity = EntityDemoClient;

crawlerScriptRegisterEvent({
  key: 'travel',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let params = param.split(' ');
    let floor = Number(params[0]);
    if (!isFinite(floor)) {
      api.status('travel', '"travel" event requires a floor number parameter');
      return;
    }
    let delta = floor - api.getFloor();
    let idx = 1;
    let special_pos = params[idx++] || (delta < 0 ? 'stairs_out' : 'stairs_in');
    travelTo(floor, special_pos);
  },
});
crawlerScriptRegisterEvent({
  key: 'return',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    queueTransition();
    autosave();
    api.floorAbsolute(10, 3, 7, 2);
    // signWithName('MONOLOGUING', 'Ah, it feels nice to be back in "friendly" territory.');
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
