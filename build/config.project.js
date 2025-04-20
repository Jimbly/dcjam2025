const gb = require('glov-build');
const yamlproc = require('./yamlproc.js');

module.exports = function (config) {
  // Spine support
  // Note: Runtime requires a Spine license to use in any product.
  config.client_fsdata.push(
    'client/spine/**.atlas',
    'client/spine/**.skel',
    'client/spine/**.json',
  );

  config.client_static.push('client_json:client/levels/*.json');

  gb.task({
    name: 'walldefs',
    input: ['client/walls/**/*.walldef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('walldefs');
  config.client_fsdata.push('walldefs:**');
  config.server_fsdata.push('walldefs:**');
  config.fsdata_embed.push('.walldef');

  config.server_fsdata.push('client_autoatlas:**/*.auat');

  gb.task({
    name: 'celldefs',
    input: ['client/cells/**/*.celldef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('celldefs');
  config.client_fsdata.push('celldefs:**');
  config.server_fsdata.push('celldefs:**');
  config.fsdata_embed.push('.celldef');

  gb.task({
    name: 'entdefs',
    input: ['client/entities/**/*.entdef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('entdefs');
  config.client_fsdata.push('entdefs:**');
  config.server_fsdata.push('entdefs:**');
  config.fsdata_embed.push('.entdef');

  gb.task({
    name: 'vstyles',
    input: ['client/vstyles/**/*.vstyle'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('vstyles');
  config.client_fsdata.push('vstyles:**');
  config.server_fsdata.push('vstyles:**');
  config.fsdata_embed.push('.vstyle');

  config.extra_index = [{
    name: 'itch',
    defines: {
      ...config.default_defines,
      PLATFORM: 'web',
    },
    zip: true,
  }];

  if (0) {
    config.autoatlas_ignore =
[
  'base:door-2-down',
  // 'base:floor_pillar',
  // 'base:floor_tree',
  'decals:arrow-left',
  'decals:arrow-right',
  'decals:banner-1',
  'decals:banner-2',
  'decals:button-active',
  'decals:door-1',
  'decals:door-2',
  'decals:door-2a',
  'decals:fireplace',
  'decals:poster-1',
  'decals:poster-2',
  'decals:poster-blank',
  'decals:shield',
  'decals:shop-window-decal-armor',
  'decals:shop-window-decal-head',
  'decals:shop-window-decal-medi',
  'decals:shop-window-decal-offhand',
  'decals:shop-window-decal-weapon',
  'decals:station-decal-shop',
  'demo:blocker',
  'demo:crystal_wall11',
  'demo:dngn_enter_shop',
  'demo:lair0',
  'demo:marble_wall7',
  'demo:tall',
  'demo:wide',
  'moon:filler',
  'moon:pillar_floor1',
  'moon:pillar_floor2',
  'moon:pillar_floor3',
  'moon:pillar_floor4',
  'moon:solid3',
  'moon:stairs_in',
  'moon:stairs_out',
  'ship:filler',
  'ship:pillar_floor1',
  'ship:pillar_floor2',
  'ship:pillar_floor3',
  'ship:pillar_floor4',
  'ship:pillar4',
  'ship:solid3',
  'ship:stairs_in',
  'ship:stairs_out',
  'station:detail3',
  'station:detail4',
  'station:filler',
  'station:lootbox',
  'station:pillar_floor1',
  'station:pillar_floor2',
  'station:pillar_floor3',
  'station:pillar_floor4',
  'station:pillar1',
  'station:pillar2',
  'station:pillar3',
  'station:pillar4',
  'station:stairs_in',
  'station:stairs_out',
  'utumno:crystalwing',
  'utumno:goblin',
  'utumno:knight',
  'utumno:shopkeep',
  'utumno:skeleton',
  'whitebox:pit_closed',
  'whitebox:pit_open'
];
  }

};
