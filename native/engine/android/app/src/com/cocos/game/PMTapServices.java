package com.cocos.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import com.cocos.lib.CocosHelper;
import com.cocos.lib.CocosJavascriptJavaBridge;
import com.minigame2026.dicepet.BuildConfig;
import com.taptap.sdk.core.*;
import com.taptap.sdk.initializer.api.TapInitCallback;
import com.taptap.sdk.initializer.api.model.ScreenOrientation;
import com.taptap.sdk.kit.internal.callback.TapTapCallback;
import com.taptap.sdk.kit.internal.exception.TapTapException;
import com.taptap.sdk.login.*;
import com.taptap.sdk.cloudsave.*;
import com.taptap.sdk.cloudsave.internal.TapCloudSaveRequestCallback;
import com.taptap.sdk.compliance.TapTapCompliance;
import com.taptap.sdk.compliance.option.TapTapComplianceOptions;
import org.json.*;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

/** Official TapSDK v4 bridge. Initialized only after the player's consent. */
public final class PMTapServices {
    private static final Handler MAIN=new Handler(Looper.getMainLooper());
    private static Activity activity;
    private static boolean initialized=false;
    private static boolean allowed=false, authenticating=false;
    private static String authRequest;
    private static AlertDialog restriction;
    public static void attach(Activity value){activity=value;}
    public static void detach(Activity value){if(activity==value){activity=null;allowed=false;authenticating=false;authRequest=null;if(restriction!=null){restriction.dismiss();restriction=null;}if(initialized)TapTapCompliance.exit();}}
    public static void resume(){
        if(initialized&&allowed&&!authenticating)MAIN.post(()->certify(null));
    }
    public static void request(String id,String op,String data){MAIN.post(()->{
        if(activity==null||activity.isFinishing()){send(id,false,null);return;}
        if(op.equals("login")){
            if(authRequest!=null||authenticating){send(id,false,null);return;}
            new AlertDialog.Builder(activity).setTitle("TapTap 登录与实名认证")
                .setMessage("本APP使用TapTap登录、实名认证及防沉迷服务。TapTap会处理账号标识、必要的设备/网络信息，并按其流程核验实名信息及游戏时长。游戏不自行收集身份证资料；仅在您主动上传时将进度保存至TapTap云端。认证通过后方可游玩，详情见隐私政策。")
                .setPositiveButton("同意并登录",(d,w)->initialize(id))
                .setNegativeButton("取消",(d,w)->send(id,false,null))
                .setNeutralButton("隐私政策",(d,w)->{
                    send(id,false,null);
                    activity.startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW,
                        android.net.Uri.parse("https://sites.google.com/view/dicepetspirits/privacy-policy")));
                }).setOnCancelListener(d->send(id,false,null)).show();
        }else if(!initialized||!allowed||TapTapLogin.getCurrentTapAccount()==null)send(id,false,null);
        else execute(id,op,data);
    });}
    private static void initialize(String id){
        if(initialized){login(id);return;}
        if(BuildConfig.TAP_CLIENT_ID.isEmpty()||BuildConfig.TAP_CLIENT_TOKEN.isEmpty()){send(id,false,null);return;}
        TapInitCallback callback=new TapInitCallback(){
            @Override public void onInitSuccess(){TapTapSdk.removeInitCallback(this);initialized=true;login(id);}
            @Override public void onInitFail(int code,@NonNull String message){TapTapSdk.removeInitCallback(this);send(id,false,null);}
        };
        try{
            TapTapSdk.addInitCallback(callback);
            TapTapSdkOptions options=new TapTapSdkOptions(BuildConfig.TAP_CLIENT_ID,BuildConfig.TAP_CLIENT_TOKEN,TapTapRegion.CN);
            options.setScreenOrientation(ScreenOrientation.PORTRAIT);options.setEnableLog(false);
            TapTapCompliance.registerComplianceCallback((code,extra)->MAIN.post(()->complianceResult(code)));
            TapTapSdk.init(activity.getApplicationContext(),options,new TapTapComplianceOptions(false,false));
        }catch(Exception e){TapTapSdk.removeInitCallback(callback);send(id,false,null);}
    }
    private static void login(String id){
        if(activity==null){send(id,false,null);return;}
        if(TapTapLogin.getCurrentTapAccount()!=null){certify(id);return;}
        TapTapLogin.loginWithScopes(activity,new String[]{"basic_info"},new TapTapCallback<TapTapAccount>(){
            @Override public void onSuccess(TapTapAccount account){certify(id);}
            @Override public void onFail(@NonNull TapTapException e){send(id,false,null);}
            @Override public void onCancel(){send(id,false,null);}
        });
    }
    private static void certify(String id){
        if(authenticating){if(id!=null)send(id,false,null);return;}
        TapTapAccount account=TapTapLogin.getCurrentTapAccount();
        if(activity==null||account==null){if(id!=null)send(id,false,null);return;}
        allowed=false;authenticating=true;authRequest=id;complianceEvent(0);
        try{TapTapCompliance.startup(activity,account.getOpenId());}
        catch(Exception e){complianceResult(1200);}
    }
    private static void complianceResult(int code){
        if(code==500&&!authenticating&&!allowed)return; // A late success cannot reopen a rejected session.
        allowed=code==500;authenticating=false;
        String id=authRequest;authRequest=null;complianceEvent(code);
        if(id!=null){
            try{send(id,allowed,new JSONObject().put("complianceCode",code));}catch(Exception e){send(id,false,null);}
        }
        if(allowed){if(restriction!=null){restriction.dismiss();restriction=null;}return;}
        if(activity==null||activity.isFinishing()||restriction!=null)return;
        String message=(code==1030||code==1050)?"当前不在允许游玩时段或可玩时长已用完。游戏进度已保留。":
            code==1100?"当前账号不满足游戏可玩年龄要求。游戏进度已保留。":"认证未完成或网络异常，暂不能进入游戏。请联网后重新认证。";
        restriction=new AlertDialog.Builder(activity).setTitle("实名认证与防沉迷").setMessage(message)
            .setCancelable(false).setPositiveButton("重新认证",(d,w)->{restriction=null;certify(null);})
            .setNegativeButton("退出游戏",(d,w)->{restriction=null;activity.finishAndRemoveTask();}).show();
    }
    private static void complianceEvent(int code){
        CocosHelper.runOnGameThread(()->CocosJavascriptJavaBridge.evalString(
            "globalThis.__pmTapComplianceResult&&globalThis.__pmTapComplianceResult("+code+")"));
    }
    private static void execute(String id,String op,String raw){
        try{
            JSONObject data=new JSONObject(raw);
            TapCloudSaveRequestCallback callback=new TapCloudSaveRequestCallback(){
                @Override public void onRequestError(int code,@NonNull String message){send(id,false,null);}
                @Override public void onArchiveListResult(@NonNull List<ArchiveData> archives){
                    JSONArray result=new JSONArray();
                    try{for(ArchiveData a:archives)result.put(new JSONObject().put("uuid",a.getUuid()).put("fileId",a.getFileId())
                        .put("name",a.getName()).put("summary",a.getSummary()).put("modifiedTime",a.getModifiedTime()));
                        send(id,true,result);
                    }catch(Exception e){send(id,false,null);}
                }
                @Override public void onArchiveDataResult(@NonNull byte[] bytes){
                    try{if(bytes.length>4000000)throw new IllegalArgumentException();send(id,true,new JSONObject().put("raw",new String(bytes,StandardCharsets.UTF_8)));}
                    catch(Exception e){send(id,false,null);}
                }
                @Override public void onArchiveCreated(@NonNull ArchiveData archive){send(id,true,new JSONObject());}
                @Override public void onArchiveUpdated(@NonNull ArchiveData archive){send(id,true,new JSONObject());}
                @Override public void onArchiveDeleted(@NonNull ArchiveData archive){send(id,false,null);}
                @Override public void onArchiveCoverResult(@NonNull byte[] bytes){send(id,false,null);}
            };
            if(op.equals("list"))TapTapCloudSave.getArchiveList(callback);
            else if(op.equals("download"))TapTapCloudSave.getArchiveData(data.getString("uuid"),data.getString("fileId"),callback);
            else if(op.equals("upload")){
                byte[] bytes=data.getString("raw").getBytes(StandardCharsets.UTF_8);if(bytes.length>4000000)throw new IllegalArgumentException();
                File file=new File(activity.getCacheDir(),"pm-cloud-"+id+".json");
                try(FileOutputStream stream=new FileOutputStream(file)){stream.write(bytes);}
                ArchiveMetadata meta=new ArchiveMetadata.Builder().setName("pm_save_v1").setSummary("Dice Pet progress").setExtra("pm-save-v1").setPlaytime(0).build();
                String uuid=data.optString("uuid");
                if(uuid.isEmpty())TapTapCloudSave.createArchive(meta,file.getAbsolutePath(),null,callback);
                else TapTapCloudSave.updateArchive(uuid,meta,file.getAbsolutePath(),null,callback);
            }else send(id,false,null);
        }catch(Exception e){send(id,false,null);}
    }
    private static void send(String id,boolean ok,Object result){
        String js="globalThis.__pmTapServiceResult&&globalThis.__pmTapServiceResult("+JSONObject.quote(id)+","+ok+","+(result==null?"null":result.toString())+")";
        CocosHelper.runOnGameThread(()->CocosJavascriptJavaBridge.evalString(js));
    }
}
