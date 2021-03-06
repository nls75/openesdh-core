package dk.openesdh.repo.webscripts.cases;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.alfresco.service.cmr.repository.NodeRef;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptException;
import org.springframework.extensions.webscripts.WebScriptRequest;
import org.springframework.stereotype.Component;

import com.github.dynamicextensionsalfresco.webscripts.annotations.Attribute;
import com.github.dynamicextensionsalfresco.webscripts.annotations.HttpMethod;
import com.github.dynamicextensionsalfresco.webscripts.annotations.Uri;
import com.github.dynamicextensionsalfresco.webscripts.annotations.UriVariable;
import com.github.dynamicextensionsalfresco.webscripts.annotations.WebScript;

import dk.openesdh.repo.services.cases.PartyService;
import dk.openesdh.repo.services.contacts.PartyRoleService;
import dk.openesdh.repo.services.documents.DocumentEmailService;
import dk.openesdh.repo.webscripts.WebScriptParams;
import dk.openesdh.repo.webscripts.utils.WebScriptUtils;

@Component
@WebScript(description = "Create an outgoing email", defaultFormat = "json", baseUri = "/api/openesdh/case", families = "Case Tools")
public class CaseEmailWebScript {

    @Autowired
    @Qualifier(DocumentEmailService.BEAN_ID)
    private DocumentEmailService documentEmailService;
    @Autowired
    @Qualifier(PartyService.BEAN_ID)
    private PartyService partyService;
    @Autowired
    @Qualifier("PartyRoleService")
    private PartyRoleService partyRoleService;

    @Uri(value = "/{caseId}/email", method = HttpMethod.POST)
    public void execute(
            @UriVariable(WebScriptParams.CASE_ID) final String caseId,
            @Attribute Params params) {
        if (params.to.isEmpty()) {
            throw new WebScriptException(Status.STATUS_BAD_REQUEST, "No recipients");
        }
        NodeRef memberRoleRef = partyRoleService.getClassifValueByName(PartyRoleService.MEMBER_ROLE).get()
                .getNodeRef();
        partyService.addCaseParty(caseId, memberRoleRef, params.contacts);
        documentEmailService.send(caseId, params.to, params.subject, params.text, params.attachments);
    }

    @Attribute
    public Params readJson(WebScriptRequest req) {
        JSONObject json = WebScriptUtils.readJson(req);
        JSONArray to = (JSONArray) json.get("to");
        JSONArray docs = (JSONArray) json.get("documents");
        return new Params(
                (Set<NodeRef>) to.stream().map(this::extractNodeRef).collect(Collectors.toSet()),
                (List<String>) to.stream().map(this::extractContactEmail).collect(Collectors.toList()),
                (String) json.get("subject"),
                (List<NodeRef>) docs.stream().map(this::toNodeRef).collect(Collectors.toList()),
                (String) json.get("message")
        );
    }

    public class Params {

        final Set<NodeRef> to;
        final List<String> contacts;
        final String subject;
        final List<NodeRef> attachments;
        final String text;

        public Params(Set<NodeRef> to, List<String> contacts, String subject, List<NodeRef> attachments, String text) {
            this.to = to;
            this.contacts = contacts;
            this.subject = subject;
            this.attachments = attachments;
            this.text = text;
        }
    }

    private NodeRef toNodeRef(Object o) {
        return new NodeRef((String) o);
    }

    private NodeRef extractNodeRef(Object o) {
        return new NodeRef((String) ((JSONObject) o).get("nodeRef"));
    }

    private String extractContactEmail(Object o) {
        return (String) ((JSONObject) o).get("email");
    }

}
