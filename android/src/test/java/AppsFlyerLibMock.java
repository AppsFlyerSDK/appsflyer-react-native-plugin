import android.app.Activity;
import android.content.Context;

import androidx.annotation.NonNull;

import com.appsflyer.AFLogger;
import com.appsflyer.AppsFlyerConversionListener;
import com.appsflyer.AppsFlyerInAppPurchaseValidatorListener;
import com.appsflyer.AppsFlyerLib;
import com.appsflyer.AppsFlyerProperties;
import com.appsflyer.attribution.AppsFlyerRequestListener;
import com.appsflyer.deeplink.DeepLinkListener;

import java.net.URI;
import java.util.Map;

public class AppsFlyerLibMock extends AppsFlyerLib {
    @Override
    public void stop(boolean b, Context context) {

    }

    @Override
    public String getSdkVersion() {
        return "version";
    }

    @Override
    public void onPause(Context context) {

    }

    @Override
    public void updateServerUninstallToken(Context context, String s) {

    }

    @Override
    public void setDebugLog(boolean b) {

    }

    @Override
    public void setImeiData(String s) {

    }

    @Override
    public void setOaidData(String s) {

    }

    @Override
    public void setAndroidIdData(String s) {

    }

    @Override
    public AppsFlyerLib enableLocationCollection(boolean b) {
        return null;
    }

    @Override
    public void setCustomerUserId(String s) {

    }

    @Override
    public void setPhoneNumber(String s) {

    }

    @Override
    public void waitForCustomerUserId(boolean b) {

    }

    @Override
    public void setCustomerIdAndLogSession(String s, @NonNull Context context) {

    }

    @Override
    public String getOutOfStore(Context context) {
        return "null";
    }

    @Override
    public void setOutOfStore(String s) {

    }

    @Override
    public void setAppInviteOneLink(String s) {

    }

    @Override
    public void setAdditionalData(Map<String, Object> map) {

    }

    @Override
    public void sendPushNotificationData(Activity activity) {

    }

    @Override
    public void setUserEmails(String... strings) {

    }

    @Override
    public void setUserEmails(AppsFlyerProperties.EmailsCryptType emailsCryptType, String... strings) {

    }

    @Override
    public void setCollectAndroidID(boolean b) {

    }

    @Override
    public void setCollectIMEI(boolean b) {

    }

    @Override
    public void setCollectOaid(boolean b) {

    }

    @Override
    public void setResolveDeepLinkURLs(String... strings) {

    }

    @Override
    public void setOneLinkCustomDomain(String... strings) {

    }

    @Override
    public AppsFlyerLib init(@NonNull String s, AppsFlyerConversionListener appsFlyerConversionListener, @NonNull Context context) {
        System.out.println("init works!"+ " : "+ s);
        return this;
    }

    @Override
    public void start(@NonNull Context context) {

    }

    @Override
    public void start(@NonNull Context context, String s) {
    }

    @Override
    public void start(@NonNull Context context, String s, AppsFlyerRequestListener appsFlyerRequestListener) {

    }

    @Override
    public void setAppId(String s) {

    }

    @Override
    public void setExtension(String s) {

    }

    @Override
    public void setIsUpdate(boolean b) {

    }

    @Override
    public void setCurrencyCode(String s) {

    }

    @Override
    public void logLocation(Context context, double v, double v1) {

    }

    @Override
    public void logSession(Context context) {

    }

    @Override
    public void logEvent(Context context, String s, Map<String, Object> map) {

    }

    @Override
    public void sendAdRevenue(Context context, Map<String, Object> map) {

    }

    @Override
    public void logEvent(@NonNull Context context, String s, Map<String, Object> map, AppsFlyerRequestListener appsFlyerRequestListener) {

    }

    @Override
    public void anonymizeUser(boolean b) {

    }

    @Override
    public void enableFacebookDeferredApplinks(boolean b) {

    }

    @Override
    public void registerConversionListener(Context context, AppsFlyerConversionListener appsFlyerConversionListener) {

    }

    @Override
    public void unregisterConversionListener() {

    }

    @Override
    public void registerValidatorListener(Context context, AppsFlyerInAppPurchaseValidatorListener appsFlyerInAppPurchaseValidatorListener) {

    }

    @Override
    public void setPreinstallAttribution(String s, String s1, String s2) {

    }

    @Override
    public boolean isPreInstalledApp(Context context) {
        return false;
    }

    @Override
    public String getAttributionId(Context context) {
        return null;
    }

    @Override
    public String getAppsFlyerUID(Context context) {
        return "lalal";
    }

    @Override
    public void validateAndLogInAppPurchase(Context context, String s, String s1, String s2, String s3, String s4, Map<String, String> map) {

    }

    @Override
    public boolean isStopped() {
        return false;
    }

    @Override
    public void setMinTimeBetweenSessions(int i) {

    }

    @Override
    public void setLogLevel(AFLogger.LogLevel logLevel) {

    }

    @Override
    public void setHost(String s, String s1) {

    }

    @Override
    public String getHostName() {
        return null;
    }

    @Override
    public String getHostPrefix() {
        return null;
    }

    @Override
    public void performOnAppAttribution(@NonNull Context context, @NonNull URI uri) {

    }

    @Override
    public void setSharingFilter(@NonNull String... strings) {

    }

    @Override
    public void setSharingFilterForAllPartners() {

    }

    @Override
    public void appendParametersToDeepLinkingURL(String s, Map<String, String> map) {

    }

    @Override
    public void subscribeForDeepLink(DeepLinkListener deepLinkListener) {

    }

    @Override
    public void subscribeForDeepLink(DeepLinkListener deepLinkListener, long l) {

    }

    @Override
    public void addPushNotificationDeepLinkPath(String... strings) {

    }

    @Override
    public void setPartnerData(@NonNull String s, Map<String, Object> map) {

    }
}
