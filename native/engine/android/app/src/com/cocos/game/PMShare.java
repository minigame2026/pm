package com.cocos.game;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.cocos.lib.CocosHelper;
import com.cocos.lib.CocosJavascriptJavaBridge;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import java.io.File;
import java.io.InputStream;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import org.json.JSONObject;

/** Offline postcards: user-selected images only; no delivery or attribution tracking. */
public final class PMShare {
    private static WeakReference<Activity> activity = new WeakReference<>(null);
    private static String pending = "", request = "";
    private static final int PICK_IMAGE = 5812;
    private static final int SAVE_IMAGE = 5813;
    private static String saveKey = "", savePath = "";
    public static void attach(Activity value) { activity = new WeakReference<>(value); acceptIntent(value.getIntent()); }
    public static void detach(Activity value) { if (activity.get() == value) activity.clear(); }
    public static synchronized void acceptIntent(Intent intent) {
        if (intent == null) return;
        String value = null;
        Uri uri = intent.getData();
        if (uri != null && "dicepet".equals(uri.getScheme()) && "postcard".equals(uri.getHost())) value = uri.getQueryParameter("code");
        if (value != null && value.length() <= 4096) pending = value;
    }
    public static synchronized String consumeIncoming() { String value = pending; pending = ""; return value; }
    public static String imagePath() {
        Activity a = activity.get(); if (a == null) return "";
        File folder = new File(a.getCacheDir(), "pm-share");
        if (!folder.exists() && !folder.mkdirs()) return "";
        return new File(folder, "postcard.png").getAbsolutePath();
    }
    public static void share(String path, String text) {
        Activity a = activity.get(); if (a == null) throw new IllegalStateException("inactive");
        try {
            File file = new File(path).getCanonicalFile(), folder = new File(a.getCacheDir(), "pm-share").getCanonicalFile();
            if (!file.getParentFile().equals(folder) || !file.isFile()) throw new IllegalArgumentException("postcard");
            Uri uri = FileProvider.getUriForFile(a, a.getPackageName() + ".postcards", file);
            Intent intent = new Intent(Intent.ACTION_SEND).setType("image/png");
            intent.putExtra(Intent.EXTRA_STREAM, uri).putExtra(Intent.EXTRA_TEXT, text);
            intent.setClipData(ClipData.newRawUri("Postcard", uri));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            a.runOnUiThread(() -> { try { a.startActivity(Intent.createChooser(intent, "")); } catch (RuntimeException ignored) { } });
        } catch (java.io.IOException e) { throw new IllegalArgumentException("postcard", e); }
    }
    public static void copy(String value) {
        Activity a = activity.get(); if (a != null) a.runOnUiThread(() -> ((ClipboardManager)a.getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("Postcard", value)));
    }
    public static String paste() {
        Activity a = activity.get(); if (a == null) return "";
        ClipboardManager clipboard = (ClipboardManager)a.getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData data = clipboard.getPrimaryClip();
        return data == null || data.getItemCount() == 0 ? "" : data.getItemAt(0).coerceToText(a).toString();
    }
    public static void pickImage(String key) {
        Activity a = activity.get(); if (a == null) throw new IllegalStateException("inactive");
        request = key;
        a.runOnUiThread(() -> { try { a.startActivityForResult(new Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE), PICK_IMAGE); } catch (RuntimeException e) { answer(key, ""); } });
    }
    public static void saveImage(String path, String key) {
        Activity a = activity.get(); if (a == null) throw new IllegalStateException("inactive");
        if (!path.equals(imagePath())) throw new IllegalArgumentException("postcard");
        saveKey = key; savePath = path;
        a.runOnUiThread(() -> { try { a.startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("image/png").putExtra(Intent.EXTRA_TITLE, "Dice-Pet-Postcard.png"), SAVE_IMAGE); } catch (RuntimeException e) { saved(key, false); } });
    }
    public static void onActivityResult(int code, int result, Intent data) {
        if (code == SAVE_IMAGE) {
            final Activity a = activity.get(); final String key = saveKey, path = savePath; saveKey = ""; savePath = "";
            if (a == null || result != Activity.RESULT_OK || data == null || data.getData() == null) { saved(key, false); return; }
            final Uri destination = data.getData();
            new Thread(() -> {
                boolean ok = false;
                try (InputStream in = new FileInputStream(path); OutputStream out = a.getContentResolver().openOutputStream(destination)) {
                    if (out == null) throw new IllegalStateException("output");
                    byte[] buffer = new byte[8192]; int count;
                    while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
                    out.flush(); ok = true;
                } catch (Exception ignored) { }
                saved(key, ok);
            }, "Save Postcard").start();
            return;
        }
        if (code != PICK_IMAGE) return;
        final String key = request; request = "";
        final Activity a = activity.get();
        if (result != Activity.RESULT_OK || data == null || data.getData() == null || a == null) { answer(key, ""); return; }
        final Uri uri = data.getData();
        new Thread(() -> {
            String value = ""; Bitmap bitmap = null;
            try {
                BitmapFactory.Options bounds = new BitmapFactory.Options(); bounds.inJustDecodeBounds = true;
                try (InputStream in = a.getContentResolver().openInputStream(uri)) { BitmapFactory.decodeStream(in, null, bounds); }
                if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw new IllegalArgumentException("image");
                BitmapFactory.Options options = new BitmapFactory.Options(); options.inSampleSize = 1;
                while (Math.max(bounds.outWidth, bounds.outHeight) / options.inSampleSize > 1800) options.inSampleSize *= 2;
                try (InputStream in = a.getContentResolver().openInputStream(uri)) { bitmap = BitmapFactory.decodeStream(in, null, options); }
                if (bitmap != null) {
                    int w = bitmap.getWidth(), h = bitmap.getHeight(); int[] pixels = new int[w * h]; bitmap.getPixels(pixels, 0, w, 0, 0, w, h);
                    value = new MultiFormatReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(w, h, pixels)))).getText();
                    if (value.length() > 4096) value = "";
                }
            } catch (Exception ignored) { } finally { if (bitmap != null) bitmap.recycle(); }
            answer(key, value);
        }, "Postcard QR").start();
    }
    private static void answer(String key, String value) {
        CocosHelper.runOnGameThread(() -> CocosJavascriptJavaBridge.evalString("globalThis.__pmImageCode && globalThis.__pmImageCode(" + JSONObject.quote(key) + "," + JSONObject.quote(value) + ")"));
    }
    private static void saved(String key, boolean ok) {
        CocosHelper.runOnGameThread(() -> CocosJavascriptJavaBridge.evalString("globalThis.__pmSaveCard && globalThis.__pmSaveCard(" + JSONObject.quote(key) + "," + ok + ")"));
    }
}
