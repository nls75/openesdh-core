/**
 * Search Component
 *
 * Takes the following object as Input:
 *    params
 *    {
 *       siteId: the site identifier to search into, null for all sites
 *       containerId: the component the search in, null for all components in the site
 *       term: search terms
 *       tag: search tag
 *       query: advanced search query json
 *       sort: sort parameter
 *       maxResults: maximum results to return
 *    };
 *
 * Outputs:
 *  items - Array of objects containing the search results
 */

const DEFAULT_MAX_RESULTS = 250;
const DEFAULT_PAGE_SIZE = 50;
const SITES_SPACE_QNAME_PATH = "/app:company_home/st:sites/";
const CASES_SPACE_QNAME_PATH = "/app:company_home/oe:OpenESDH/oe:cases/";

//Gets the nth occurence index of a character in a string
function GetSubstringIndex(str, substring, n) {
    var times = 0, index = null;

    while (times < n && index !== -1) {
        index = str.indexOf(substring, index + 1);
        times++;
    }

    return index;
}

/**
 * Returns site information data structure.
 * { shortName: siteId, title: title }
 *
 * Caches the data to avoid repeatedly querying the repository.
 */
var siteDataCache = {};
function getSiteData(siteId) {
    if (typeof siteDataCache[siteId] === "object") {
        return siteDataCache[siteId];
    }
    var site = siteService.getSite(siteId);
    var data =
    {
        shortName: siteId,
        title: (site !== null ? site.title : "unknown")
    };
    siteDataCache[siteId] = data;
    return data;
}

/**
 * Returns person display name string as returned to the user.
 *
 * Caches the person full name to avoid repeatedly querying the repository.
 */
var personDataCache = {};
function getPersonDisplayName(userId) {
    if (typeof personDataCache[userId] === "object") {
        return personDataCache[userId];
    }

    var displayName = people.getPersonFullName(userId);
    if (displayName == null) {
        displayName = "";
    }
    personDataCache[userId] = displayName;
    return displayName;
}

/**
 * Cache to not display twice the same element (e.g. if two comments of the
 * same blog post match the search criteria
 */
var processedCache;
function checkProcessedCache(key) {
    var found = processedCache.hasOwnProperty(key);
    if (!found) {
        processedCache[key] = true;
    }
    else if (found && logger.isLoggingEnabled())
        logger.log("...already processed item with key: " + key);
    return found;
}

/**
 * Returns an item outside of a site in the main repository.
 */
function getRepositoryItem(folderPath, node, populate) {
    // check whether we already processed this document
    if (checkProcessedCache("" + node.nodeRef.toString())) {
        return null;
    }

    // check whether this is a valid folder or a file
    var item = t = null;
    if (node.isContainer || node.isDocument) {
        if (!populate) return {};
        item =
        {
            nodeRef: node.nodeRef.toString(),
            tags: ((t = node.tags) !== null) ? t : [],
            name: node.name,
            displayName: node.name,
            title: node.properties["cm:title"],
            description: node.properties["cm:description"],
            modifiedOn: node.properties["cm:modified"],
            modifiedByUser: node.properties["cm:modifier"],
            createdOn: node.properties["cm:created"],
            createdByUser: node.properties["cm:creator"],
            lastThumbnailModification: node.properties["cm:lastThumbnailModification"],
            mimetype: node.mimetype,
            path: folderPath.join("/")
        };
        item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
        item.createdBy = getPersonDisplayName(item.createdByUser);
    }
    if (node.isContainer) {
        item.type = "folder";
        item.size = -1;
    }
    else if (node.isDocument) {
        item.type = "document";
        item.size = node.size;
    }

    return item;
}

/**
 * Returns an item of the case document.
 */
function getCaseOrCaseDocumentItem(caseId, containerId, pathParts, node, populate) {
    //We want to know whether we've just returned the case  if what we're seeing here is a folder.
    var isCaseType = node.typeShort.substring(node.typeShort.indexOf(":")+1) == "case";

    logger.log("\t\t\t===> search.lib.js - 143  Is a case item? : "+isCaseType+" <===\n");
    // check whether we already processed this document
    if (checkProcessedCache("" + node.nodeRef.toString())) {
        return null;
    }

    // check whether this is a valid folder or a file
    var item = t = null;
    if (node.isContainer || node.isDocument) {
        if (!populate) return {};
        item =
        {
            case: isCaseType? node : caseUtils.getCaseInfo(caseId),
            container: containerId,
            nodeRef: node.nodeRef.toString(),
            tags: ((t = node.tags) !== null) ? t : [],
            name: node.name,
            displayName: node.properties["cm:title"]? node.properties["cm:title"] : node.name,
            title: node.properties["cm:title"],
            description: node.properties["cm:description"],
            modifiedOn: node.properties["cm:modified"],
            modifiedByUser: node.properties["cm:modifier"],
            createdOn: node.properties["cm:created"],
            createdByUser: node.properties["cm:creator"],
            lastThumbnailModification: node.properties["cm:lastThumbnailModification"],
            mimetype: node.mimetype,
            path: pathParts.join("/")
        };
        item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
        item.createdBy = getPersonDisplayName(item.createdByUser);
    }
    if (node.isContainer) {
        item.type = isCaseType? "case" : "folder";
        item.size = -1;
    }
    else if (node.isDocument) {
        item.type = "document";
        item.docRecordNodeRef = node.parent.nodeRef.toString();
        item.docCategory = node.parent.properties["doc:category"];
        item.docStatus = node.parent.properties["oe:status"];
        item.size = node.size;
    }

    return item;
}


/**
 * Returns an item of the document library component.
 */
function getDocumentItem(siteId, containerId, pathParts, node, populate) {
    // PENDING: how to handle comments? the document should
    //          be returned instead
    // check whether we already processed this document
    if (checkProcessedCache("" + node.nodeRef.toString())) {
        return null;
    }

    // check whether this is a valid folder or a file
    var item = t = null;
    if (node.isContainer || node.isDocument) {
        if (!populate) return {};
        item =
        {
            site: getSiteData(siteId),
            container: containerId,
            nodeRef: node.nodeRef.toString(),
            tags: ((t = node.tags) !== null) ? t : [],
            name: node.name,
            displayName: node.name,
            title: node.properties["cm:title"],
            description: node.properties["cm:description"],
            modifiedOn: node.properties["cm:modified"],
            modifiedByUser: node.properties["cm:modifier"],
            createdOn: node.properties["cm:created"],
            createdByUser: node.properties["cm:creator"],
            lastThumbnailModification: node.properties["cm:lastThumbnailModification"],
            mimetype: node.mimetype,
            path: pathParts.join("/")
        };
        item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
        item.createdBy = getPersonDisplayName(item.createdByUser);
    }
    if (node.isContainer) {
        item.type = "folder";
        item.size = -1;
    }
    else if (node.isDocument) {
        item.type = "document";
        item.size = node.size;
    }

    return item;
}

function getBlogPostItem(siteId, containerId, pathParts, node, populate) {
    /**
     * Investigate the rest of the path. the first item is the blog post, ignore everything that follows
     * are replies or folders
     */
    var site = siteService.getSite(siteId);
    if (site === null) {
        return null;
    }
    var container = site.getContainer(containerId);

    /**
     * Find the direct child of the container
     * Note: this only works for post which are direct children of the blog container
     */
    var child = node;
    var parent = child.parent;
    while ((parent !== null) && (!parent.nodeRef.equals(container.nodeRef))) {
        child = parent;
        parent = parent.parent;
    }

    // check whether we found the container
    if (parent === null) {
        return null;
    }

    // check whether we already added this blog post
    if (checkProcessedCache("" + child.nodeRef.toString())) {
        return null;
    }

    // child is our blog post
    if (!populate) return {};
    var item, t = null;
    item =
    {
        site: getSiteData(siteId),
        container: containerId,
        nodeRef: child.nodeRef.toString(),
        type: "blogpost",
        tags: ((t = child.tags) !== null) ? t : [],
        name: child.name,
        modifiedOn: child.properties["cm:modified"],
        modifiedByUser: child.properties["cm:modifier"],
        createdOn: node.properties["cm:created"],
        createdByUser: node.properties["cm:creator"],
        size: child.size,
        displayName: child.properties["cm:title"]
    };
    item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
    item.createdBy = getPersonDisplayName(item.createdByUser);

    return item;
}

function getForumPostItem(siteId, containerId, pathParts, node, populate) {
    // try to find the first fm:topic node, that's what we return as search result
    var topicNode = node;
    while ((topicNode !== null) && (topicNode.type != "{http://www.alfresco.org/model/forum/1.0}topic")) {
        topicNode = topicNode.parent;
    }
    if (topicNode === null) {
        return null;
    }

    // make sure we haven't already added the post
    if (checkProcessedCache("" + topicNode.nodeRef.toString())) {
        return null;
    }

    // find the first post, which contains the post title
    // PENDING: error prone
    var postNode = topicNode.childAssocs["cm:contains"][0];

    // child is our forum post
    if (!populate) return {};
    var item = t = null;
    item =
    {
        site: getSiteData(siteId),
        container: containerId,
        nodeRef: topicNode.nodeRef.toString(),
        type: "forumpost",
        tags: ((t = topicNode.tags) !== null) ? t : [],
        name: topicNode.name,
        description: topicNode.properties["cm:description"],
        modifiedOn: topicNode.properties["cm:modified"],
        modifiedByUser: topicNode.properties["cm:modifier"],
        createdOn: node.properties["cm:created"],
        createdByUser: node.properties["cm:creator"],
        size: topicNode.size,
        displayName: postNode.properties["cm:title"]
    };
    item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
    item.createdBy = getPersonDisplayName(item.createdByUser);

    return item;
}

function getCalendarItem(siteId, containerId, pathParts, node, populate) {
    // only process nodes of the correct type
    if (node.type != "{http://www.alfresco.org/model/calendar}calendarEvent") {
        return null;
    }

    // make sure we haven't already added the event
    if (checkProcessedCache("" + node.nodeRef.toString())) {
        return null;
    }

    if (!populate) return {};
    var item, t = null;
    item =
    {
        site: getSiteData(siteId),
        container: containerId,
        nodeRef: node.nodeRef.toString(),
        type: "calendarevent",
        tags: ((t = node.tags) !== null) ? t : [],
        name: node.name,
        description: node.properties["ia:descriptionEvent"],
        modifiedOn: node.properties["cm:modified"],
        modifiedByUser: node.properties["cm:modifier"],
        createdOn: node.properties["cm:created"],
        createdByUser: node.properties["cm:creator"],
        size: -1,
        displayName: node.properties["ia:whatEvent"]
    };
    item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
    item.createdBy = getPersonDisplayName(item.createdByUser);

    return item;
}

function getWikiItem(siteId, containerId, pathParts, node, populate) {
    // only process documents
    if (!node.isDocument) {
        return null;
    }

    // make sure we haven't already added the page
    if (checkProcessedCache("" + node.nodeRef.toString())) {
        return null;
    }

    if (!populate) return {};
    var item, t = null;
    item =
    {
        site: getSiteData(siteId),
        container: containerId,
        nodeRef: node.nodeRef.toString(),
        type: "wikipage",
        tags: ((t = node.tags) !== null) ? t : [],
        name: node.name,
        description: node.properties["cm:description"],
        modifiedOn: node.properties["cm:modified"],
        modifiedByUser: node.properties["cm:modifier"],
        createdOn: node.properties["cm:created"],
        createdByUser: node.properties["cm:creator"],
        size: node.size,
        displayName: ("" + node.name).replace(/_/g, " ")
    };
    item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
    item.createdBy = getPersonDisplayName(item.createdByUser);

    return item;
}

function getLinkItem(siteId, containerId, pathParts, node, populate) {
    // only process documents
    if (!node.isDocument) {
        return null;
    }

    // make sure we haven't already added this link
    if (checkProcessedCache("" + node.nodeRef.toString())) {
        return null;
    }

    var item = t = null;
    if (!populate) return {};
    item =
    {
        site: getSiteData(siteId),
        container: containerId,
        nodeRef: node.nodeRef.toString(),
        type: "link",
        tags: ((t = node.tags) !== null) ? t : [],
        name: node.name,
        description: node.properties["cm:description"],
        modifiedOn: node.properties["cm:modified"],
        modifiedByUser: node.properties["cm:modifier"],
        createdOn: node.properties["cm:created"],
        createdByUser: node.properties["cm:creator"],
        size: -1,
        displayName: node.properties["lnk:title"]
    };
    item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
    item.createdBy = getPersonDisplayName(item.createdByUser);

    return item;
}

function getDataItem(siteId, containerId, pathParts, node, populate) {
    // make sure we haven't already added this item
    if (checkProcessedCache("" + node.nodeRef.toString())) {
        return null;
    }

    var item = null;

    // data item can be either ba containing dl:dataList or any dl:dataListItem subtype
    if (node.type == "{http://www.alfresco.org/model/datalist/1.0}dataList") {
        if (!populate) return {};
        // found a data list
        item =
        {
            site: getSiteData(siteId),
            container: containerId,
            nodeRef: node.nodeRef.toString(),
            type: "datalist",
            tags: [],
            name: node.name,
            description: node.properties["cm:description"],
            modifiedOn: node.properties["cm:modified"],
            modifiedByUser: node.properties["cm:modifier"],
            createdOn: node.properties["cm:created"],
            createdByUser: node.properties["cm:creator"],
            size: -1,
            displayName: node.properties["cm:title"]
        };
        item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
        item.createdBy = getPersonDisplayName(item.createdByUser);
    }
    else if (node.isSubType("{http://www.alfresco.org/model/datalist/1.0}dataListItem")) {
        if (!populate) return {};
        // found a data list item
        item =
        {
            site: getSiteData(siteId),
            container: containerId,
            nodeRef: node.nodeRef.toString(),
            type: "datalistitem",
            tags: [],
            name: node.parent.name,    // used to generate link to parent datalist - not ideal
            modifiedOn: node.properties["cm:modified"],
            modifiedByUser: node.properties["cm:modifier"],
            createdOn: node.properties["cm:created"],
            createdByUser: node.properties["cm:creator"],
            size: -1,
            displayName: node.name     // unfortunately does not have a common display name property
        };
        item.modifiedBy = getPersonDisplayName(item.modifiedByUser);
        item.createdBy = getPersonDisplayName(item.createdByUser);
    }

    return item;
}

/**
 * Delegates the extraction to the correct extraction function
 * depending on containerId.
 */
function getItem(caseId, siteId, containerId, pathParts, node, populate) {
    var item = null;
    if (siteId == null && caseId == null) {
        item = getRepositoryItem(pathParts, node, populate);
    }
    else if (caseId != null) {
        //We want a document within the case and contacts
        item = getCaseOrCaseDocumentItem(caseId, containerId, pathParts,node,populate);
    }
    else {
        switch ("" + containerId.toLowerCase()) {
            case "documentlibrary":
                item = getDocumentItem(siteId, containerId, pathParts, node, populate);
                break;
            case "blog":
                item = getBlogPostItem(siteId, containerId, pathParts, node, populate);
                break;
            case "discussions":
                item = getForumPostItem(siteId, containerId, pathParts, node, populate);
                break;
            case "calendar":
                item = getCalendarItem(siteId, containerId, pathParts, node, populate);
                break;
            case "wiki":
                item = getWikiItem(siteId, containerId, pathParts, node, populate);
                break;
            case "links":
                item = getLinkItem(siteId, containerId, pathParts, node, populate);
                break;
            case "datalists":
                item = getDataItem(siteId, containerId, pathParts, node, populate);
                break;
        }
    }
    return item;
}

/**
 * Splits the qname path to a node to extract Site information and display path parts.
 * The display path will be truncated to match the overridden root node if present.
 *
 * Returns an array with:
 * [0] = site or null
 * [1] = container or null
 * [2] = remaining part of the cm:name based path to the object - as an array
 */
function splitQNamePath(node, rootNodeDisplayPath, rootNodeQNamePath, qnameOnly) {
    var path = node.qnamePath,
        displayPath = qnameOnly ? null : utils.displayPath(node).split("/"),
        siteId = null, caseId = null,
        containerId = null;

    if (path.match("^" + SITES_SPACE_QNAME_PATH) == SITES_SPACE_QNAME_PATH) {
        // this item is contained within a Site

        // ensure we have not matched a Site folder directly or some node created under the st:sites folder that is not a Site
        var qpathUnderSitesFolder = path.substring(SITES_SPACE_QNAME_PATH.length),
            positionContainer = qpathUnderSitesFolder.indexOf("/");
        if (positionContainer !== -1) {
            // Decode the Site ID from the qname path using the util method - as we may not have displayPath
            // the displayPath will look something like this: ["", "Company Home", "Sites", "MySite", "documentLibrary", "MyFolder"]
            var siteQName = Packages.org.alfresco.util.ISO9075.decode(qpathUnderSitesFolder.substring(0, positionContainer));
            siteId = siteQName.substring(siteQName.indexOf(":") + 1);
            var qpathContainer = qpathUnderSitesFolder.substring(positionContainer + 1);
            var positionUnderContainer = qpathContainer.indexOf("/");
            if (positionUnderContainer !== -1) {
                // extract container id from the qname path - strip off namespace
                containerId = qpathContainer.substring(0, positionUnderContainer);
                containerId = containerId.substring(containerId.indexOf(":") + 1);

                // construct remaining part of the cm:name based display path to the object
                // by removing everything up to the path of the item under the container folder
                if (!qnameOnly) displayPath = displayPath.slice(5, displayPath.length);
            }
        }
    }
    else if (path.match("^" + CASES_SPACE_QNAME_PATH) == CASES_SPACE_QNAME_PATH) {
        // this item is contained within a case
        // ensure we have not matched a Case folder directly or some node created under the oe:Cases folder that is not a case
        var qpathCasesFolder = path.substring(CASES_SPACE_QNAME_PATH.length),
            positionContainer = GetSubstringIndex(qpathCasesFolder, "/", 3), //The case itself
            postContainerPosition = GetSubstringIndex(qpathCasesFolder, "/", 4), //See if we haven't matched just the case folder only
            qpathUnderCasesFolder = qpathCasesFolder.substring(positionContainer + 1);
        positionContainer = qpathUnderCasesFolder.indexOf("/"); //reset the position container accordingly as the path is now shorter
        var substituteDisplayPath = ["oe","case"];

        if (node.hasAspect("oe:titled") && postContainerPosition != -1){
            logger.log("\t\t -----== Skipping the main document folder since we're only interested in the documents under this folder ==------\n\n\n");
            return;
        }

        var decodedCasePath = Packages.org.alfresco.util.ISO9075.decode(qpathUnderCasesFolder);
        caseId = decodedCasePath.match(/([0-9]{8})-([0-9]*)/g);

        if (postContainerPosition !== -1) {
            // Decode the Case ID from the qname path using the util method - as we may not have displayPath
            // the displayPath will look something like this: ["", "Company Home", "Sites", "MySite", "documentLibrary", "MyFolder"]

            var qpathContainer = qpathUnderCasesFolder.substring(positionContainer + 1);
            var positionUnderContainer = qpathContainer.indexOf("/");
            if (positionUnderContainer !== -1) {
                // extract container id from the qname path - strip off namespace
                containerId = qpathContainer.substring(0, positionUnderContainer);
                logger.log("\t\t\t===> search.lib.js - 596  containerId 1st treatment: " + containerId + " <===\n");

                containerId = containerId.substring(containerId.indexOf(":") + 1);
                logger.log("\t\t\t===> search.lib.js - 599  containerId 2nd treatment: " + containerId + " <===\n");

                // construct remaining part of the cm:name based display path to the object
                // by removing everything up to the path of the item under the container folder
                if (!qnameOnly) displayPath = displayPath.slice(5, displayPath.length);
                logger.log("\t\t\t===> search.lib.js - 612  The path parts: " + displayPath.toString() + " <===\n");
                substituteDisplayPath = substituteDisplayPath.concat(caseId).concat(containerId);
                logger.log("\t\t\t===> search.lib.js - 615  The path about to be substituted: " + substituteDisplayPath.toString() + " <===\n");
                displayPath = substituteDisplayPath;
                logger.log("\t\t\t===> search.lib.js - 617  The path after substitution: " + displayPath.toString() + " <===\n\n\n");
            }
        }
        else{
            //We have matched the case itself
            containerId = qpathUnderCasesFolder;
            containerId = containerId.substring(containerId.indexOf(":") + 1);
            displayPath = substituteDisplayPath.concat(caseId).concat("dashboard");
        }
    }
    else {
        // check if we have an overridden root node and the node is under that path
        if (!qnameOnly && rootNodeDisplayPath !== null && path.indexOf(rootNodeQNamePath) === 0) {
            // restructure the display path of the node
            displayPath = displayPath.splice(rootNodeDisplayPath.length);
            // empty element is required at the start of the repository paths - we want to show it as the repo root later
            displayPath.unshift("");
        }
    }

    return [caseId, siteId, containerId, displayPath];
}

/**
 * Processes the search results, extracting the given page of results from the startIndex up to the maxPageResults
 * from the total list of nodes passed in. Filters out unnecessary nodes
 *
 * @return the final search results object
 */
function processResults(nodes, maxPageResults, startIndex, rootNode, meta) {
    // empty cache state
    processedCache = {};
    var results = [],
        added = processed = failed = 0,
        parts,
        item,
        rootNodeDisplayPath = rootNode ? utils.displayPath(rootNode).split("/") : null,
        rootNodeQNamePath = rootNode ? rootNode.qnamePath : null;

    if (logger.isLoggingEnabled())
        logger.log("Processing resultset of length: " + nodes.length);

    startIndex = startIndex ? startIndex : 0;
    for (var i = 0, j = nodes.length; i < j; i++) {
        // For each node we extract the site/container qname path and then
        // let the per-container helper function decide what to do.
        try {
            // We only want to populate node return structures if we are going to add the items to the results,
            // so we skip (process, but don't populate or add to results) until we have reached the startIndex
            // then we populate and add items up to the maxPageResults - after that we still need to process
            // (but don't populate or add to results) each item to correctly calculate the totalRecordsUpper.
            var populate = (processed >= startIndex && added < maxPageResults);
            parts = splitQNamePath(nodes[i], rootNodeDisplayPath, rootNodeQNamePath, !populate);
            item = getItem(parts[0], parts[1], parts[2], parts[3], nodes[i], populate);
            if (item !== null) {
                processed++;
                if (populate) {
                    results.push(item);
                    added++;
                }
            }
            else {
                failed++;
            }
        }
        catch (e) {
            // THOR-833
            if (logger.isWarnLoggingEnabled() == true) {
                logger.warn("search.lib.js: Skipping node due to exception when processing query result: " + e);
                logger.warn("..." + nodes[i].nodeRef);
            }

            failed++;
        }
    }

    if (logger.isLoggingEnabled())
        logger.log("Filtered resultset to length: " + results.length + ". Discarded item count: " + failed);

    return (
    {
        paging: {
            totalRecords: results.length,
            totalRecordsUpper: nodes.length - failed,
            startIndex: startIndex,
            numberFound: meta ? meta.numberFound : -1
        },
        facets: meta ? meta.facets : null,
        items: results,
        spellcheck: meta ? meta.spellcheck : null
    });
}

/**
 * Processes the search results for a single page. Filters out unnecessary nodes
 *
 * @return the final search results object
 */
function processResultsSinglePage(nodes, startIndex, rootNode, meta) {
    // empty cache state
    processedCache = {};
    var results = [],
        failed = 0,
        parts,
        item,
        rootNodeDisplayPath = rootNode ? utils.displayPath(rootNode).split("/") : null,
        rootNodeQNamePath = rootNode ? rootNode.qnamePath : null;

    if (logger.isLoggingEnabled())
        logger.log("Processing resultset of length: " + nodes.length);

    for (var i = 0, j = nodes.length; i < j; i++) {
        // For each node we extract the site/container qname path and then
        // let the per-container helper function decide what to do.
        try {
            parts = splitQNamePath(nodes[i], rootNodeDisplayPath, rootNodeQNamePath, false);
            item = getItem(parts[0], parts[1], parts[2], parts[3], nodes[i], true);
            if (item !== null) {
                results.push(item);
            }
            else {
                failed++;
            }
        }
        catch (e) {
            // THOR-833
            if (logger.isWarnLoggingEnabled() == true) {
                logger.warn("search.lib.js: Skipping node due to exception when processing query result: " + e);
                logger.warn("..." + nodes[i].nodeRef);
            }
            failed++;
        }
    }

    if (logger.isLoggingEnabled())
        logger.log("Filtered resultset to length: " + results.length + ". Discarded item count: " + failed);

    return (
    {
        paging: {
            totalRecords: results.length,
            totalRecordsUpper: -1,
            startIndex: startIndex,
            numberFound: meta ? meta.numberFound : -1
        },
        facets: meta ? meta.facets : null,
        items: results,
        spellcheck: meta ? meta.spellcheck : null
    });
}

/**
 * Helper to escape the QName string so it is valid inside an fts-alfresco query.
 * The language supports the SQL92 identifier standard.
 *
 * @param qname   The QName string to escape
 * @return escaped string
 */
function escapeQName(qname) {
    var separator = qname.indexOf(':'),
        namespace = qname.substring(0, separator),
        localname = qname.substring(separator + 1);

    return escapeString(namespace) + ':' + escapeString(localname);
}

function escapeString(value) {
    var result = "";

    for (var i = 0, c; i < value.length; i++) {
        c = value.charAt(i);
        if (i == 0) {
            if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_')) {
                result += '\\';
            }
        }
        else {
            if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' || c == '$' || c == '#')) {
                result += '\\';
            }
        }
        result += c;
    }
    return result;
}

/**
 * Helper method used to determine whether the property value is multi-valued.
 *
 * @param propValue the property value to test
 * @param modePropValue the logical operand that should be used for multi-value property
 * @return true if it is multi-valued, false otherwise
 */
function isMultiValueProperty(propValue, modePropValue) {
    return modePropValue != null && propValue.indexOf(",") !== -1;
}

/**
 * Helper method used to construct lucene query fragment for a multi-valued property.
 *
 * @param propName property name
 * @param propValue property value (comma separated)
 * @param operand logical operand that should be used
 * @param pseudo is it a pseudo property
 * @return lucene query with multi-valued property
 */
function processMultiValue(propName, propValue, operand, pseudo) {
    var multiValue = propValue.split(","),
        formQuery = "";
    for (var i = 0; i < multiValue.length; i++) {
        if (i > 0) {
            formQuery += ' ' + operand + ' ';
        }

        if (pseudo) {
            formQuery += '(cm:content.' + propName + ':"' + multiValue[i] + '")';
        }
        else {
            formQuery += '(' + escapeQName(propName) + ':"' + multiValue[i] + '")';
        }
    }

    return formQuery;
}

/**
 * Resolve a root node reference to use as the Repository root for a search.
 *
 * NOTE: see ParseArgs.resolveNode()
 *
 * @method resolveRootNode
 * @param reference {string} "virtual" nodeRef, nodeRef or xpath expressions
 * @return {ScriptNode|null} Node corresponding to supplied expression. Returns null if node cannot be resolved.
 */
function resolveRootNode(reference) {
    try {
        var node = null;
        if (reference == "openesdh://cases/home")
            node = caseUtils.resolveCasesHomeNodeRef();
        else node = utils.resolveNodeReference(reference);

        if (node === null) {
            logger.warn("Unable to resolve specified root node reference: " + reference);
        }
        else if (companyhome.nodeRef === node.nodeRef) {
            // default root node - no special handling required
            return null;
        }
        return node;
    }
    catch (e) {
        logger.warn("Unable to resolve specified root node reference: " + reference);
        return null;
    }
}

/**
 * Return Search results with the given search terms.
 *
 * "or" is the default operator, AND and NOT are also supported - as is any other valid fts-alfresco
 * elements such as "quoted terms" and (bracket terms) and also propname:propvalue syntax.
 *
 * @param params  Object containing search parameters - see API description above
 */
function getSearchResults(params) {
    var nodes,
        ftsQuery = "",
        term = params.term,
        tag = params.tag,
        formData = params.query,
        rootNode = params.rootNode ? resolveRootNode(params.rootNode) : null;

    // Simple keyword search and tag specific search
    if (term !== null && term.length !== 0) {
        // TAG is now part of the default search macro
        ftsQuery = term + " ";
    }
    else if (tag !== null && tag.length !== 0) {
        // Just look for tag
        ftsQuery = "TAG:" + tag + " ";
    }

    // Advanced search form data search.
    // Supplied as json in the standard Alfresco Forms data structure:
    //    prop_<name>:value|assoc_<name>:value
    //    name = namespace_propertyname|pseudopropertyname
    //    value = string value - comma separated for multi-value, no escaping yet!
    // - underscore represents colon character in name
    // - pseudo property is one of any cm:content url property: mimetype|encoding|size
    // - always string values - interogate DD for type data
    // - an additional "-mode" suffixed parameter for a value is allowed to specify
    //   either an AND or OR join condition for multi-value property searches
    if (formData !== null && formData.length !== 0) {
        var formQuery = "",
            formJson = jsonUtils.toObject(formData);

        // extract form data and generate search query
        var first = true;
        var useSubCats = false;
        for (var p in formJson) {
            // retrieve value and check there is someting to search for
            // currently all values are returned as strings
            var propValue = formJson[p], modePropValue = formJson[p + "-mode"];
            if (propValue.length !== 0) {
                if (p.indexOf("prop_") === 0 && p.match("-mode$") != "-mode") {
                    // found a property - is it namespace_propertyname or pseudo property format?
                    var propName = p.substr(5);
                    if (propName.indexOf("_") !== -1) {
                        // property name - convert to DD property name format
                        propName = propName.replace("_", ":");

                        // special case for range packed properties
                        if (propName.match("-range$") == "-range") {
                            // currently support text based ranges (usually numbers) or date ranges
                            // range value is packed with a | character separator

                            // if neither value is specified then there is no need to add the term
                            if (propValue.length > 1) {
                                var from, to, sepindex = propValue.indexOf("|");
                                if (propName.match("-date-range$") == "-date-range") {
                                    // date range found
                                    propName = propName.substr(0, propName.length - "-date-range".length)

                                    // work out if "from" and/or "to" are specified - use MIN and MAX otherwise;
                                    // we only want the "YYYY-MM-DD" part of the ISO date value - so crop the strings
                                    from = (sepindex === 0 ? "MIN" : propValue.substr(0, 10));
                                    to = (sepindex === propValue.length - 1 ? "MAX" : propValue.substr(sepindex + 1, 10));
                                }
                                else {
                                    // simple range found
                                    propName = propName.substr(0, propName.length - "-range".length);

                                    // work out if "min" and/or "max" are specified - use MIN and MAX otherwise
                                    from = (sepindex === 0 ? "MIN" : propValue.substr(0, sepindex));
                                    to = (sepindex === propValue.length - 1 ? "MAX" : propValue.substr(sepindex + 1));
                                }
                                formQuery += (first ? '' : ' AND ') + escapeQName(propName) + ':"' + from + '".."' + to + '"';
                                first = false;
                            }
                        }
                        else if (propName.indexOf("cm:categories") != -1) {
                            // determines if the checkbox use sub categories was clicked
                            if (propName.indexOf("usesubcats") == -1) {
                                if (formJson["prop_cm_categories_usesubcats"] == "true") {
                                    useSubCats = true;
                                }

                                // build list of category terms to search for
                                var firstCat = true;
                                var catQuery = "";
                                var cats = propValue.split(',');
                                for (var i = 0; i < cats.length; i++) {
                                    var cat = cats[i];
                                    var catNode = search.findNode(cat);
                                    if (catNode) {
                                        catQuery += (firstCat ? '' : ' OR ') + "PATH:\"" + catNode.qnamePath + (useSubCats ? "//*\"" : "/member\"" );
                                        firstCat = false;
                                    }
                                }

                                if (catQuery.length !== 0) {
                                    // surround category terms with brackets if appropriate
                                    formQuery += (first ? '' : ' AND ') + "(" + catQuery + ")";
                                    first = false;
                                }
                            }
                        }
                        else if (isMultiValueProperty(propValue, modePropValue)) {
                            formQuery += (first ? '(' : ' AND (');
                            formQuery += processMultiValue(propName, propValue, modePropValue, false);
                            formQuery += ')';
                            first = false;
                        }
                        else {
                            if (propValue.charAt(0) === '"' && propValue.charAt(propValue.length - 1) === '"') {
                                formQuery += (first ? '' : ' AND ') + escapeQName(propName) + ':' + propValue;
                            }
                            else {
                                var index = propValue.lastIndexOf(" ");
                                formQuery += (first ? '' : ' AND ') + escapeQName(propName)
                                if (index > 0 && index < propValue.length - 1) {
                                    formQuery += ':(' + propValue + ')';
                                }
                                else {
                                    formQuery += ':"' + propValue + '"';
                                }
                            }
                            first = false;
                        }
                    }
                    else {
                        if (isMultiValueProperty(propValue, modePropValue)) {
                            // multi-valued pseudo cm:content property - e.g. mimetype, size or encoding
                            formQuery += (first ? '(' : ' AND (');
                            formQuery += processMultiValue(propName, propValue, modePropValue, true);
                            formQuery += ')';
                        }
                        else {
                            // single pseudo cm:content property - e.g. mimetype, size or encoding
                            formQuery += (first ? '' : ' AND ') + 'cm:content.' + propName + ':"' + propValue + '"';
                        }
                        first = false;
                    }
                }
            }
        }

        if (formQuery.length !== 0 || ftsQuery.length !== 0) {
            // extract data type for this search - advanced search query is type specific
            ftsQuery = 'TYPE:"' + formJson.datatype + '"' +
                (formQuery.length !== 0 ? ' AND (' + formQuery + ')' : '') +
                (ftsQuery.length !== 0 ? ' AND (' + ftsQuery + ')' : '');
        }
    }

    if (ftsQuery.length !== 0) {
        if (params.filters != null) {
            // comma separated list of filter pairs - filter|value|value|...
            var filters = params.filters.split(",");
            for (var f = 0; f < filters.length; f++) {
                var filterParts = filters[f].split("|");
                if (filterParts.length > 1) {
                    // special case for some filters e.g. TYPE content or folder
                    switch (filterParts[0]) {
                        case "TYPE":
                        {
                            ftsQuery += ' AND +TYPE:"' + filterParts[1] + '"';
                            break;
                        }
                        default:
                        {
                            // facet filtering selection - reduce query results
                            // bracket each filter part within the attribute statement
                            ftsQuery += ' AND (' + filterParts[0] + ':(';
                            for (var p = 1; p < filterParts.length; p++) {
                                ftsQuery += '"' + filterParts[p] + '" ';  // space separated values
                            }
                            ftsQuery += '))';
                            break;
                        }
                    }
                }
            }
        }

        // ensure a TYPE is specified - if no add one to remove system objects from result sets
        if (ftsQuery.indexOf("TYPE:\"") === -1 && ftsQuery.indexOf("TYPE:'") === -1) {
            ftsQuery += ' AND (+TYPE:"cm:content" OR +TYPE:"cm:folder")';
        }

        // we processed the search terms, so suffix the PATH query
        var path = null;
        var site = null;
        if (!params.repo) {
            if (params.siteId !== null && params.siteId.length > 0) {
                if (params.containerId !== null && params.containerId.length > 0) {
                    // using PATH to restrict to container and site
                    path = SITES_SPACE_QNAME_PATH;
                    path += "cm:" + search.ISO9075Encode(params.siteId) + "/";
                    path += "cm:" + search.ISO9075Encode(params.containerId) + "/";
                }
                else {
                    // use SITE syntax to restrict to specific site
                    site = "SITE:\"" + params.siteId + "\"";
                }
            }
            else {
                if (params.containerId !== null && params.containerId.length > 0) {
                    // using PATH to restrict to container and site
                    path = SITES_SPACE_QNAME_PATH;
                    path += "*/";
                    path += "cm:" + search.ISO9075Encode(params.containerId) + "/";
                }
                else {
                    // use SITE syntax to restrict to specific site
                    site = "SITE:\"_ALL_SITES_\"";
                }
            }
        }

        // root node - generally used for overridden Repository root in Share
        if (params.repo && rootNode !== null) {
            ftsQuery = 'PATH:"' + rootNode.qnamePath + '//*" AND (' + ftsQuery + ')';
        }
        else if (path !== null) {
            ftsQuery = 'PATH:"' + path + '/*" AND (' + ftsQuery + ')';
        }
        else if (site !== null) {
            ftsQuery = site + ' AND (' + ftsQuery + ')';
        }
        ftsQuery = '(' + ftsQuery + ') AND -TYPE:"cm:thumbnail" AND -TYPE:"cm:failedThumbnail" AND -TYPE:"cm:rating" AND -TYPE:"st:site"' +
            ' AND -ASPECT:"st:siteContainer" AND -ASPECT:"sys:hidden" AND -cm:creator:system AND -QNAME:comment\\-*';

        // sort field - expecting field to in one of the following formats:
        //  - short QName form such as: cm:name
        //  - pseudo cm:content field starting with "." such as: .size
        //  - any other directly supported search field such as: TYPE
        var sortColumns = [];
        var sort = params.sort;
        if (sort != null && sort.length != 0) {
            var asc = true;
            var separator = sort.indexOf("|");
            if (separator != -1) {
                asc = (sort.substring(separator + 1) == "true");
                sort = sort.substring(0, separator);
            }
            var column;
            if (sort.charAt(0) == '.') {
                // handle pseudo cm:content fields
                column = "@{http://www.alfresco.org/model/content/1.0}content" + sort;
            }
            else if (sort.indexOf(":") != -1) {
                // handle attribute field sort
                column = "@" + utils.longQName(sort);
            }
            else {
                // other sort types e.g. TYPE
                column = sort;
            }
            sortColumns.push(
                {
                    column: column,
                    ascending: asc
                });
        }

        if (logger.isLoggingEnabled())
            logger.log("Query:\r\n" + ftsQuery + "\r\nSortby: " + (sort != null ? sort : ""));

        // perform fts-alfresco language query
        var qt = getQueryTemplate();
        var queryDef = {
            query: ftsQuery,
            language: "fts-alfresco",
            page: {
                maxItems: params.maxResults > 0 ? params.maxResults + 1 : params.pageSize,
                skipCount: params.maxResults > 0 ? 0 : params.startIndex
            },
            templates: qt.template,
            defaultField: "keywords",
            defaultOperator: qt.operator,
            onerror: "no-results",
            sort: sortColumns,
            fieldFacets: params.facetFields != null ? params.facetFields.split(",") : null,
            searchTerm: params.term,
            spellCheck: params.spell
        };
        var rs = search.queryResultSet(queryDef);
        nodes = rs.nodes;
    }
    else {
        // failed to process the search string - empty list returned
        var rs = {};
        nodes = [];
    }

    if (params.maxResults > 0) {
        return processResults(
            nodes,
            params.maxResults,
            params.startIndex,
            rootNode,
            rs.meta);
    }
    else {
        return processResultsSinglePage(
            nodes,
            params.startIndex,
            rootNode,
            rs.meta);
    }
}

/**
 * Return the fts-alfresco query template to use.
 * The default searches name, title, descripton, calendar, link, full text and tag fields.
 * It is configurable via the .config.xml attached to this webscript.
 */
function getQueryTemplate() {
    var t =
            [{
                field: "keywords",
                template: "%(cm:name cm:title cm:description ia:whatEvent ia:descriptionEvent lnk:title lnk:description TEXT TAG)"
            }],
        xml = new XML(config.script),
        qt = xml["default-query-template"];
    if (qt != null && qt.length() != 0) {
        t[0].template = qt.toString();
    }

    // get default fts operator from the config
    //
    // TODO: common search lib - for both live and standard e.g. to get values like this...
    //
    var operator = "AND",
        cf = xml["default-operator"];
    if (cf != null && cf.length != 0) {
        operator = cf.toString();
    }

    return {
        template: t,
        operator: operator
    };
}