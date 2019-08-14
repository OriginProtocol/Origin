package com.origincatcher;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.reactnative.androidsdk.FBSDKPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.bitgo.randombytes.RandomBytesPackage;
import fr.bamlab.rnimageresizer.ImageResizerPackage;
import com.imagepicker.ImagePickerPackage;
import com.reactcommunity.rnlocalize.RNLocalizePackage;
import com.levelasquez.androidopensettings.AndroidOpenSettingsPackage;
import com.rnfingerprint.FingerprintAuthPackage;
import com.bebnev.RNUserAgentPackage;
import io.sentry.RNSentryPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.facebook.appevents.AppEventsLogger;
import com.facebook.CallbackManager;
import android.content.Intent;     // <--- import
import android.os.Bundle;


import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private static CallbackManager mCallbackManager = CallbackManager.Factory.create();

  protected static CallbackManager getCallbackManager() {
    return mCallbackManager;
  }

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      mCallbackManager = new CallbackManager.Factory().create();
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
          new FBSDKPackage(mCallbackManager),
          new RNDeviceInfo(),
          new RandomBytesPackage(),
          new ImageResizerPackage(),
          new ImagePickerPackage(),
          new RNLocalizePackage(),
          new AndroidOpenSettingsPackage(),
          new FingerprintAuthPackage(),
          new RNUserAgentPackage(),
          new RNSentryPackage(),
          new RNGestureHandlerPackage(),
          new ReactNativePushNotificationPackage(),
          new RNCWebViewPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    AppEventsLogger.activateApp(this);
  }
}
