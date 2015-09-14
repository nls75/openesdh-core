package dk.openesdh.repo.services.documents;

import java.io.Serializable;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import dk.openesdh.repo.model.DocumentStatus;
import dk.openesdh.repo.services.lock.OELockService;
import org.alfresco.model.ContentModel;
import org.alfresco.repo.content.MimetypeMap;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.service.cmr.coci.CheckOutCheckInService;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.ContentWriter;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.transaction.TransactionService;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.util.CollectionUtils;

import com.tradeshift.test.remote.Remote;
import com.tradeshift.test.remote.RemoteTestRunner;

import dk.openesdh.repo.helper.CaseDocumentTestHelper;
import dk.openesdh.repo.helper.CaseHelper;
import dk.openesdh.repo.model.CaseDocument;
import dk.openesdh.repo.model.CaseDocumentAttachment;
import dk.openesdh.repo.model.OpenESDHModel;
import dk.openesdh.repo.model.ResultSet;
import dk.openesdh.repo.services.cases.CaseService;

@RunWith(RemoteTestRunner.class)
@Remote(runnerClass = SpringJUnit4ClassRunner.class)
@ContextConfiguration({"classpath:alfresco/application-context.xml", "classpath:alfresco/extension/openesdh-test-context.xml"})
public class DocumentServiceImplIT {
    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Autowired
    @Qualifier("NodeService")
    protected NodeService nodeService;

    @Autowired
    @Qualifier("CaseService")
    protected CaseService caseService;

    @Autowired
    @Qualifier("CaseDocumentTestHelper")
    protected CaseDocumentTestHelper docTestHelper;

    @Autowired
    @Qualifier("DocumentService")
    protected DocumentService documentService;

    @Autowired
    @Qualifier("OELockService")
    protected OELockService oeLockService;

    @Autowired
    @Qualifier("TransactionService")
    protected TransactionService transactionService;

    @Autowired
    @Qualifier("CheckOutCheckInService")
    protected CheckOutCheckInService checkOutCheckInService;

    @Autowired
    @Qualifier("ContentService")
    protected ContentService contentService;

    private static final String TEST_FOLDER_NAME = "DocumentServiceImpIT";
    private static final String TEST_CASE_NAME1 = "TestCase1";
    private static final String TEST_CASE_NAME2 = "TestCase2";
    private static final String TEST_DOCUMENT_NAME = "TestDocument";
    private static final String TEST_DOCUMENT_FILE_NAME = TEST_DOCUMENT_NAME + ".txt";
    private static final String TEST_DOCUMENT_NAME2 = "TestDocument2";
    private static final String TEST_DOCUMENT_FILE_NAME2 = TEST_DOCUMENT_NAME2 + ".txt";
    private static final String TEST_DOCUMENT_NAME3 = "TestDocument3";
    private static final String TEST_DOCUMENT_FILE_NAME3 = TEST_DOCUMENT_NAME2 + ".txt";
    private static final String TEST_DOCUMENT_NAME4 = "TestDocument4";
    private static final String TEST_DOCUMENT_FILE_NAME4 = TEST_DOCUMENT_NAME4 + ".json";


    private static final String TEST_DOCUMENT_ATTACHMENT_NAME = "TestDocumentAttachment";
    private static final String TEST_DOCUMENT_ATTACHMENT_FILE_NAME = TEST_DOCUMENT_ATTACHMENT_NAME + ".txt";

    private static final String TEST_DOCUMENT_ATTACHMENT_NAME2 = "TestDocumentAttachment2";
    private static final String TEST_DOCUMENT_ATTACHMENT_FILE_NAME2 = TEST_DOCUMENT_ATTACHMENT_NAME2 + ".txt";

    private static final String TEST_DOCUMENT_ATTACHMENT_NAME3 = "TestDocumentAttachment3";
    private static final String TEST_DOCUMENT_ATTACHMENT_FILE_NAME3 = TEST_DOCUMENT_ATTACHMENT_NAME3 + ".txt";

    private NodeRef testFolder;
    private NodeRef testCase1;
    private NodeRef testCase2;
    private NodeRef testDocument;
    private NodeRef testDocumentAttachment;
    private NodeRef testDocumentRecFolder;
    private NodeRef testDocument2;
    private NodeRef testDocumentAttachment2;
    private NodeRef testDocumentRecFolder2;
    private NodeRef testDocument3;
    private NodeRef testDocumentRecFolder3;
    private NodeRef testDocument4;
    private NodeRef testDocumentRecFolder4;
    private NodeRef testDocumentAttachment3;
    @Rule
    public ExpectedException expectedException = ExpectedException.none();

    @Before
    public void setUp() throws Exception {

        // TODO: All of this could have been done only once
        AuthenticationUtil.setFullyAuthenticatedUser(AuthenticationUtil.getAdminUserName());

        testFolder = docTestHelper.createFolder(TEST_FOLDER_NAME);
        testCase1 = docTestHelper.createCaseBehaviourOn(TEST_CASE_NAME1, testFolder, CaseHelper.DEFAULT_USERNAME);
        testCase2 = docTestHelper.createCaseBehaviourOn(TEST_CASE_NAME2, testFolder, CaseHelper.DEFAULT_USERNAME);

        testDocument = docTestHelper.createCaseDocument(TEST_DOCUMENT_FILE_NAME, testCase1);
        testDocumentRecFolder = nodeService.getPrimaryParent(testDocument).getParentRef();
        testDocumentAttachment = docTestHelper.createCaseDocumentAttachment(TEST_DOCUMENT_ATTACHMENT_FILE_NAME,
                testDocumentRecFolder);
    }

    @After
    public void tearDown() throws Exception {
        AuthenticationUtil.setFullyAuthenticatedUser(AuthenticationUtil.getAdminUserName());

        List<NodeRef> folders = Arrays.asList(new NodeRef[]{testFolder});
        List<NodeRef> cases = Arrays.asList(new NodeRef[]{testCase1, testCase2});
        List<String> users = Arrays.asList(new String[]{CaseHelper.DEFAULT_USERNAME});
        docTestHelper.removeNodesAndDeleteUsersInTransaction(folders, cases, users);
    }

    @Test
    public void shouldMoveDocumentFromCase1ToCase2() throws Exception {
        String testCase2Id = caseService.getCaseId(testCase2);
        documentService.moveDocumentToCase(testDocumentRecFolder, testCase2Id);

        List<ChildAssociationRef> testCase1DocsList = documentService.getDocumentsForCase(testCase1);
        Assert.assertTrue("Test Case1 shouldn't contain any documents", CollectionUtils.isEmpty(testCase1DocsList));

        List<ChildAssociationRef> testCase2DocsList = documentService.getDocumentsForCase(testCase2);
        Assert.assertFalse("Test Case2 shouldn't be empty and should contain documents",
                CollectionUtils.isEmpty(testCase2DocsList));

        Assert.assertEquals("Test Case2 should contain 1 document", 1, testCase2DocsList.size());
        NodeRef docRef = testCase2DocsList.get(0).getChildRef();

        String documentName = docTestHelper.getNodePropertyString(docRef, ContentModel.PROP_NAME);
        Assert.assertEquals("Wrong test document name", TEST_DOCUMENT_NAME, documentName);
    }

    @Test
    public void shouldDeclineMovingDocumentToTheSameCase() throws Exception {
        String testCase1Id = caseService.getCaseId(testCase1);
        thrown.expect(Exception.class);
        thrown.expectMessage(DocumentService.DOCUMENT_STORED_IN_CASE_MESSAGE + testCase1Id);
        documentService.moveDocumentToCase(testDocumentRecFolder, testCase1Id);
    }

    @Test
    public void shouldCopyDocumentFromCase1ToCase2() throws Exception {

        Assert.assertTrue("Test case 2 should be empty before copy operation",
                CollectionUtils.isEmpty(documentService.getDocumentsForCase(testCase2)));

        final String testCase2Id = caseService.getCaseId(testCase2);
        AuthenticationUtil.setFullyAuthenticatedUser(AuthenticationUtil.getAdminUserName());

        documentService.copyDocumentToCase(testDocumentRecFolder, testCase2Id);

        List<ChildAssociationRef> testCase1DocsList = documentService.getDocumentsForCase(testCase1);
        Assert.assertFalse("Test case1 shouldn't be empty and should still contain documents",
                CollectionUtils.isEmpty(testCase1DocsList));

        NodeRef docFromTetsCase1Ref = testCase1DocsList.get(0).getChildRef();
        String docFromTestCase1Name = docTestHelper.getNodePropertyString(docFromTetsCase1Ref,
                ContentModel.PROP_NAME);
        Assert.assertEquals("Wrong test document name from case 1", TEST_DOCUMENT_NAME, docFromTestCase1Name);

        List<ChildAssociationRef> testCase2DocsList = documentService.getDocumentsForCase(testCase2);
        Assert.assertFalse("Test Case2 shouldn't be empty and should contain documents",
                CollectionUtils.isEmpty(testCase2DocsList));

        Assert.assertEquals("Test Case2 should contain 1 document", 1, testCase2DocsList.size());
        NodeRef docRef = testCase2DocsList.get(0).getChildRef();

        String documentName = docTestHelper.getNodePropertyString(docRef, ContentModel.PROP_NAME);
        Assert.assertEquals("Wrong test document name from case 2", TEST_DOCUMENT_NAME, documentName);

    }

    @Test
    public void shouldDeclineCopyDocumentToTheSameCase() throws Exception {
        final String testCase1Id = caseService.getCaseId(testCase1);

        AuthenticationUtil.setFullyAuthenticatedUser(AuthenticationUtil.getAdminUserName());

        thrown.expect(Exception.class);
        thrown.expectMessage(DocumentService.DOCUMENT_STORED_IN_CASE_MESSAGE + testCase1Id);
        documentService.copyDocumentToCase(testDocumentRecFolder, testCase1Id);

    }

    @Test
    public void shouldDeclineCopyDocumentIfSameExistsInTargetCase() throws Exception {

        final String testCase2Id = caseService.getCaseId(testCase2);
        AuthenticationUtil.setFullyAuthenticatedUser(AuthenticationUtil.getAdminUserName());
        documentService.copyDocumentToCase(testDocumentRecFolder, testCase2Id);

        try {
            documentService.copyDocumentToCase(testDocumentRecFolder, testCase2Id);
            Assert.fail("The copy document should fail here and throw an exception, since a doc with the same name exists.");
        } catch (Exception e) {
            Assert.assertTrue("Unexpected exception throw while copying document to the same case.", e.getCause()
                    .getMessage().startsWith("Duplicate child name not allowed"));
            Assert.assertTrue("The exception is thrown which is OK", true);
        }
    }

    @Test
    public void shouldCreateDocumentAttachmentVersionAndRetrieveSeveralVersions() {
        NodeRef workingCopy = checkOutCheckInService.checkout(testDocumentAttachment);
        ContentWriter writer = contentService.getWriter(workingCopy, ContentModel.PROP_CONTENT, true);
        writer.setMimetype("text");
        writer.putContent("some new content");
        checkOutCheckInService.checkin(workingCopy, null);

        ResultSet<CaseDocumentAttachment> attachments = documentService.getAttachmentsWithVersions(
                testDocumentRecFolder, 0, 1000);
        Assert.assertEquals("Wrong number of document attachments retrieved.", 1, attachments.getTotalItems());
        Assert.assertEquals("Wrong attachment current version.", "1.1", attachments.getResultList().get(0)
                .getVersionLabel());
        Assert.assertEquals("Wrong attachment previous version.", "1.0", attachments.getResultList().get(0)
                .getVersions().get(0).getVersionLabel());
    }

    @Test
    public void shouldCreateAndRetrieveDocumentsWithAttachments() {

        testDocument2 = docTestHelper.createCaseDocument(TEST_DOCUMENT_FILE_NAME2, testCase1);
        testDocumentRecFolder2 = nodeService.getPrimaryParent(testDocument2).getParentRef();
        testDocumentAttachment2 = docTestHelper.createCaseDocumentAttachment(TEST_DOCUMENT_ATTACHMENT_FILE_NAME2,
                testDocumentRecFolder2);

        String caseId = caseService.getCaseId(testCase1);
        List<CaseDocument> caseDocuments = documentService.getCaseDocumentsWithAttachments(caseId);
        Assert.assertEquals("Wrong number of case documents retrieved", 2, caseDocuments.size());
        Assert.assertEquals("Wrong number of the first document attachments retrieved", 1, caseDocuments.get(0)
                .getAttachments().size());
        Assert.assertEquals("Wrong number of the second document attachments retrieved", 1, caseDocuments.get(1)
                .getAttachments().size());
    }

    @Test
    public void finalizeUnfinalizeDocument() throws Exception {
        testDocument3 = docTestHelper.createCaseDocument(TEST_DOCUMENT_FILE_NAME3, testCase1);
        testDocumentRecFolder3 = nodeService.getPrimaryParent(testDocument3).getParentRef();
        testDocumentAttachment3 = docTestHelper.createCaseDocumentAttachment(TEST_DOCUMENT_ATTACHMENT_FILE_NAME2, testDocumentRecFolder3);
        Assert.assertEquals("Document initially has DRAFT status", DocumentStatus.DRAFT, documentService.getNodeStatus(testDocumentRecFolder3));
        documentService.changeNodeStatus(testDocumentRecFolder3, DocumentStatus.FINAL);
        Assert.assertEquals("Finalized document has FINAL status", DocumentStatus.FINAL, documentService.getNodeStatus(testDocumentRecFolder3));

        Assert.assertTrue("Document record is locked after being finalized.", oeLockService.isLocked(testDocumentRecFolder3));
        Assert.assertTrue("Document file is locked after being finalized", oeLockService.isLocked(testDocument3));
        Assert.assertTrue("Document attachment is locked after being finalized", oeLockService.isLocked(testDocumentAttachment3));

        try {
            // Try to update the finalized document
            NodeRef workingCopy = checkOutCheckInService.checkout(testDocument3);
            ContentWriter writer = contentService.getWriter(workingCopy, ContentModel.PROP_CONTENT, true);
            writer.setMimetype("text");
            writer.putContent("some new content");
            checkOutCheckInService.checkin(workingCopy, null);
            Assert.fail("Expected to get an exception thrown when trying to add a new version to a finalized document");
        } catch (Exception ignored) {
        }

        documentService.changeNodeStatus(testDocumentRecFolder3, DocumentStatus.DRAFT);
        Assert.assertEquals("Unfinalized document has DRAFT status", documentService.getNodeStatus(testDocumentRecFolder3), DocumentStatus.DRAFT);

        Assert.assertFalse("Document record is locked after being finalized but should be unlocked.", oeLockService.isLocked(testDocumentRecFolder3));
        Assert.assertFalse("Document file is locked after being finalized but should be unlocked.", oeLockService.isLocked(testDocument3));
        Assert.assertFalse("Document attachment is locked after being finalized but should be unlocked", oeLockService.isLocked(testDocumentAttachment3));
    }

    @Test
    public void finalizeNonAcceptableFormatDocument() throws Exception {
        // Make sure that you get an exception when trying to finalize a
        // document which is not an allowed finalizable type
        // (e.g. application/json, etc..)
        testDocument4 = docTestHelper.createCaseDocument(TEST_DOCUMENT_FILE_NAME4, testCase1);
        testDocumentRecFolder4 = nodeService.getPrimaryParent(testDocument4).getParentRef();

        // Try to update the finalized document
        NodeRef workingCopy = checkOutCheckInService.checkout(testDocument4);
        ContentWriter writer = contentService.getWriter(workingCopy, ContentModel.PROP_CONTENT, true);
        writer.setMimetype(MimetypeMap.MIMETYPE_JSON);
        writer.putContent("{'thisShouldNotBeAbleToBeFinalized': 1}");
        checkOutCheckInService.checkin(workingCopy, null);

        expectedException.expect(AutomaticFinalizeFailureException.class);
        documentService.changeNodeStatus(testDocumentRecFolder4, DocumentStatus.FINAL);
    }

    @Test
    public void shouldUpdateCaseDocumentProperties() {
        CaseDocument document = new CaseDocument();
        document.setNodeRef(testDocument.toString());
        document.setCategory(OpenESDHModel.DOCUMENT_CATEGORY_CONTRACT);
        document.setType(OpenESDHModel.DOCUMENT_TYPE_INVOICE);
        document.setState(OpenESDHModel.DOCUMENT_STATE_FINALISED);

        documentService.updateCaseDocumentProperties(document);

        Map<QName, Serializable> props = nodeService.getProperties(testDocument);
        Assert.assertEquals("Document category should be updated", OpenESDHModel.DOCUMENT_CATEGORY_CONTRACT,
                props.get(OpenESDHModel.PROP_DOC_CATEGORY));
        Assert.assertEquals("Document type should be updated", OpenESDHModel.DOCUMENT_TYPE_INVOICE,
                props.get(OpenESDHModel.PROP_DOC_TYPE));
        Assert.assertEquals("Document state should be updated", OpenESDHModel.DOCUMENT_STATE_FINALISED,
                props.get(OpenESDHModel.PROP_DOC_STATE));
    }
}
