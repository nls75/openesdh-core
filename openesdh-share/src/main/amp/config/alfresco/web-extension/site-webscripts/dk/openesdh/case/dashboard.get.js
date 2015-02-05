var caseNodeRef = url.args.nodeRef;
var caseId = url.templateArgs.caseId;

model.jsonModel = {
    services: [ "alfresco/services/CrudService", "openesdh/common/services/CaseMembersService" ],
    widgets: [{
            name: "alfresco/layout/HorizontalWidgets",
            config: {
                widgetMarginLeft: 10,
                widgetMarginRight: 10,
                widgetWidth: 50,
                widgets: [
                    { name: "openesdh/common/widgets/dashlets/CaseInfoDashlet" },
                    { id: "CASE_MEMBERS_DASHLET",
                      name: "alfresco/layout/HorizontalWidgets",
                      align: "right",
                      config: {
                            widgetWidth: 50,
                            widgets: [{
                                name: "openesdh/common/widgets/dashlets/CaseMembersDashlet",
                                config:{
                                    caseId : caseId
                                }
                            }]
                      }
                    },
                    {
                        name: "openesdh/common/widgets/dashlets/CaseHistoryDashlet"
                    }
                ]
            }
    }]

};