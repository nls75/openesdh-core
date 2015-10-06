package dk.openesdh.repo.services.system;

import java.util.Iterator;
import org.json.JSONException;
import org.json.JSONObject;
import org.mozilla.javascript.NativeObject;

public class MultiLanguageValue extends NativeObject {

    /**
     * JSON format must match<br>
     * { en: englishName, da: danishName } - any number of translations "language: value"
     *
     * @param json<br>
     * @return
     * @throws JSONException
     */
    public static MultiLanguageValue createFromJSONString(String json) throws JSONException {
        JSONObject mlNamesJSON = new JSONObject(json);
        MultiLanguageValue mlNames = new MultiLanguageValue();
        Iterator keys = mlNamesJSON.keys();
        while (keys.hasNext()) {
            String lang = (String) keys.next();
            mlNames.defineProperty(lang, mlNamesJSON.getString(lang), NativeObject.PERMANENT);
        }
        return mlNames;
    }

    /**
     * @return JSON: { en: englishName, da: danishName } - any number of translations "language: value"
     * @throws org.json.JSONException
     */
    public JSONObject toJSONArray() throws JSONException {
        JSONObject json = new JSONObject();
        for (Entry<Object, Object> entry : entrySet()) {
            json.put(entry.getKey().toString(), entry.getValue().toString());
        }
        return json;
    }
}