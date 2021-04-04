import android.content.Context;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import com.appsflyer.AppsFlyerLib;
import com.appsflyer.AppsFlyerLibCore;
import com.appsflyer.reactnative.RNAppsFlyerModule;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;

import java.lang.reflect.Field;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@RunWith(AndroidJUnit4.class)
public class PluginNativeTests {
//    AppsFlyerLibCore afLib;


    private Context context = ApplicationProvider.getApplicationContext();
    private ReactApplicationContext RNContext = new ReactApplicationContext(context);
    private RNAppsFlyerModule appsFlyer = new RNAppsFlyerModule(RNContext);

    @Test
    public void onePlusOneIsTwo() {
        Assert.assertEquals(1 + 1, 2);
    }


    @Test
    public void setUserEmails() {
        AppsFlyerLibCore afLib = mock(AppsFlyerLibCore.class);
        when(afLib.getAppsFlyerUID(context)).thenReturn("lala");
        Callback success = new Callback() {
            @Override
            public void invoke(Object... args) {
                for (int i = 0; i < args.length; i++) {
                    System.out.print(args[i] + "\n");
                }
                Assert.assertEquals("aaa", args[1]);
            }
        };
        appsFlyer.getAppsFlyerUID(success);
    }
}
