import android.app.Activity;
import android.app.Application;

import com.appsflyer.AppsFlyerConversionListener;
import com.appsflyer.AppsFlyerLib;
import com.appsflyer.reactnative.RNAppsFlyerModule;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.PromiseImpl;
import com.facebook.react.bridge.ReactApplicationContext;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.junit.MockitoJUnitRunner;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.reflect.Whitebox;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

@RunWith(MockitoJUnitRunner.class)
public class PluginNativeTests {

    RNAppsFlyerModule appsFlyer;
    @Mock
    AppsFlyerLib appsFlyerLib;
    @Mock
    ReactApplicationContext RNContext;
    @Mock
    Application app;
    @Mock
    Activity activity;

    private Promise successPromise = new Promise() {
        @Override
        public void resolve(@Nullable Object value) {
            Assert.assertTrue(value instanceof String);
            Assert.assertEquals("Success", value);

        }

        @Override
        public void reject(String code, String message) {
            Assert.assertTrue(code instanceof String);
            Assert.assertEquals("No 'eventName' found or its empty", code);
        }

        @Override
        public void reject(String code, Throwable e) {

        }

        @Override
        public void reject(String code, String message, Throwable e) {

        }

        @Override
        public void reject(String message) {

        }

        @Override
        public void reject(Throwable reason) {

        }
    };

    @Before
    public void setup() throws Exception {
        Mockito.mockStatic(AppsFlyerLib.class).when(AppsFlyerLib::getInstance).thenReturn(appsFlyerLib);
        Mockito.when(RNContext.getApplicationContext()).thenReturn(app);
        PowerMockito.when(RNContext, "getCurrentActivity").thenReturn(activity);
        appsFlyer = new RNAppsFlyerModule(RNContext);
    }

    @After
    public void teardown() {
        Mockito.framework().clearInlineMocks();
    }

    @Test
    public void noDevKeyFailure() {
        Callback failure = args -> {
            Assert.assertTrue(args[0] instanceof String);
            Assert.assertEquals("No 'devKey' found or its empty", args[0]);
        };

        Map<String, Object> noDevKeyMap = new HashMap<>();
        noDevKeyMap.put("devKey", "");
        MockMap map = new MockMap(noDevKeyMap);
        appsFlyer.initSdkWithCallBack(map, null, failure);
    }

    @Test
    public void devKeyIsntString() {
        Callback failure = args -> {
            Assert.assertEquals(null, args[0]);
        };

        Map<String, Object> noStringDevKeyMap = new HashMap<>();
        noStringDevKeyMap.put("devKey", 123);
        MockMap map = new MockMap(noStringDevKeyMap);
        appsFlyer.initSdkWithCallBack(map, null, failure);
    }

    @Test
    public void successInitSdk() {
        Callback success = args -> {
            Assert.assertTrue(args[0] instanceof String);
            Assert.assertEquals("Success", args[0]);
        };

        Callback failure = args -> {
            Assert.assertNotNull(args[0]);
            Assert.assertNotEquals("Failure", args[0]);
            System.out.println("failure: " + args[0]);
        };


        Map<String, Object> successMap = new HashMap<>();
        successMap.put("devKey", "xXxXxXx");
        successMap.put("isDebug", true);
        successMap.put("onInstallConversionDataListener", true);
        MockMap map = new MockMap(successMap);
        appsFlyer.initSdkWithCallBack(map, success, failure);
    }


    @Test
    public void geUID() {
        Mockito.when(AppsFlyerLib.getInstance().getAppsFlyerUID(any())).thenReturn("testUID");
        Callback cb = args -> {
            Assert.assertNull(args[0]);
            Assert.assertEquals("testUID", args[1]);
        };
        appsFlyer.getAppsFlyerUID(cb);
    }

    @Test
    public void noEventNameLogEvent() {
        Callback failure = args -> {
            Assert.assertTrue(args[0] instanceof String);
            Assert.assertEquals("No 'eventName' found or its empty", args[0]);
        };
        Map<String, Object> successMap = new HashMap<>();
        successMap.put("af_revenue", "12");
        MockMap map = new MockMap(successMap);
        String eventName = "";
        appsFlyer.logEvent(eventName, map, null, failure);
    }

    @Test
    public void successLogEventWithValues() {
        Callback success = args -> {
            Assert.assertTrue(args[0] instanceof String);
            Assert.assertEquals("Success", args[0]);
        };
        Mockito.doAnswer(new Answer() {
            @Override
            public Object answer(InvocationOnMock invocation) throws Throwable {
                success.invoke("Success");
                return null;
            }
        }).when(appsFlyerLib).logEvent(any(), anyString(), any(), any());
        Map<String, Object> successMap = new HashMap<>();
        successMap.put("af_revenue", "12");
        MockMap map = new MockMap(successMap);
        String eventName = "testEvent";
        appsFlyer.logEvent(eventName, map, success, null);
    }

    @Test
    public void successLogEventWithNoValues() {
        Callback success = args -> {
            Assert.assertTrue(args[0] instanceof String);
            Assert.assertEquals("Success", args[0]);
        };
        Mockito.doAnswer(new Answer() {
            @Override
            public Object answer(InvocationOnMock invocation) throws Throwable {
                success.invoke("Success");
                return null;
            }
        }).when(appsFlyerLib).logEvent(any(), anyString(), any(), any());
        String eventName = "testEvent";
        appsFlyer.logEvent(eventName, null, success, null);
    }

    @Test
    public void successLogEventWithValuesPromise() {
        Mockito.doAnswer(new Answer() {
            @Override
            public Object answer(InvocationOnMock invocation) throws Throwable {
                successPromise.resolve("Success");
                return null;
            }
        }).when(appsFlyerLib).logEvent(any(), anyString(), any(), any());
        Map<String, Object> successMap = new HashMap<>();
        successMap.put("af_revenue", "12");
        MockMap map = new MockMap(successMap);
        String eventName = "testEvent";
        appsFlyer.logEventWithPromise(eventName, map, successPromise);
    }

    @Test
    public void successLogEventWithNoValuesPromise() {
        Mockito.doAnswer(new Answer() {
            @Override
            public Object answer(InvocationOnMock invocation) throws Throwable {
                successPromise.resolve("Success");
                return null;
            }
        }).when(appsFlyerLib).logEvent(any(), anyString(), any(), any());
        String eventName = "testEvent";
        appsFlyer.logEventWithPromise(eventName, null, successPromise);
    }

    @Test
    public void failLogEventWithNoEventNamePromise() {
        String eventName = "testEvent";
        appsFlyer.logEventWithPromise(eventName, null, successPromise);
    }

    @Test
    public void handleSuccessTest() throws Exception {
        //not finished
        PowerMockito.when(appsFlyer, "sendEvent", any(), anyString(), any()).thenReturn("lala");
        Whitebox.invokeMethod(appsFlyer, "handleSuccess", "argument1", null, null);
    }
}