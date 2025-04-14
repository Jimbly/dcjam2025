import { clone } from 'glov/common/util';
import { crawlerEntFactory } from './crawler_entity_client';
import { EntityDemoClient, StatsData } from './entity_demo_client';

type Entity = EntityDemoClient;

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
