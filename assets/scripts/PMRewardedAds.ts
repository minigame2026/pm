import { native, sys } from 'cc';
import { TAP_MINI_AD_UNITS } from './TapAdConfig';

export const AD_PLACEMENTS = ['stamina_10', 'hatch_reduce_30m', 'breed_reduce_30m', 'encounter_reroll'] as const;
type Result = { completed: boolean; reason?: string };
type Host = Record<string, any>;

/** Only platform completion callbacks authorize rewards; gameplay owns the actual grant. */
export function installRewardedAds(host: Host = globalThis as any,
  android = sys.isNative && sys.os === sys.OS.ANDROID,
  invoke = (id: string, placement: string) => native.reflection.callStaticMethod(
    'com/cocos/game/PMTapAds', 'show', '(Ljava/lang/String;Ljava/lang/String;)V', id, placement),
  units: Record<string, string> = TAP_MINI_AD_UNITS) {
  if (host.pmRewardedAd) return;
  if (!android && typeof host.tap?.createRewardedVideoAd !== 'function') return;
  let serial = 0;
  let current: { id: string; finish: (result: Result) => void } | null = null;
  if (android) host.__pmTapAdResult = (id: string, completed: boolean, reason: string) => {
    if (current?.id === id) current.finish({ completed: completed === true, reason });
  };
  host.pmRewardedAd = {
    show({ placement }: { placement: string }): Promise<Result> {
      if (!(AD_PLACEMENTS as readonly string[]).includes(placement))
        return Promise.resolve({ completed: false, reason: 'unknown-placement' });
      if (current) return Promise.resolve({ completed: false, reason: 'busy' });
      return new Promise(resolve => {
        const id = String(++serial);
        let ad: any, done = false;
        let timer: ReturnType<typeof setTimeout>;
        const finish = (result: Result) => {
          if (done) return;
          done = true; clearTimeout(timer);
          try { ad?.offClose(close); ad?.offError(error); ad?.destroy(); } catch {}
          current = null; resolve(result);
        };
        const close = (res: any) => finish({ completed: res?.isEnded === true, reason: res?.isEnded === true ? 'completed' : 'cancelled' });
        const error = () => finish({ completed: false, reason: 'unavailable' });
        current = { id, finish };
        // Bounds missing callbacks too. A timeout never grants a reward.
        timer = setTimeout(() => finish({ completed: false, reason: 'timeout' }), android ? 360000 : 30000);
        try {
          if (android) { invoke(id, placement); return; }
          const adUnitId = units[placement];
          if (!adUnitId) { finish({ completed: false, reason: 'not-configured' }); return; }
          // Isolated instance prevents late events from a previous placement granting this one.
          ad = host.tap.createRewardedVideoAd({ adUnitId, multiton: true });
          ad.onClose(close); ad.onError(error);
          Promise.resolve(ad.load()).then(() => {
            if (done) return;
            clearTimeout(timer);
            timer = setTimeout(() => finish({ completed: false, reason: 'timeout' }), 360000);
            return ad.show();
          }).catch(error);
        } catch { error(); }
      });
    }
  };
}
