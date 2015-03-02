package dk.openesdh.repo.services.xsearch;

import dk.openesdh.repo.model.OpenESDHModel;
import dk.openesdh.repo.services.cases.CaseService;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.Path;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.util.ISO9075;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * Lists all the documents in a given case
 */
public class CaseDocumentsSearchServiceImpl extends AbstractXSearchService implements CaseDocumentsSearchService{

    protected CaseService caseService;
    protected NodeService nodeService;
    protected NamespaceService namespaceService;

    public XResultSet getNodes(Map<String, String> params, int startIndex, int pageSize, String sortField, boolean ascending) {
        NodeRef caseNodeRef = new NodeRef(params.get("nodeRef"));
        NodeRef documentsNodeRef = caseService.getDocumentsFolder(caseNodeRef);
        Path path = nodeService.getPath(documentsNodeRef);

        String query = "TYPE:" + quote(OpenESDHModel.TYPE_DOC_BASE.toString());
        query += " AND PATH:" + quote(path.toPrefixString(namespaceService)
                + "/*");
        return executeQuery(query, startIndex, pageSize, sortField, ascending);
    }

    public XResultSet getAttachements(Map<String, String> params) {
        NodeRef documentsNodeRef = new NodeRef(params.get("nodeRef"));

        List<ChildAssociationRef> attachmentsRefs = this.nodeService.getChildAssocs(documentsNodeRef);
        List<NodeRef> attachmentsNodes = new ArrayList<>();
        for(ChildAssociationRef childRef : attachmentsRefs){
            if(this.nodeService.hasAspect(childRef.getChildRef(), OpenESDHModel.ASPECT_CASE_MAIN_DOC))
                continue;

            attachmentsNodes.add(childRef.getChildRef());
        }

        return new XResultSet(attachmentsNodes);
    }

    public void setCaseService(CaseService caseService) {
        this.caseService = caseService;
    }

    public void setNodeService(NodeService nodeService) {
        this.nodeService = nodeService;
    }

    public void setNamespaceService(NamespaceService namespaceService) {
        this.namespaceService = namespaceService;
    }
}