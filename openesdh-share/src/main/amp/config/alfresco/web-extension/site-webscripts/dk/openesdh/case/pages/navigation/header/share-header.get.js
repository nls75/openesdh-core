<import resource="classpath:/alfresco/web-extension/site-webscripts/dk/openesdh/utils/oe.js">
<import resource="classpath:/alfresco/web-extension/site-webscripts/dk/openesdh/utils/case.js">

var args = page.url.args;
var caseId = url.templateArgs.caseId;

//In the case of some pages (e.g. document details) we need to get the caseId in reverse
// i.e. from the nodeRef
if (caseId == null){
    if ( (caseId = getCaseIdFromNodeRef(args.nodeRef)) ) ;
    else if ( (caseId = getCaseIdFromNodeRef(args.targetCase)) ) ;// from start-workflow page
}

var isReadOnly = !hasWritePermission(caseId);

var nodeRef = getCaseNodeRefFromId(caseId);
var navMenu = widgetUtils.findObject(model.jsonModel, "id", "HEADER_NAVIGATION_MENU_BAR");

navMenu.config.widgets.push({
    id: "HEADER_CASE_DASHBOARD",
    name: "alfresco/menus/AlfMenuBarItem",
    config: {
        label: "header.document.case.dashboard" ,
        title: "header.document.case.dashboard.altText",
        targetUrl: "oe/case/"+caseId+"/dashboard",
        selected: isOnCasePage("dashboard")
    }
});

navMenu.config.widgets.push({
    id: "HEADER_CASE_DOCUMENTS",
    name: "alfresco/menus/AlfMenuBarItem",
    config: {
        label: "header.case.documents" ,
        title: "header.case.documents.altText",
        targetUrl: "oe/case/"+caseId+"/documents",
        selected: isOnCasePage("documents")
    }
});

//TODO The link to this page does not work. The service call for the data is not correct. Why is this so?
navMenu.config.widgets.push({
    id: "HEADER_CASE_MEMBERS",
    name: "alfresco/menus/AlfMenuBarItem",
    config: {
        label: "header.case.members.title",
        title: "header.case.members.altText",
        targetUrl: "oe/case/"+caseId+"/members",
        selected: isOnCasePage("members")
    }
});

navMenu.config.widgets.push({
    id: "HEADER_CASE_PARTIES",
    name: "alfresco/menus/AlfMenuBarItem",
    config: {
        label: "header.case.parties.title",
        title: "header.case.parties.altText",
        targetUrl: "oe/case/"+caseId+"/parties",
        selected: isOnCasePage("parties")
    }
});

navMenu.config.widgets.push({
    id: "HEADER_CASE_HISTORY",
    name: "alfresco/menus/AlfMenuBarItem",
    config: {
        label: "header.case.history.title",
        title: "header.case.history.altText",
        targetUrl: "oe/case/"+caseId+"/history",
        selected: isOnCasePage("history")
    }
});

function initCaseConfigDropdown(){
    if(isReadOnly){
        return;
    }
    
    // Create the basic site configuration menu...
    var caseConfig = {
        id: "HEADER_CASE_CONFIGURATION_DROPDOWN",
        name: "alfresco/menus/AlfMenuBarPopup",
        config: {
            label: "",
            iconClass: "alf-configure-icon",
            iconAltText: "header.case.config.altText",
      //      title: "header.case.config.title", does not work :-(
            widgets: []
        }
    };


    caseConfig.config.widgets.push({
        id: "HEADER_CASE_EDIT",
        name: "alfresco/menus/AlfMenuBarItem",
        config: {
            label: "header.case.edit" ,
            iconClass: "alf-cog-icon",
            targetUrl: "edit-metadata?nodeRef=" + nodeRef,
            visibilityConfig: {
                initialValue: false,
                rules: [
                    {
                        topic: "CASE_INFO",
                        attribute: "isJournalized",
                        isNot: [true]
                    }
                ]
            }
        }
    });

    caseConfig.config.widgets.push({
        id: "HEADER_CASE_JOURNALIZE",
        name: "alfresco/menus/AlfMenuBarItem",
        config: {
            label: "header.case.journalize",
            iconClass: "alf-cog-icon",

            publishTopic: "OPENESDH_JOURNALIZE",
            publishPayload: {},
            visibilityConfig: {
                initialValue: false,
                rules: [
                    {
                        topic: "CASE_INFO",
                        attribute: "canClose",
                        is: [true]
                    }
                ]
            }
        }
    });

    caseConfig.config.widgets.push({
        id: "HEADER_CASE_UNJOURNALIZE",
        name: "alfresco/menus/AlfMenuBarItem",
        config: {
            label: "header.case.unjournalize",
            iconClass: "alf-cog-icon",

            publishTopic: "OPENESDH_UNJOURNALIZE",
            publishPayload: {},
            visibilityConfig: {
                initialValue: false,
                rules: [
                    {
                        topic: "CASE_INFO",
                        attribute: "canReopen",
                        is: [true]
                    }
                ]
            }
        }
    });
    var verticalLayout = widgetUtils.findObject(model.jsonModel, "id", "SHARE_VERTICAL_LAYOUT");

    verticalLayout.config.widgets.push({
        id: "HEADER_CASE_JOURNALIZED_WARNING",
        name: "alfresco/header/Warning",
        config: {
            warnings: [{
                message: msg.get("warning.case.journalized"),
                level: 1
            }],
            visibilityConfig: {
                initialValue: false,
                rules: [
                    {
                        topic: "CASE_INFO",
                        attribute: "isJournalized",
                        is: [true]
                    }
                ]
            }
        }
    });

    navMenu.config.widgets.push(caseConfig);
}

initCaseConfigDropdown();
