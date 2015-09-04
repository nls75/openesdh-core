package dk.openesdh.repo.services.contacts;

//import dk.openesdh.exceptions.contacts.InvalidContactTypeException;

import dk.openesdh.exceptions.contacts.GenericContactException;
import dk.openesdh.exceptions.contacts.InvalidContactTypeException;
import dk.openesdh.exceptions.contacts.NoSuchContactException;
import dk.openesdh.repo.model.ContactInfo;
import dk.openesdh.repo.model.ContactType;
import dk.openesdh.repo.model.OpenESDHModel;
import dk.openesdh.repo.services.xsearch.ContactSearchService;
import dk.openesdh.repo.services.xsearch.XResultSet;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.alfresco.repo.transaction.RetryingTransactionHelper;
import org.alfresco.repo.transaction.TransactionServiceImpl;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.cmr.search.QueryConsistency;
import org.alfresco.service.cmr.search.ResultSet;
import org.alfresco.service.cmr.search.SearchParameters;
import org.alfresco.service.cmr.search.SearchService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.namespace.QName;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.alfresco.service.transaction.TransactionService;

/**
 * @author Lanre Abiwon.
 */
public class ContactServiceImpl implements ContactService {

    private static final Log logger = LogFactory.getLog(ContactServiceImpl.class);
    private NodeService nodeService;
    private ContactDAOImpl contactDAO;
    private SearchService searchService;
    private ContactSearchService contactSearchService;
    private TransactionService transactionService;
    //for later use
    private static Set<String> DEFAULT_ZONES = new HashSet<String>();

    static {
        DEFAULT_ZONES.add(AuthorityService.ZONE_APP_DEFAULT);
        DEFAULT_ZONES.add(ContactService.ZONE_CONTACT);
    }

    @Override
    public ContactType getContactType(NodeRef contact) {
        return this.nodeService.getType(contact).getLocalName().equalsIgnoreCase("PERSON") ? ContactType.PERSON : ContactType.ORGANIZATION;
    }

    @Override
    public NodeRef getContactsStorageRoot() {
        return contactDAO.getAuthorityContainerRef();
    }

    @Override
    public NodeRef createContact(String email, String type, HashMap<QName, Serializable> properties) {
        return createContact(email, type, properties, DEFAULT_ZONES);
    }

    @Override
    public NodeRef createContact(String email, String type, HashMap<QName, Serializable> properties, Set<String> authorityZones) {
        if (!type.equalsIgnoreCase(ContactType.valueOf(StringUtils.capitalize(type)).toString())) {
            throw new InvalidContactTypeException("The type of contact is not recognised. Can only create types PERSON/ORGANIZATION");
        }

        if (StringUtils.isEmpty(email)) {
            throw new NullPointerException("Email is mandatory for contact creation");
        }

        return this.contactDAO.createContact(email, StringUtils.capitalize(type), properties, DEFAULT_ZONES);
    }

    @Override
    public NodeRef getContactById(String id) {
        return transactionService.getRetryingTransactionHelper().doInTransaction(new RetryingTransactionHelper.RetryingTransactionCallback<NodeRef>() {
            @Override
            public NodeRef execute() throws Throwable {

                SearchParameters searchParams = new SearchParameters();
                searchParams.setLanguage(SearchService.LANGUAGE_CMIS_ALFRESCO);
                searchParams.addStore(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE);
                searchParams.setQueryConsistency(QueryConsistency.TRANSACTIONAL);
                NodeRef contact = null;

                StringBuilder query = new StringBuilder(256);
                query.append("SELECT * FROM contact:base WHERE contact:email='").append(id).append("'");

                searchParams.setQuery(query.toString());
                ResultSet results = null;
                try {
                    results = searchService.query(searchParams);
                    if (results.getNodeRefs().size() > 1) {
                        throw new GenericContactException("There is more than one contact associated with this id (" + id + ").");
                    }
                    if (results.getNodeRefs().size() < 1) {
                        throw new NoSuchContactException();
                    }
                    contact = results.getNodeRef(0);
                } catch (Throwable err) {
                    if (logger.isDebugEnabled()) {
                        logger.debug("\t\t***** Error *****\n There was a problem finding the contact: " + query.toString(), err);
                    }
                    throw err;
                } finally {
                    if (results != null) {
                        results.close();
                    }
                }
                return contact;
            }
        });

    }

    @Override
    public List<ContactInfo> getContactByFilter(String id, String type) {
        QName contactType = type.equalsIgnoreCase("PERSON") ? OpenESDHModel.TYPE_CONTACT_PERSON : OpenESDHModel.TYPE_CONTACT_ORGANIZATION;

        Map<String, String> params = new HashMap<>();
        params.put("baseType", contactType.toString());
        params.put("term", id);
        List<ContactInfo> contacts = new ArrayList<>();
        try {
            XResultSet results = contactSearchService.getNodes(params, 0, -1, "cm:name", true);
            for (NodeRef contactNode : results.getNodeRefs()) {
                contacts.add(new ContactInfo(contactNode, getContactType(contactNode), this.nodeService.getProperties(contactNode)));
            }
        } catch (Throwable err) {
            if (logger.isDebugEnabled()) {
                logger.debug("\t\t***** Error *****\n There was a problem "
                        + "finding the contact: " + id, err);
            }
            throw err;
        }
        return contacts;
    }

    @Override
    public Map<QName, Serializable> getAddress(NodeRef contactRef) {
        Map<QName, Serializable> addressProps = new HashMap<>();
        if (this.nodeService.hasAspect(contactRef, OpenESDHModel.ASPECT_CONTACT_ADDRESS)) {
            Map<QName, Serializable> allProps = this.nodeService.getProperties(contactRef);
            addressProps.put(OpenESDHModel.PROP_CONTACT_HOUSE_NUMBER, allProps.get(OpenESDHModel.PROP_CONTACT_HOUSE_NUMBER));
            addressProps.put(OpenESDHModel.PROP_CONTACT_ADDRESS, allProps.get(OpenESDHModel.PROP_CONTACT_ADDRESS));
            addressProps.put(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE1, allProps.get(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE1));
            addressProps.put(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE2, allProps.get(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE2));
            addressProps.put(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE3, allProps.get(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE3));
            addressProps.put(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE4, allProps.get(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE4));
            addressProps.put(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE5, allProps.get(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE5));
            addressProps.put(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE6, allProps.get(OpenESDHModel.PROP_CONTACT_ADDRESS_LINE6));
            addressProps.put(OpenESDHModel.PROP_CONTACT_STREET_NAME, allProps.get(OpenESDHModel.PROP_CONTACT_STREET_NAME));
            addressProps.put(OpenESDHModel.PROP_CONTACT_STREET_CODE, allProps.get(OpenESDHModel.PROP_CONTACT_STREET_CODE));
            addressProps.put(OpenESDHModel.PROP_CONTACT_FLOOR_IDENTIFIER, allProps.get(OpenESDHModel.PROP_CONTACT_FLOOR_IDENTIFIER));
            addressProps.put(OpenESDHModel.PROP_CONTACT_SUITE_IDENTIFIER, allProps.get(OpenESDHModel.PROP_CONTACT_SUITE_IDENTIFIER));
            addressProps.put(OpenESDHModel.PROP_CONTACT_CITY_NAME, allProps.get(OpenESDHModel.PROP_CONTACT_CITY_NAME));
            addressProps.put(OpenESDHModel.PROP_CONTACT_POST_CODE, allProps.get(OpenESDHModel.PROP_CONTACT_POST_CODE));
            addressProps.put(OpenESDHModel.PROP_CONTACT_POST_BOX, allProps.get(OpenESDHModel.PROP_CONTACT_POST_BOX));
            addressProps.put(OpenESDHModel.PROP_CONTACT_POST_DISTRICT, allProps.get(OpenESDHModel.PROP_CONTACT_POST_DISTRICT));
            addressProps.put(OpenESDHModel.PROP_CONTACT_MUNICIPALITY_CODE, allProps.get(OpenESDHModel.PROP_CONTACT_MUNICIPALITY_CODE));
            addressProps.put(OpenESDHModel.PROP_CONTACT_COUNTRY_CODE, allProps.get(OpenESDHModel.PROP_CONTACT_COUNTRY_CODE));
        }
        return addressProps;
    }

    @Override
    public ContactInfo getContactInfo(NodeRef nodeRef) {
        return new ContactInfo(nodeRef, getContactType(nodeRef), this.nodeService.getProperties(nodeRef));
    }

    //<editor-fold desc="Injected service bean setters">
    public void setNodeService(NodeService nodeService) {
        this.nodeService = nodeService;
    }

    public void setContactDAO(ContactDAOImpl contactDAO) {
        this.contactDAO = contactDAO;
    }

    public void setSearchService(SearchService searchService) {
        this.searchService = searchService;
    }

    public void setContactSearchService(ContactSearchService contactSearchService) {
        this.contactSearchService = contactSearchService;
    }

    public TransactionService getTransactionService() {
        return transactionService;
    }

    public void setTransactionService(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    //</editor-fold>

}
