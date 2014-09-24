define(["dojo/_base/declare",
        "alfresco/core/Core",
        "alfresco/core/CoreXhr",
        "dojo/_base/array",
        "dojo/_base/lang",
        "openesdh/common/services/_CaseMembersServiceTopicsMixin"],
    function (declare, AlfCore, CoreXhr, array, lang, _CaseMembersServiceTopicsMixin) {

        return declare([AlfCore, CoreXhr, _CaseMembersServiceTopicsMixin], {

            nodeRef: "",

            constructor: function (args) {
                lang.mixin(this, args);
                this.alfSubscribe(this.CaseMembersChangeRoleTopic, lang.hitch(this, "_onCaseMemberChangeRole"));
                this.alfSubscribe(this.CaseMembersRemoveRoleTopic, lang.hitch(this, "_onCaseMemberRemoveRole"));
                this.alfSubscribe(this.CaseMembersGet, lang.hitch(this, "_loadCaseMembers"));
            },

            _loadCaseMembers: function () {
                // Get members from webscript
                this.serviceXhr({
                    url: Alfresco.constants.PROXY_URI + "api/openesdh/casemembers",
                    query: {
                        nodeRef: this.nodeRef
                    },
                    method: "GET",
                    successCallback: function (response, config) {
                        this.alfPublish(this.CaseMembersTopic, {members: response});
                    },
                    callbackScope: this
                });
            },

            _onCaseMemberChangeRole: function (payload) {
                this.alfLog("debug", "Change", payload.authority, "from role", payload.oldRole, "to role", payload.newRole);
                this.serviceXhr({
                    url: Alfresco.constants.PROXY_URI + "api/openesdh/casemembers",
                    method: "POST",
                    query: {
                        nodeRef: this.nodeRef,
                        authority: payload.authority,
                        fromRole: payload.oldRole,
                        role: payload.newRole
                    },
                    successCallback: payload.successCallback,
                    failureCallback: payload.failureCallback
                });
            },

            _onCaseMemberRemoveRole: function (payload) {
                this.alfLog("debug", "Remove", payload.authority, "from role", payload.role);
                this.serviceXhr({
                    url: Alfresco.constants.PROXY_URI + "api/openesdh/casemembers",
                    method: "DELETE",
                    query: {
                        nodeRef: this.nodeRef,
                        authority: payload.authority,
                        role: payload.role
                    },
                    successCallback: payload.successCallback,
                    failureCallback: payload.failureCallback
                });
            }
        });
    });