/* eslint-disable @stylistic/max-len */

const assert = require('assert');
const path = require('path');
const gb = require('glov-build');
const yaml = require('js-yaml');
const { pngAlloc, pngRead, pngWrite } = require('./png');
const { floor, max } = Math;

function nextHighestPowerOfTwo(x) {
  --x;
  for (let i = 1; i < 32; i <<= 1) {
    x |= x >> i;
  }
  return x + 1;
}

function cmpFileKeys(a, b) {
  return a.localeCompare(b, 'en', { numeric: true });
}

let did_error = false;
function parseRow(job, img, x0, y0, dx, dy) {
  let ws = [];
  let lastcoord = dx ? x0 : y0;
  let lastv = false;
  let { data, width, height } = img;
  assert.equal(data.length, width * height * 4);
  let xx = x0;
  let yy = y0;
  while (dx ? xx < width - 1 : yy < height - 1) {
    let idx = (xx + yy * width) * 4;
    let v;
    let a = data[idx + 3];
    if (!a) {
      // transparent
      v = false;
    } else {
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];
      if (a === 255 && !r && !g && !b) {
        // black
        v = true;
      } else if (a === 255 && r === 255 && g === 255 && b === 255) {
        // white
        v = false;
      } else {
        if (!did_error) {
          job.error(`Error parsing 9-patch file "${img.source_name}": found a pixel other than black, white, or invisible at ${xx},${yy}`);
          did_error = true;
        }
      }
    }
    if (v !== lastv) {
      ws.push((dx ? xx : yy) - lastcoord);
      lastv = v;
      lastcoord = (dx ? xx : yy);
    }
    xx += dx;
    yy += dy;
  }
  ws.push((dx ? width : height) - 1 - lastcoord);
  return ws;
}


let png_cache = [];
let used_index = 0;
function pngAllocTempReset() {
  let any_used = false;
  let oldest_unused = -1;
  for (let ii = 0; ii < png_cache.length; ++ii) {
    if (png_cache[ii].used) {
      png_cache[ii].used = false;
      any_used = true;
    } else {
      if (oldest_unused === -1 || png_cache[ii].index < png_cache[oldest_unused].index) {
        oldest_unused = ii;
      }
    }
  }
  if (any_used) {
    // just free one
    png_cache[oldest_unused] = png_cache[png_cache.length - 1];
    png_cache.pop();
  }
}

function pngAllocTemp(width, height) {
  for (let ii = 0; ii < png_cache.length; ++ii) {
    if (!png_cache[ii].used && png_cache[ii].width === width && png_cache[ii].height === height) {
      png_cache[ii].used = true;
      png_cache[ii].index = ++used_index;
      return png_cache[ii].img;
    }
  }
  let img = pngAlloc({ width, height, byte_depth: 4 });
  png_cache.push({
    width,
    height,
    img,
    used: true,
    index: ++used_index,
  });
  return img;
}

module.exports = function (opts) {
  let ignore_list = opts.ignore || [];
  let ignore = Object.create(null);
  for (let ii = 0; ii < ignore_list.length; ++ii) {
    ignore[ignore_list[ii]] = true;
  }
  let output_cache = {};
  let input_png_cache = {};
  function imgproc(job, done) {
    let files = job.getFiles();
    let changed_files = job.getFilesUpdated();

    let atlases = {};
    let seen_png = {};
    for (let ii = 0; ii < files.length; ++ii) {
      let img_file = files[ii];
      let m = img_file.relative.match(/^(?:.*\/)?([^/]+)\/([^/]+)\.(png|ya?ml)$/);
      let atlas_name = m[1].toLowerCase();
      let img_name = m[2].toLowerCase();
      let ext = m[3];
      let atlas_data = atlases[atlas_name] = atlases[atlas_name] || { num_layers: 1, file_data: {}, dirty: false };
      let is_dirty = changed_files.includes(img_file);
      if (is_dirty) {
        atlas_data.dirty = true;
      }
      if (ext[0] === 'y') {
        if (img_name !== 'atlas') {
          job.error(img_file, `Found unexpected yaml: "${img_file.relative}" (expected atlas.yaml or [image_name].yaml)`);
          continue;
        }
        let config_data;
        try {
          config_data = yaml.load(img_file.contents.toString('utf8')) || {};
        } catch (err) {
          job.error(img_file, `Error parsing ${img_file.relative}: ${err}`);
          continue;
        }
        if (config_data.pad && typeof config_data.pad !== 'number') {
          job.error(img_file, `pad must be number, found ${JSON.stringify(config_data.pad)}`);
          delete config_data.pad;
        }
        if (config_data.max_tex_size && typeof config_data.max_tex_size !== 'number') {
          job.error(img_file, `max_tex_size must be number, found ${JSON.stringify(config_data.max_tex_size)}`);
          delete config_data.max_tex_size;
        }
        if (config_data.tile_horiz_regex) {
          try {
            config_data.tile_horiz_regex = new RegExp(config_data.tile_horiz_regex);
          } catch (err) {
            job.error(img_file, `error parsing RegExp tile_horiz_regex: ${JSON.stringify(config_data.tile_horiz_regex)}: ${err}`);
            delete config_data.tile_horiz_regex;
          }
        }
        if (config_data.tile_vert_regex) {
          try {
            config_data.tile_vert_regex = new RegExp(config_data.tile_vert_regex);
          } catch (err) {
            job.error(img_file, `error parsing RegExp tile_vert_regex: ${JSON.stringify(config_data.tile_vert_regex)}: ${err}`);
            delete config_data.tile_vert_regex;
          }
        }
        if (config_data.tile_regex) {
          try {
            config_data.tile_regex = new RegExp(config_data.tile_regex);
          } catch (err) {
            job.error(img_file, `error parsing RegExp tile_regex: ${JSON.stringify(config_data.tile_regex)}: ${err}`);
            delete config_data.tile_regex;
          }
        }
        atlas_data.config_data = config_data;
        continue;
      }
      seen_png[img_file.relative] = true;
      let img;
      if (!is_dirty && input_png_cache[img_file.relative]) {
        img = input_png_cache[img_file.relative];
      } else {
        let err;
        ({ err, img } = pngRead(img_file.contents));
        if (err) {
          job.error(img_file, `Error reading ${img_file.relative}: ${err}`);
          continue;
        }
        input_png_cache[img_file.relative] = img;
      }
      img.source_name = img_file.relative;
      let do_9patch = img_name.endsWith('.9');
      if (do_9patch) {
        img_name = img_name.slice(0, -2);
      }
      m = img_name.match(/^(.*)_(\d+)$/);
      let idx = 0;
      if (m) {
        img_name = m[1];
        idx = Number(m[2]);
      }
      atlas_data.num_layers = max(atlas_data.num_layers, idx + 1);
      let img_data = atlas_data.file_data[img_name] = atlas_data.file_data[img_name] || { imgs: [] };
      let ws = [img.width];
      let hs = [img.height];
      did_error = false;
      if (do_9patch) {
        ws = parseRow(job, img, 1, 0, 1, 0);
        hs = parseRow(job, img, 0, 1, 0, 1);
        if (idx === 0) {
          // currently unused, but can parse the padding values from the 9-patch as well
          img_data.padh = parseRow(job, img, 1, img.height - 1, 1, 0);
          img_data.padv = parseRow(job, img, img.width - 1, 1, 0, 1);
          if (img_data.padh.length === 1 && img_data.padv.length === 1) {
            delete img_data.padh;
            delete img_data.padv;
          }
        }
        let new_img = pngAlloc({ width: img.width - 2, height: img.height - 2, byte_depth: 4 });
        img.bitblt(new_img, 1, 1, img.width - 2, img.height - 2, 0, 0);
        img = new_img;
      }
      if (idx === 0) {
        img_data.ws = ws;
        img_data.hs = hs;
      }
      img.filename = img_file.relative;
      if (img_data.imgs[idx]) {
        job.error('Two atlas source files map to the same image:' +
          ` ${img.filename} and ${img_data.imgs[idx].filename}`);
      }
      img_data.imgs[idx] = img;
    }

    for (let key in input_png_cache) {
      if (!seen_png[key]) {
        delete input_png_cache[key];
      }
    }

    let atlas_keys = Object.keys(atlases);

    if (!atlas_keys.length) {
      // no error, just no atlases in this project, that's fine
      return void done();
    }

    let seen = {};
    function doAtlas(name) {
      let atlas_data = atlases[name];
      let { file_data, config_data, dirty } = atlas_data;
      seen[name] = true;
      if (!dirty) {
        let cache = output_cache[name];
        assert(cache);
        for (let ii = 0; ii < cache.length; ++ii) {
          job.out(cache[ii]);
        }
        return;
      }
      pngAllocTempReset();

      const tile_horiz_regex = config_data?.tile_horiz_regex || null;
      const tile_vert_regex = config_data?.tile_vert_regex || null;
      const tile_regex = config_data?.tile_regex || null;
      const pad = config_data?.pad || 8;
      const max_tex_size = config_data?.max_tex_size || 1024;

      let file_keys = Object.keys(file_data);
      file_keys.sort(cmpFileKeys);

      let runtime_data = {
        // name,
        tiles: [], // [name, x, y, ws, hs, padh, padv]
      };
      if (atlas_data.num_layers > 1) {
        runtime_data.layers = atlas_data.num_layers;
      }

      // Check input and pack output
      let maxx = 0;
      let maxy;
      {
        let x = 0;
        let y = 0;
        let row_height = 0;
        let any_error = false;
        for (let ii = 0; ii < file_keys.length; ++ii) {
          let img_name = file_keys[ii];
          if (ignore[`${name}:${img_name}`]) {
            continue;
          }
          let img_data = file_data[img_name];
          let { imgs } = img_data;
          let img0 = imgs[0];
          if (!img0) {
            any_error = true;
            job.error(`Image ${img_name} missing required base (_0) layer`);
            continue;
          }
          // Check all layers are the same size
          for (let idx = 1; idx < imgs.length; ++idx) {
            let img = imgs[idx];
            if (img) {
              if (img.width !== img0.width ||
                img.height !== img0.height
              ) {
                any_error = true;
                job.error(`Image ${img_name} layer ${idx} (${img.source_name}) resolution (${img.width}x${img.height})` +
                  ` does not match base layer (${img0.source_name}) resolution (${img0.width}x${img0.height})`);
              }
            }
          }
          // Pack into output
          if (x + img0.width + pad * 2 > max_tex_size) {
            x = 0;
            y += row_height;
            row_height = 0;
          }
          row_height = max(row_height, img0.height + pad * 2);
          img_data.x = x + pad;
          img_data.y = y + pad;
          x += img0.width + pad * 2;
          maxx = max(maxx, x);
        }
        y += row_height + pad * 2;
        maxy = y;
        if (any_error) {
          return;
        }
      }

      // Allocate actual images and copy into them
      let width = nextHighestPowerOfTwo(maxx);
      let height = nextHighestPowerOfTwo(maxy);
      let pngouts = [];
      for (let ii = 0; ii < atlas_data.num_layers; ++ii) {
        pngouts.push(pngAllocTemp(width, height));
      }
      runtime_data.w = width;
      runtime_data.h = height;

      for (let ii = 0; ii < file_keys.length; ++ii) {
        let img_name = file_keys[ii];
        if (ignore[`${name}:${img_name}`]) {
          continue;
        }
        let img_data = file_data[img_name];
        let { imgs, x, y, ws, hs, padh, padv } = img_data;
        let { width: imgw, height: imgh } = imgs[0];
        let tuple = [img_name, x, y, ws, hs];
        if (padh) {
          tuple.push(padh, padv);
        }
        runtime_data.tiles.push(tuple);

        for (let idx = 0; idx < imgs.length; ++idx) {
          let img = imgs[idx];
          if (!img) {
            continue;
          }
          let { data: outdata } = pngouts[idx];
          let { data: indata } = img;
          let clamp = !tile_regex?.test(img_name);
          let clamp_vert = clamp && !tile_vert_regex?.test(img_name) || tile_regex && tile_horiz_regex?.test(img_name);
          let clamp_horiz = clamp && !tile_horiz_regex?.test(img_name) || tile_regex && tile_vert_regex?.test(img_name);
          for (let yy = -pad; yy < imgh + pad; ++yy) {
            let yyy;
            if (clamp_vert) {
              yyy = yy < 0 ? 0 : yy >= imgh ? imgh - 1 : yy;
            } else {
              yyy = (yy + imgh) % imgh;
            }
            for (let xx = -pad; xx < imgw + pad; ++xx) {
              let xxx;
              if (clamp_horiz) {
                xxx = xx < 0 ? 0 : xx >= imgw ? imgw - 1 : xx;
              } else {
                xxx = (xx + imgw) % imgw;
              }
              for (let jj = 0; jj < 4; ++jj) {
                outdata[(x + xx + (y + yy) * width) * 4 + jj] = indata[(xxx + yyy * imgw) * 4 + jj];
              }
            }
          }
        }
      }

      let out_list = [];
      for (let idx = 0; idx < pngouts.length; ++idx) {
        let pngout = pngouts[idx];
        out_list.push({
          relative: `client/img/atlas_${name}${atlas_data.num_layers > 1 ? `_${idx}` : ''}.png`,
          contents: pngWrite(pngout),
        });
      }
      out_list.push({
        relative: `client/${name}.auat`,
        contents: JSON.stringify(runtime_data),
      });
      for (let ii = 0; ii < out_list.length; ++ii) {
        job.out(out_list[ii]);
      }
      output_cache[name] = out_list;
      pngAllocTempReset();
    }

    for (let key in atlases) {
      doAtlas(key);
    }
    for (let key in output_cache) {
      if (!seen[key]) {
        delete output_cache[key];
      }
    }
    done();
  }

  function prepproc(job, done) {
    pngAllocTempReset();
    let img_file = job.getFile();

    let base_name = path.basename(img_file.relative);
    let ext = path.extname(img_file.relative);
    if (ext === '.yaml') {
      if (base_name === 'atlas.yaml') {
        // config file, just pass through
        job.out(img_file);
      }
      // otherwise, presumably matches a .png, will be handled when the prep the png
      return void done();
    }
    assert(ext === '.png');
    let config_name = `${img_file.relative.slice(0, -ext.length)}.yaml`;
    job.depAdd(config_name, function (err, depfile) {
      if (err) {
        // presumably config file doesn't exist, that's fine, pass the image through
        job.out(img_file);
        return void done();
      }

      let { err: img_err, img } = pngRead(img_file.contents);
      if (img_err) {
        job.error(img_file, `Error reading ${img_file.relative}: ${img_err}`);
        return void done();
      }

      assert(depfile.contents);
      let config_data;
      try {
        config_data = yaml.load(depfile.contents.toString('utf8')) || {};
      } catch (err) {
        job.error(depfile, `Error parsing ${depfile.relative}: ${err}`);
        return void done();
      }
      let { tile_res, tiles_per_row, tiles } = config_data;
      if (!tiles) {
        job.error(depfile, 'Config file missing "tiles" member');
        return void done();
      }

      if (!tiles_per_row && tile_res) {
        tiles_per_row = floor(img.width / tile_res);
      }
      for (let key in tiles) {
        let tile_def = tiles[key];
        let source;
        if (typeof tile_def === 'number') {
          if (!tile_res) {
            job.error(depfile, `Tile "${key}" specifies numerical tile, but config missing "tile_res"`);
            continue;
          }
          source = [(tile_def % tiles_per_row) * tile_res, floor(tile_def / tiles_per_row) * tile_res, tile_res, tile_res];
        } else if (Array.isArray(tile_def) && tile_def.length === 2) {
          if (!tile_res) {
            job.error(depfile, `Tile "${key}" specifies [x,y] without w,h, but config missing "tile_res"`);
            continue;
          }
          source = [tile_def[0] * tile_res, tile_def[1] * tile_res, tile_res, tile_res];
        } else if (Array.isArray(tile_def) && tile_def.length === 4) {
          source = tile_def;
        } else {
          job.error(depfile, `Tile "${key}" specifies unrecognized definition of "${JSON.stringify(tile_def)}" (expected index, [x, y], or [x, y, w, h])`);
          continue;
        }
        let img_out = pngAllocTemp(
          source[2],
          source[3],
        );
        try {
          img.bitblt(img_out, source[0], source[1], source[2], source[3], 0, 0);
        } catch (err) {
          job.error(depfile, `${key}: Error copying image: "${err}"`);
          continue;
        }
        job.out({
          relative: `${path.dirname(img_file.relative)}/${key}.png`,
          contents: pngWrite(img_out),
        });
      }
      pngAllocTempReset();
      done();
    });
  }

  let { name, input } = opts;

  let prep_task = `${name}_prep`;
  gb.task({
    name: prep_task,
    type: gb.SINGLE,
    input: [
      `${input}/**/*.png`,
      `${input}/**/*.yaml`,
    ],
    func: prepproc,
  });

  return {
    name,
    type: gb.ALL,
    func: imgproc,
    input: [
      `${prep_task}:**`,
    ],
    version: [
      cmpFileKeys,
      parseRow,
      opts,
      ignore,
    ],
  };
};
