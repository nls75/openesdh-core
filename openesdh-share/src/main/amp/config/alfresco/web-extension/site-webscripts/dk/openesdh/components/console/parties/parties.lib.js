<import resource="classpath:/alfresco/web-extension/site-webscripts/dk/openesdh/utils/parties.js">//</import>

function generatePartyTableView(partyType) {
    var partyTypeId = partyType.replace(":", "_");
    return {
        name: "openesdh/common/widgets/lists/views/DynamicColumnsTableView",
        config: {
            itemType: partyType,
            columnsReadyTopic: "PARTY_LIST_SHOW_ALL",

            additionalCssClasses: "bordered",

            widgets: [
                {
                    name: "alfresco/documentlibrary/views/layouts/Row",
                    config: {}
                }
            ],
            extraWidgetsForHeader: [
                {
                    name: "alfresco/documentlibrary/views/layouts/HeaderCell",
                    config: {
                        label: msg.get("parties.tool.actions"),
                        sortable: false
                    }
                }
            ],
            extraRowWidgets: [
                {
                    name: "alfresco/documentlibrary/views/layouts/Cell",
                    config: {
                        additionalCssClasses: "mediumpad",
                        widgets: [
                            {
                                name: "openesdh/common/widgets/renderers/PublishAction",
                                config: {
                                    iconClass: "edit-16",
                                    altText: msg.get("parties.tool.edit." + partyTypeId + ".action"),
                                    publishTopic: "LEGACY_EDIT_FORM_DIALOG",
                                    publishPayloadType: "PROCESS",
                                    publishPayload: {
                                        dialogTitle: msg.get("parties.tool.edit." + partyTypeId),
                                        nodeRef: "{nodeRef}",
                                        successResponseTopic: "PARTY_LIST_RELOAD"
                                    },
                                    publishGlobal: true,
                                    publishPayloadModifiers: ["processCurrentItemTokens"]
                                }
                            },
                            {
                                name: "openesdh/common/widgets/renderers/PublishAction",
                                config: {
                                    iconClass: "delete-16",
                                    altText: msg.get("parties.tool.delete." + partyTypeId + ".action"),
                                    publishTopic: "ALF_CRUD_DELETE",
                                    publishPayloadType: "PROCESS",
                                    publishPayload: {
                                        // TODO: We are abusing this URL a bit.
                                        // It is intended for deleting data lists, but we are deleting individual nodes
                                        url: "slingshot/datalists/list/node/{nodeRef}",
                                        confirmationTitle: msg.get("parties.tool.delete." + partyTypeId + ".confirmation.title"),
                                        confirmationPrompt: msg.get("parties.tool.delete." + partyTypeId + ".confirmation.message"),
                                        requiresConfirmation: true,
                                        successMessage: msg.get("parties.tool.delete." + partyTypeId + ".success")
                                    },
                                    publishGlobal: true,
                                    publishPayloadModifiers: ["processCurrentItemTokens", "convertNodeRefToUrl"]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };
}

function generatePartyPageWidgets(partyType) {
    var partyTypeId = partyType.replace(":", "_");

    var partiesFolderNodeRef = getPartiesFolderNodeRef();

    var partyListViews = [generatePartyTableView(partyType)];

    // TODO: Add browse hierarchy view for Organizations parties

    var partyList = {
        name: "openesdh/common/widgets/lists/PartyList",
        config: {
            partyType: partyType,

            loadDataPublishTopic: "ALF_CRUD_GET_ALL",
            itemsProperty: "items",
            widgets: partyListViews
        }
    };

    return {
        name: "alfresco/layout/VerticalWidgets",
        config: {
            baseClass: "side-margins",
            widgets: [
                {
                    name: "alfresco/html/Spacer",
                    config: {
                        height: "14px"
                    }
                },
                {
                    name: "alfresco/layout/HorizontalWidgets",
                    config: {
                        widgets: [
                            {
                                name: "alfresco/layout/VerticalWidgets",
                                config: {
                                    widgets: [
                                        {
                                            name: "alfresco/html/Heading",
                                            config: {
                                                label: msg.get("parties.tool.heading." + partyTypeId),
                                                level: 2
                                            }
                                        },
                                        {
                                            name: "alfresco/html/Spacer",
                                            config: {
                                                height: "8px"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                name: "alfresco/layout/HorizontalWidgets",
                                config: {
                                    widgets: [
                                        {
                                            name: "alfresco/buttons/AlfDynamicPayloadButton",
                                            config: {
                                                label: msg.get("parties.tool.create." + partyTypeId),
                                                additionalCssClasses: "call-to-action",
                                                publishTopic: "LEGACY_CREATE_FORM_DIALOG",
                                                publishPayloadType: "PROCESS",
                                                publishPayloadModifiers: ["processDataBindings"],
                                                publishPayload: {
                                                    nodeRef: partiesFolderNodeRef,
                                                    itemType: partyType,
                                                    dialogTitle: msg.get("parties.tool.create." + partyTypeId),
                                                    successResponseTopic: "PARTY_LIST_SHOW_ALL"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    name: "openesdh/common/widgets/forms/SingleTextFieldForm",
                    config: {
                        useHash: false,
                        showOkButton: true,
                        okButtonLabel: msg.get("parties.tool.search.button"),
                        showCancelButton: false,
                        okButtonPublishTopic: "PARTY_LIST_SEARCH",
                        okButtonPublishGlobal: true,
                        textBoxLabel: msg.get("parties.tool.search.button"),
                        textFieldName: "term",
                        okButtonIconClass: "alf-white-search-icon",
                        okButtonClass: "call-to-action",
                        textBoxIconClass: "alf-search-icon",
                        textBoxCssClasses: "long",
                        textBoxRequirementConfig: {
                            initialValue: false
                        }
                    }
                },
                partyList,
                {
                    name: "alfresco/layout/CenteredWidgets",
                    config: {
                        widgets: [
                            {
                                id: "PARTIES_PAGINATION_MENU",
                                name: "alfresco/documentlibrary/AlfDocumentListPaginator",
                                widthCalc: 430
                            }
                        ]
                    }
                }
            ]
        }
    }
}