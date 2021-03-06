package dk.openesdh.repo.webscripts.cases;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.namespace.QName;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.extensions.webscripts.WebScriptException;
import org.springframework.extensions.webscripts.WebScriptRequest;
import org.springframework.extensions.webscripts.WebScriptResponse;
import org.springframework.stereotype.Component;

import com.github.dynamicextensionsalfresco.webscripts.annotations.HttpMethod;
import com.github.dynamicextensionsalfresco.webscripts.annotations.RequestParam;
import com.github.dynamicextensionsalfresco.webscripts.annotations.Uri;
import com.github.dynamicextensionsalfresco.webscripts.annotations.WebScript;
import com.github.dynamicextensionsalfresco.webscripts.resolutions.Resolution;

import dk.openesdh.repo.services.cases.CaseService;
import dk.openesdh.repo.utils.Utils;
import dk.openesdh.repo.webscripts.utils.WebScriptUtils;

/**
 * Annotated webscript to replace: dk.openesdh.repo.modelCaseTypes
 *
 * @author lanre.
 */
@Component
@WebScript(families = {"Case Tools"}, description = "Return a list of all the case types on the system")
public class RegisteredCaseTypeGet {

    //<editor-fold desc="DescInjected services
    @Autowired
    private CaseService caseService;
    @Autowired
    private DictionaryService dictionaryService;
    //</editor-fold>

    @Uri(value = "/api/openesdh/casetypes", method = HttpMethod.GET, defaultFormat = "json")
    public Resolution get(@RequestParam(required = false) WebScriptRequest req, WebScriptResponse res) throws IOException {
        // build a json object
        JSONArray arr = new JSONArray();
        List<QName> types = new ArrayList<>(caseService.getRegisteredCaseTypes());
        types.stream().map(this::getCaseTypeJSONObj).forEach(arr::put);

        return WebScriptUtils.jsonResolution(arr);
    }

    private JSONObject getCaseTypeJSONObj(QName caseType) {
        try {
            return Utils.getCaseTypeJson(caseType, dictionaryService, caseService);
        } catch (JSONException ex) {
            throw new WebScriptException(ex.getMessage(), ex);
        }
    }
}
