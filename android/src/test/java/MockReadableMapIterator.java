import com.facebook.react.bridge.ReadableMapKeySetIterator;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class MockReadableMapIterator implements ReadableMapKeySetIterator {
    private Map<String, Object> mMap;
    private Iterator<Map.Entry<String, Object>> it;

    public MockReadableMapIterator(Map<String, Object> map) {
        mMap = map;
        it = mMap.entrySet().iterator();
    }

    @Override
    public boolean hasNextKey() {
        return this.it.hasNext();
    }

    @Override
    public String nextKey() {
        return this.it.next().getKey();
    }
}
