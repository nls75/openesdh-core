<import resource="classpath:/alfresco/web-extension/site-webscripts/dk/openesdh/utils/case.js">

var caseId = url.templateArgs.caseId;
var caseNodeRef = getCaseNodeRefFromId(caseId);

model.jsonModel = {
    services: [
        "alfresco/services/CrudService",
        "openesdh/common/services/CaseMembersService",
        //"alfresco/dialogs/AlfDialogService"
    ],
    widgets: [{
            name: "alfresco/layout/HorizontalWidgets",
            config: {
                widgetMarginLeft: 10,
                widgetMarginRight: 10,
                widgetWidth: 50,
                widgets: [
                    {
                        name: "alfresco/layout/VerticalWidgets",
                        config: {
                            widgets: [
                                {
                                    id: "CASE_INFO_DASHLET",
                                    name: "openesdh/common/widgets/dashlets/CaseInfoDashlet"
                                },
                                {
                                    id: "CASE_NOTES_DASHLET",
                                    name: "openesdh/common/widgets/dashlets/NotesDashlet",
                                    config: {
                                        nodeRef: caseNodeRef

                                    }
                                }
                            ]
                        }
                    },
                    {
                        name: "alfresco/layout/VerticalWidgets",
                        config: {
                            widgets: [
                                {
                                    id: "CASE_HISTORY_DASHLET",
                                    name: "openesdh/common/widgets/dashlets/CaseHistoryDashlet",
                                    config: {
                                        nodeRef: caseNodeRef
                                    }
                                },
                                {
                                    id: "CASE_MEMBERS_DASHLET",
                                    name: "openesdh/common/widgets/dashlets/CaseMembersDashlet",
                                    config:{
                                        caseId : caseId
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
    }]

};