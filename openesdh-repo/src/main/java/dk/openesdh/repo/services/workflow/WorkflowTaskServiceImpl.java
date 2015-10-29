package dk.openesdh.repo.services.workflow;

import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.web.scripts.workflow.WorkflowModelBuilder;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.security.AuthenticationService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.PersonService;
import org.alfresco.service.cmr.workflow.WorkflowService;
import org.alfresco.service.cmr.workflow.WorkflowTask;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import dk.openesdh.repo.model.OpenESDHModel;
import dk.openesdh.repo.services.documents.DocumentService;

@Service
public class WorkflowTaskServiceImpl implements WorkflowTaskService {
    
    @Autowired
    @Qualifier("WorkflowService")
    private WorkflowService workflowService;
    @Autowired
    private NamespaceService namespaceService;
    @Autowired
    private NodeService nodeService;
    @Autowired
    private PersonService personService;
    @Autowired
    private DictionaryService dictionaryService;
    @Autowired
    private AuthenticationService authenticationService;
    @Autowired
    private AuthorityService authorityService;
    @Autowired
    private DocumentService documentService;

    @Override
    public Map<String, Object> getWorkflowTask(String taskId) {
        WorkflowTask task = workflowService.getTaskById(taskId);
        return getTaskDataMap(task);
    }

    protected Map<String, Object> getTaskDataMap(WorkflowTask task) {
        WorkflowModelBuilder modelBuilder = new WorkflowModelBuilder(namespaceService, nodeService,
                authenticationService, personService, workflowService, dictionaryService);
        Map<String, Object> taskMap = modelBuilder.buildSimple(task, null);

        getCaseIdFromWorkflowPath(task.getPath().getId()).ifPresent(
                caseId -> taskMap.put(WorkflowTaskService.TASK_CASE_ID, caseId));

        List<NodeRef> contents = workflowService.getPackageContents(task.getId());
        List<Map<String, Object>> packageItems = contents
                .stream()
                .map(nodeRef -> getPackageItem(nodeRef))
                .collect(Collectors.toList());
        taskMap.put(WorkflowTaskService.TASK_PACKAGE_ITEMS, packageItems);
        return taskMap;
    }
    
    protected Map<String, Object> getPackageItem(NodeRef nodeRef){
        Map<String, Object> item = new HashMap<String, Object>();
        item.put(WorkflowTaskService.NODE_REF, nodeRef.toString());

        Map<QName, Serializable> properties = nodeService.getProperties(nodeRef);

        item.put(WorkflowTaskService.PACKAGE_ITEM_NAME, properties.get(ContentModel.PROP_NAME));
        item.put(WorkflowTaskService.PACKAGE_ITEM_MODIFIED, properties.get(ContentModel.PROP_MODIFIED));
        item.put(WorkflowTaskService.PACKAGE_ITEM_DESCRIPTION, properties.get(ContentModel.PROP_DESCRIPTION));
        String person = properties.get(ContentModel.PROP_CREATOR).toString();
        item.put(WorkflowTaskService.PACKAGE_ITEM_CREATEDBY,
                personService.getPerson(personService.getPerson(person)));

        NodeRef mainDocNodeRef = documentService.getMainDocument(nodeRef);
        if (mainDocNodeRef != null) {
            item.put(WorkflowTaskService.PACKAGE_ITEM_MAIN_DOC_NODE_REF, mainDocNodeRef.toString());
        } else {
            item.put(WorkflowTaskService.PACKAGE_ITEM_DOC_RECORD_NODE_REF,
                    documentService.getDocRecordNodeRef(nodeRef).toString());
        }

        return item;
    }

    @Override
    public Optional<String> getWorkflowCaseId(String workflowOrTaskId) {
        Optional<Serializable> optCaseId = getCaseIdByWorkflowId(workflowOrTaskId);
        return (optCaseId.isPresent() ? optCaseId : getCaseIdByTaskId(workflowOrTaskId))
                .map(Serializable::toString);
    }

    protected Optional<Serializable> getCaseIdByTaskId(String taskId) {
        return getCaseIdFromWorkflowPath(workflowService.getTaskById(taskId).getPath().getId());
    }

    protected Optional<Serializable> getCaseIdByWorkflowId(String workflowId){
        return workflowService.getWorkflowPaths(workflowId).stream()
                .findAny()
                .flatMap(path -> getCaseIdFromWorkflowPath(path.getId()));
    }

    protected Optional<Serializable> getCaseIdFromWorkflowPath(String pathId) {
        return Optional.ofNullable(workflowService.getPathProperties(pathId).get(OpenESDHModel.PROP_OE_CASE_ID));
    }

}
