package dk.openesdh.repo.webscripts.cases;

import dk.openesdh.repo.services.CaseService;
import dk.openesdh.repo.services.NodeInfoService;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.extensions.webscripts.AbstractWebScript;
import org.springframework.extensions.webscripts.WebScriptRequest;
import org.springframework.extensions.webscripts.WebScriptResponse;

import java.io.IOException;
import java.io.Serializable;
import java.util.Map;

/**
 * Created by torben on 11/09/14.
 */
public class Journalize extends AbstractWebScript {

    private CaseService caseService;

    public void setCaseService(CaseService caseService) {
        this.caseService = caseService;
    }

    @Override
    public void execute(WebScriptRequest req, WebScriptResponse res) throws IOException {
        NodeRef caseNodeRef = new NodeRef(req.getParameter("nodeRef"));
        NodeRef journalKey = new NodeRef(req.getParameter("journalKey"));

        caseService.journalize(caseNodeRef, journalKey);

        JSONObject json = new JSONObject();
        try {
            json.put("Result", "Success");
            json.write(res.getWriter());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }


}