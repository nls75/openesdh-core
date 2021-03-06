package dk.openesdh.repo.webscripts.activities;

import java.io.Serializable;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import org.alfresco.model.ContentModel;
import org.alfresco.query.PagingResults;
import org.alfresco.repo.domain.activities.ActivityFeedEntity;
import org.alfresco.rest.api.impl.Util;
import org.alfresco.rest.framework.resource.parameters.Paging;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.security.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import com.github.dynamicextensionsalfresco.webscripts.annotations.Authentication;
import com.github.dynamicextensionsalfresco.webscripts.annotations.AuthenticationType;
import com.github.dynamicextensionsalfresco.webscripts.annotations.HttpMethod;
import com.github.dynamicextensionsalfresco.webscripts.annotations.RequestParam;
import com.github.dynamicextensionsalfresco.webscripts.annotations.Uri;
import com.github.dynamicextensionsalfresco.webscripts.annotations.UriVariable;
import com.github.dynamicextensionsalfresco.webscripts.annotations.WebScript;
import com.github.dynamicextensionsalfresco.webscripts.resolutions.Resolution;

import dk.openesdh.repo.services.TransactionRunner;
import dk.openesdh.repo.services.activities.CaseActivityService;
import dk.openesdh.repo.webscripts.utils.WebScriptUtils;

@Component
@WebScript(description = "Retrieves information about case activities (notifications)", families = "Case Activities")
public class CaseActivityWebScript {

    @Autowired
    @Qualifier(CaseActivityService.BEAN_ID)
    private CaseActivityService caseActivityService;

    @Autowired
    private TransactionRunner tr;
    @Autowired
    @Qualifier("PersonService")
    private PersonService personService;
    @Autowired
    @Qualifier("NodeService")
    private NodeService nodeService;

    @Uri(value = "/api/openesdh/activities/feed", method = HttpMethod.GET, defaultFormat = "json")
    public Resolution getCurrentUserActivities(
            @RequestParam(required = false, defaultValue = "0") final Integer skipCount,
            @RequestParam(required = false, defaultValue = "" + Paging.DEFAULT_MAX_ITEMS) final Integer maxItems) {
        Paging paging = Paging.valueOf(skipCount, maxItems);
        PagingResults<ActivityFeedEntity> activities = caseActivityService.getCurrentUserActivities(Util
                .getPagingRequest(paging));
        return WebScriptUtils.jsonResolution(activities.getPage());
    }

    @Uri(value = "/api/openesdh/activities/feed/new/count", method = HttpMethod.GET, defaultFormat = "json")
    public Resolution countCurrentUserNewActivities() {
        int count = caseActivityService.countCurrentUserNewActivities();
        Map<String, Serializable> result = new HashMap<>();
        result.put("count", Integer.toString(count));
        return WebScriptUtils.jsonResolution(result);
    }

    @Uri(value = "/api/openesdh/activities/feed/last/read/id/{lastReadFeedId}", method = HttpMethod.POST, defaultFormat = "json")
    public Resolution setCurrentUserLastReadActivityFeedId(@UriVariable final String lastReadFeedId) {
        caseActivityService.setCurrentUserLastReadActivityFeedId(lastReadFeedId);
        return WebScriptUtils.jsonResolution(lastReadFeedId);
    }

    @Authentication(AuthenticationType.ADMIN)
    @Uri(value = "/api/openesdh/activities/feed/clear/{userName}", method = HttpMethod.PUT, defaultFormat = "json")
    public void clearUserEmailFeedId(@UriVariable("userName") String userName) throws SQLException {
        tr.runInTransaction(() -> {
            NodeRef person = personService.getPerson(userName);
            nodeService.setProperty(person, ContentModel.PROP_EMAIL_FEED_ID, "1");
            return null;
        });

    }
}
