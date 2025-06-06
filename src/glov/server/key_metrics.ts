import type { TSMap } from 'glov/common/types';
import { empty } from 'glov/common/util';
import { logCategoryEnabled } from './log';
import { MetricFreq, metricsAdd } from './metrics';
import { UserTimeAccumulator } from './usertime';


const TICK_TIME = 10000; // Moderate frequency reporting to metrics
const LOG_TIME = 60000; // Much less frequent (long retention) logging (if enabled in server config)

let usertime: UserTimeAccumulator;
let accum: TSMap<number> = {};
let last_log_time: number;

export function keyMetricsAdd(metric: string, value: number, freq: MetricFreq): void {
  metricsAdd(metric, value, freq);
  if (logCategoryEnabled('load')) {
    accum[metric] = (accum[metric] || 0) + value;
  }
}

export function keyMetricsAddTagged(metric: string, tags: string | string[], value: number, freq: MetricFreq): void {
  keyMetricsAdd(metric, value, freq);
  if (typeof tags === 'string') {
    tags = tags ? tags.split(',') : [];
  }
  for (let ii = 0; ii < tags.length; ++ii) {
    keyMetricsAdd(`${metric}.${tags[ii]}`, value, freq);
  }
}

export function usertimeStart(tags: string): void {
  usertime.start(tags);
}

export function usertimeEnd(tags: string): void {
  usertime.end(tags);
}

let accumulators: UserTimeAccumulator[] = [];
export function keyMetricsAccumulatorCreate(metric_name: string): UserTimeAccumulator {
  let accumulator = new UserTimeAccumulator(metric_name, keyMetricsAdd);
  accumulators.push(accumulator);
  return accumulator;
}

function keyMetricsTickInternal(): void {
  for (let ii = 0; ii < accumulators.length; ++ii) {
    accumulators[ii].tick();
  }

  if (logCategoryEnabled('load')) {
    let now = Date.now();
    let time_since_log = now - last_log_time;
    if (time_since_log >= LOG_TIME) {
      last_log_time = now;
      if (!empty(accum)) {
        console.log('key_metrics', accum);
      }
      accum = {};
    }
  }
}

export function keyMetricsTick(): void {
  keyMetricsTickInternal();
  setTimeout(keyMetricsTick, TICK_TIME);
}

export function keyMetricsFlush(): void {
  keyMetricsTickInternal();
}

export function keyMetricsStartup(): void {
  last_log_time = Date.now();
  usertime = keyMetricsAccumulatorCreate('usertime');
  setTimeout(keyMetricsTick, TICK_TIME);
}
