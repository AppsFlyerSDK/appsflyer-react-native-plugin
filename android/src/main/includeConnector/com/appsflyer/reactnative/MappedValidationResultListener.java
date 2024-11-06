package com.appsflyer.reactnative;

import com.appsflyer.api.PurchaseClient;
import java.util.Map;

public interface MappedValidationResultListener extends PurchaseClient.ValidationResultListener<Map<String, Object>> {
    void onResponse(Map<String, Object> response);
    void onFailure(String result, Throwable error);
}