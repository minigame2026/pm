package com.cocos.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import com.cocos.lib.CocosHelper;
import com.cocos.lib.CocosJavascriptJavaBridge;
import com.minigame2026.dicepet.BuildConfig;
import com.tapsdk.tapad.*;
import org.json.JSONObject;

/** TapADN 5.3.0.4 bridge. All SDK access is on Android's main thread. */
public final class PMTapAds {
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static Activity activity;
    private static TapAdNative loader;
    private static Session current;
    private static final String POLICY = "https://ssp.dirichlet.cn/docs/agreement/";

    private static final class Session {
        final String id;
        TapRewardVideoAd ad;
        AlertDialog consent;
        boolean closed, verified, verificationReceived, shown;
        Runnable timeout;
        Session(String id) { this.id = id; }
    }
    public static void attach(Activity host) { activity = host; }
    public static void detach(Activity host) {
        if (activity != host) return;
        if (current != null) finish(current, false, "destroyed");
        if (loader != null) { loader.dispose(); loader = null; }
        activity = null;
    }
    public static void show(String id, String placement) {
        MAIN.post(() -> begin(id, placement));
    }
    private static void begin(String id, String placement) {
        if (current != null) { send(id, false, "busy"); return; }
        if (activity == null || activity.isFinishing()) { send(id, false, "unavailable"); return; }
        final long space;
        try {
            if (BuildConfig.TAP_MEDIA_KEY.isEmpty() || Long.parseLong(BuildConfig.TAP_MEDIA_ID) <= 0)
                throw new IllegalArgumentException();
            if (!placement.equals("stamina_10") && !placement.equals("hatch_reduce_30m") && !placement.equals("breed_reduce_30m") && !placement.equals("encounter_reroll"))
                throw new IllegalArgumentException();
            JSONObject placements = new JSONObject(BuildConfig.TAP_PLACEMENTS);
            // Breeding reuses the configured incubation rewarded unit unless explicitly overridden.
            space = placements.optLong(placement, placement.equals("breed_reduce_30m") ? placements.optLong("hatch_reduce_30m", 0) : 0);
            if (space <= 0) throw new IllegalArgumentException();
        } catch (Exception e) { send(id, false, "not-configured"); return; }
        Session s = new Session(id); current = s;
        armTimeout(s, 300000);
        // Consent is requested for this voluntary viewing session; declining does not block play.
        s.consent = new AlertDialog.Builder(activity).setTitle("观看激励广告")
            .setMessage("广告由 TapADN（上海艾得蒽数字科技有限公司）提供，用于广告展示、效果统计与反作弊，涉及设备基本信息、网络信息与广告交互记录。查看隐私政策后，可选择同意观看。")
            .setPositiveButton("同意并观看", (dialog, which) -> load(s, space))
            .setNegativeButton("暂不观看", (dialog, which) -> finish(s, false, "cancelled"))
            .setNeutralButton("隐私政策", (dialog, which) -> {
                finish(s, false, "policy");
                try { activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(POLICY))); } catch (Exception ignored) {}
            })
            .setOnCancelListener(dialog -> finish(s, false, "cancelled")).show();
    }
    private static void load(Session s, long space) {
        if (current != s) return;
        try {
            if (!TapAdSdk.isInitialized()) {
                TapAdSdk.init(activity.getApplicationContext(), new TapAdConfig.Builder()
                    .withMediaId(Long.parseLong(BuildConfig.TAP_MEDIA_ID))
                    .withMediaName(BuildConfig.TAP_MEDIA_NAME).withMediaKey(BuildConfig.TAP_MEDIA_KEY)
                    .enableDebug(false).shakeEnabled(false).withCustomController(new TapAdCustomController() {
                        @Override public boolean isCanUseLocation() { return false; }
                        @Override public boolean isCanUsePhoneState() { return false; }
                        @Override public boolean isCanUseWifiState() { return false; }
                        @Override public boolean isCanUsePhoneMacAddress() { return false; }
                        @Override public boolean isCanUseBssid() { return false; }
                        @Override public boolean isCanUseSsid() { return false; }
                        @Override public boolean isCanUseSensor() { return false; }
                        @Override public boolean isCanUseWriteExternal() { return false; }
                        @Override public boolean isCanUseOaid() { return false; }
                        @Override public boolean alist() { return false; }
                        @Override public boolean isCanUseAndroidId() { return false; }
                    }).build());
            }
            if (loader == null) loader = TapAdManager.get().createAdNative(activity);
            armTimeout(s, 30000);
            loader.loadRewardVideoAd(new AdRequest.Builder().withSpaceId(space).build(), new TapAdNative.RewardVideoAdListener() {
                @Override public void onError(int code, String message) { MAIN.post(() -> finish(s, false, "load-error-" + code)); }
                @Override public void onRewardVideoAdLoad(TapRewardVideoAd ad) {
                    MAIN.post(() -> { if (current == s) s.ad = ad; else ad.dispose(); });
                }
                @Override public void onRewardVideoCached(TapRewardVideoAd ad) { MAIN.post(() -> display(s, ad)); }
            });
        } catch (Exception e) { finish(s, false, "sdk-error"); }
    }
    private static void display(Session s, TapRewardVideoAd ad) {
        if (current != s) { ad.dispose(); return; }
        if (s.shown) return;
        s.ad = ad;
        if (!ad.isValid() || activity == null) { finish(s, false, "invalid"); return; }
        s.shown = true;
        armTimeout(s, 300000);
        ad.setRewardAdInteractionListener(new TapRewardVideoAd.RewardAdInteractionListener() {
            @Override public void onAdShow(TapRewardVideoAd a) {}
            @Override public void onAdValidShow(TapRewardVideoAd a) {}
            @Override public void onAdClick(TapRewardVideoAd a) {}
            @Override public void onVideoComplete(TapRewardVideoAd a) {} // Not reward authorization.
            @Override public void onSkippedVideo(TapRewardVideoAd a) { MAIN.post(() -> { s.verified = false; s.verificationReceived = true; }); }
            @Override public void onVideoError(TapRewardVideoAd a) { MAIN.post(() -> finish(s, false, "video-error")); }
            @Override public void onAdClose(TapRewardVideoAd a) {
                MAIN.post(() -> {
                    if (current != s) return;
                    s.closed = true;
                    if (s.verificationReceived) finish(s, s.verified, s.verified ? "completed" : "cancelled");
                    else armTimeout(s, 3000); // Allow close/verification callbacks in either order.
                });
            }
            @Override public void onRewardVerify(TapRewardVideoAd a, boolean valid, int amount, String name, int code, String message) {
                MAIN.post(() -> {
                    if (current != s || s.verificationReceived) return;
                    s.verificationReceived = true; s.verified = valid;
                    if (s.closed) finish(s, valid, valid ? "completed" : "verification-failed");
                });
            }
        });
        try { ad.showRewardVideoAd(activity); } catch (Exception e) { finish(s, false, "show-error"); }
    }
    private static void armTimeout(Session s, long ms) {
        if (s.timeout != null) MAIN.removeCallbacks(s.timeout);
        s.timeout = () -> finish(s, false, "timeout");
        MAIN.postDelayed(s.timeout, ms);
    }
    private static void finish(Session s, boolean completed, String reason) {
        if (current != s) return;
        current = null;
        if (s.timeout != null) MAIN.removeCallbacks(s.timeout);
        if (s.consent != null) { s.consent.dismiss(); s.consent = null; }
        if (s.ad != null) { s.ad.dispose(); s.ad = null; }
        send(s.id, completed, reason);
    }
    private static void send(String id, boolean completed, String reason) {
        String script = "globalThis.__pmTapAdResult && globalThis.__pmTapAdResult("
            + JSONObject.quote(id) + "," + completed + "," + JSONObject.quote(reason) + ");";
        CocosHelper.runOnGameThread(() -> CocosJavascriptJavaBridge.evalString(script));
    }
}
