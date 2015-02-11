package dk.openesdh.repo.policy;

import dk.openesdh.repo.model.OpenESDHModel;
import dk.openesdh.repo.services.documents.DocumentService;
import org.alfresco.model.ContentModel;
import org.alfresco.repo.node.NodeServicePolicies;
import org.alfresco.repo.policy.Behaviour;
import org.alfresco.repo.policy.BehaviourFilter;
import org.alfresco.repo.policy.JavaBehaviour;
import org.alfresco.repo.policy.PolicyComponent;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.ContentData;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.QName;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.tika.mime.MimeType;
import org.apache.tika.mime.MimeTypeException;
import org.apache.tika.mime.MimeTypes;

/**
 * Created by torben on 19/08/14.
 */
public class DocumentsBehaviour implements NodeServicePolicies.OnCreateChildAssociationPolicy {

    private static Log LOG = LogFactory.getLog(DocumentsBehaviour.class);

    // Dependencies
    private DocumentService documentService;
    private NodeService nodeService;
    private PolicyComponent policyComponent;

    // Behaviours
    private Behaviour onCreateChildAssociation;

    public void setDocumentService(DocumentService documentService) {
        this.documentService = documentService;
    }

    public void setNodeService(NodeService nodeService) {
        this.nodeService = nodeService;
    }

    public void setPolicyComponent(PolicyComponent policyComponent) {
        this.policyComponent = policyComponent;
    }

    public void init() {
        // Create behaviours
        this.onCreateChildAssociation = new JavaBehaviour(this, "onCreateChildAssociation", Behaviour.NotificationFrequency.TRANSACTION_COMMIT);

        // Bind behaviours to node policies
        this.policyComponent.bindAssociationBehaviour(
                NodeServicePolicies.OnCreateChildAssociationPolicy.QNAME,
                OpenESDHModel.ASPECT_DOCUMENT_CONTAINER,
                this.onCreateChildAssociation
        );
        /*
        this.policyComponent.bindClassBehaviour(
                NodeServicePolicies.OnCreateChildAssociationPolicy.QNAME,
                ContentModel.TYPE_CONTENT,
                this.onCreateChildAssociation
        );
        */
    }

    @Override
    public void onCreateChildAssociation(ChildAssociationRef childAssociationRef, boolean isNewNode) {
        QName childType = nodeService.getType(childAssociationRef.getChildRef());
        if (childType.equals(ContentModel.TYPE_CONTENT)) {
            NodeRef documentsFolderRef = childAssociationRef.getParentRef();
            NodeRef fileRef = childAssociationRef.getChildRef();

            String fileName = (String) nodeService.getProperty(fileRef, ContentModel.PROP_NAME);
            String documentName = FilenameUtils.removeExtension(fileName);
            //It is common that users create a file without adding an extension to the file name
            //so originally we decided to add a .txt by default but instead it is better to attempt
            //Mimetype detection and add the extension
            if (!hasFileExtension(fileName)){
                ContentData fileDataType = (ContentData) nodeService.getProperty(fileRef, ContentModel.PROP_CONTENT);
                try {
                    MimeType contentMimeType = MimeTypes.getDefaultMimeTypes().forName(fileDataType.getMimetype());
                    fileName += contentMimeType.getExtension();
                    nodeService.setProperty(fileRef, ContentModel.PROP_NAME, fileName);
                } catch (MimeTypeException e) {
                    // TODO: Is it ok to just ignore? If we can't find the mimetype we just leave it without extension.
//                    e.printStackTrace();
                }
            }

            // Create document
            ChildAssociationRef documentAssociationRef = documentService.createDocumentFolder(documentsFolderRef, documentName);
            NodeRef document = documentAssociationRef.getChildRef();
            nodeService.moveNode(fileRef, document, ContentModel.ASSOC_CONTAINS, QName.createQName(OpenESDHModel.DOC_URI, "content_" + documentName));
            //Tag the case document as the main document for the case
            nodeService.addAspect(fileRef, OpenESDHModel.ASPECT_CASE_MAIN_DOC, null);
            nodeService.setType(fileRef, OpenESDHModel.TYPE_DOC_DIGITAL_FILE);
            // TODO Get start value, localize
            nodeService.setProperty(fileRef, OpenESDHModel.PROP_DOC_VARIANT, "Produktion");

//            documentService.createDocument(childAssocRef);
        }
    }

    private boolean hasFileExtension(String filename){
        String fileNameExt =  FilenameUtils.getExtension(filename);
        return StringUtils.isNotEmpty(fileNameExt);
    }
}

