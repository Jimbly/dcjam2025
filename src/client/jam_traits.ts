/* eslint prefer-template:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
import { clone } from 'glov/common/util';
import {
  CrawlerScriptAPI,
  crawlerScriptRegisterEvent,
  CrawlerScriptWhen,
} from '../common/crawler_script';
import { CrawlerCell } from '../common/crawler_state';
import { crawlerEntFactory } from './crawler_entity_client';
import { signWithName } from './dialog_data';
import { EntityDemoClient, StatsData } from './entity_demo_client';
import { autosave, queueTransition } from './play';
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
