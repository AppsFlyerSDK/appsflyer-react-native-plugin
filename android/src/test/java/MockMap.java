import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class MockMap implements ReadableMap {
    private Map<String, Object> mMap;
    private MockReadableMapIterator it;

    public MockMap(Map<String, Object> map) {
        this.mMap = map;
        this.it = new MockReadableMapIterator(map);
    }

    @Override
    public boolean hasKey(String name) {
        return false;
    }

    @Override
    public boolean isNull(String name) {
        return false;
    }

    @Override
    public boolean getBoolean(String name) {
        return (boolean) this.mMap.get(name);
    }

    @Override
    public double getDouble(String name) {
        return 0;
    }

    @Override
    public int getInt(String name) {
        return 0;
    }

    @Override
    public String getString(String name) {
        return (String) mMap.get(name);
    }

    @Override
    public ReadableArray getArray(String name) {
        return null;
    }

    @Override
    public ReadableMap getMap(String name) {
        return null;
    }

    @Override
    public ReadableType getType(String name) {
        Object value = this.mMap.get(name);
        if (value instanceof String) {
            return ReadableType.String;
        } else if (value instanceof Boolean) {
            return ReadableType.Boolean;
        } else if (value instanceof Integer || value instanceof Double) {
            return ReadableType.Number;
        }
        return ReadableType.String;
    }

    @Override
    public ReadableMapKeySetIterator keySetIterator() {
        return this.it;
    }

}
