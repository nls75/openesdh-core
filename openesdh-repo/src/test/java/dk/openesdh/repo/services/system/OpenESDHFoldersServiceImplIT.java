package dk.openesdh.repo.services.system;

import com.google.common.base.Joiner;
import com.tradeshift.test.remote.Remote;
import com.tradeshift.test.remote.RemoteTestRunner;

import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.DynamicNamespacePrefixResolver;
import org.alfresco.service.namespace.NamespaceService;
import static org.junit.Assert.assertEquals;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import dk.openesdh.repo.model.OpenESDHModel;
import static dk.openesdh.repo.services.system.OpenESDHFoldersService.CASES_ROOT;
import static dk.openesdh.repo.services.system.OpenESDHFoldersService.CLASSIFICATIONS;
import static dk.openesdh.repo.services.system.OpenESDHFoldersService.DOCUMENT_CATEGORIES;
import static dk.openesdh.repo.services.system.OpenESDHFoldersService.DOCUMENT_TYPES;
import static dk.openesdh.repo.services.system.OpenESDHFoldersService.FILES_ROOT;
import static dk.openesdh.repo.services.system.OpenESDHFoldersService.OPENESDH_ROOT_CONTEXT;
import static dk.openesdh.repo.services.system.OpenESDHFoldersService.PARAMETERS_ROOT;

@RunWith(RemoteTestRunner.class)
@Remote(runnerClass = SpringJUnit4ClassRunner.class)
@ContextConfiguration({"classpath:alfresco/application-context.xml", "classpath:alfresco/extension/openesdh-test-context.xml"})
public class OpenESDHFoldersServiceImplIT {

    private final DynamicNamespacePrefixResolver namespacePrefixResolver = new DynamicNamespacePrefixResolver();

    @Autowired
    @Qualifier("NodeService")
    private NodeService nodeService;

    @Autowired
    @Qualifier("OpenESDHFoldersService")
    protected OpenESDHFoldersService openESDHFoldersService;

    private static final String HOME = "/app:company_home";

    private void assertPath(NodeRef nodeRef, String... expectedPathFolders) {
        assertEquals(
                Joiner.on("/oe:").skipNulls().join(null, HOME, (Object[]) expectedPathFolders),
                nodeService.getPath(nodeRef).toPrefixString(namespacePrefixResolver));
    }

    @Before
    public void setUp() {
        namespacePrefixResolver.registerNamespace(NamespaceService.APP_MODEL_PREFIX, NamespaceService.APP_MODEL_1_0_URI);
        namespacePrefixResolver.registerNamespace(OpenESDHModel.OE_PREFIX, OpenESDHModel.OE_URI);
        namespacePrefixResolver.registerNamespace(NamespaceService.CONTENT_MODEL_PREFIX, NamespaceService.CONTENT_MODEL_1_0_URI);
        AuthenticationUtil.setFullyAuthenticatedUser(AuthenticationUtil.getAdminUserName());
    }

    @Test
    public void testGetOpenESDHRootFolder() {
        assertPath(openESDHFoldersService.getOpenESDHRootFolder(), OPENESDH_ROOT_CONTEXT);
    }

    @Test
    public void testGetCasesRootNodeRef() {
        assertPath(openESDHFoldersService.getCasesRootNodeRef(), OPENESDH_ROOT_CONTEXT, CASES_ROOT);
    }

    @Test
    public void testGetFilesRootNodeRef() {
        assertPath(openESDHFoldersService.getFilesRootNodeRef(), OPENESDH_ROOT_CONTEXT, FILES_ROOT);
    }

    @Test
    public void testGetClassificationsRootNodeRef() {
        assertPath(openESDHFoldersService.getClassificationsRootNodeRef(), OPENESDH_ROOT_CONTEXT, CLASSIFICATIONS);
    }

    @Test
    public void testGetDocumentTypesRootNodeRef() {
        assertPath(openESDHFoldersService.getDocumentTypesRootNodeRef(), OPENESDH_ROOT_CONTEXT, CLASSIFICATIONS, DOCUMENT_TYPES);
    }

    @Test
    public void testGetDocumentcategoriesRootNodeRef() {
        assertPath(openESDHFoldersService.getDocumentCategoriesRootNodeRef(), OPENESDH_ROOT_CONTEXT, CLASSIFICATIONS, DOCUMENT_CATEGORIES);
    }

    @Test
    public void testGetParametersRootNodeRef() {
        assertPath(openESDHFoldersService.getParametersRootNodeRef(), OPENESDH_ROOT_CONTEXT, PARAMETERS_ROOT);
    }
}
