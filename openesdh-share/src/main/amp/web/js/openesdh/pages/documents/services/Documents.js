define(["dojo/_base/declare",
        "alfresco/core/Core",
        "alfresco/core/CoreXhr",
        "dojo/_base/array",
        "dojo/_base/lang",
        "openesdh/pages/_TopicsMixin",
        "alfresco/dialogs/AlfFormDialog"],
    function (declare, AlfCore, CoreXhr, array, lang, _TopicsMixin, AlfFormDialog) {

        return declare([AlfCore, CoreXhr, _TopicsMixin], {

            destinationNodeRef: null,

            caseNodeRef: "",
            documentsNodeRef: "",

            constructor: function (args) {

                console.log("CONSTRUCTOR documents");

                this.caseNodeRef = args.caseNodeRef;
                this.alfSubscribe("OE_SHOW_UPLOADER", lang.hitch(this, this._showUploader));
                this.alfSubscribe("ALF_CONTENT_SERVICE_UPLOAD_REQUEST_RECEIVED", lang.hitch(this, this._onFileUploadRequest));

                lang.mixin(this, args);
                this._documents(true);
            },

            _documents: function (domSafe) {
                console.log("GET documents");

                var successCallback = domSafe ? this._onSuccessCallbackDomSafe : this._onSuccessCallback;

                // Get documents from webscript
                var url = Alfresco.constants.PROXY_URI + "api/openesdh/documents?nodeRef=" + this.caseNodeRef;
                this.serviceXhr({
                    url: url,
                    method: "GET",
                    successCallback: successCallback,
                    callbackScope: this});
            },

            _onSuccessCallbackDomSafe: function (response, config) {
                console.log("CALLBACK documents domsafe");

                this.documentsNodeRef = response.documentsNodeRef;

                var domReadyFunction = (function (scope) {
                    return function () {
                        console.log("PUBLISH documents " + response.documents);
                        scope.alfPublish(scope.DocumentsTopic, response.documents);
                        scope.alfPublish("ALF_UPDATE_PAGE_TITLE", {title: response["caseTitle"]});
                    }
                })(this);

                require(["dojo/ready"], function (ready) {
                    // will not be called until DOM is ready
                    ready(domReadyFunction);
                });
            },

            _onSuccessCallback: function (response, config) {
                console.log("CALLBACK documents");

                this.documentsNodeRef = response.documentsNodeRef;

                console.log("PUBLISH documents " + response.documents);
                this.alfPublish(this.DocumentsTopic, response.documents);
                this.alfPublish("ALF_UPDATE_PAGE_TITLE", {title: response["caseTitle"]});
            },

            /**
             * This function will open a [AlfFormDialog]{@link module:alfresco/forms/AlfFormDialog} containing a
             * [file select form control]{@link module:alfresco/forms/controls/FileSelect} so that the user can
             * select one or more files to upload. When the dialog is confirmed the
             * [_onFileUploadRequest]{@link module:alfresco/services/ContentService#_onFileUploadRequest}
             * function will be called to destroy the dialog and pass the upload request on.
             *
             * @instance
             * @param {object} payload
             */
            _showUploader: function alfresco_services_ContentService__showUploader(payload) {

                this.uploadDialog = new AlfFormDialog({
                    dialogTitle: "Select files to upload",
                    dialogConfirmationButtonTitle: "Upload",
                    dialogCancellationButtonTitle: "Cancel",
                    formSubmissionTopic: "ALF_CONTENT_SERVICE_UPLOAD_REQUEST_RECEIVED",
                    formSubmissionPayload: {
                        targetData: {
                            destination: this.documentsNodeRef,
                            siteId: null,
                            containerId: null,
                            uploadDirectory: null,
                            updateNodeRef: null,
                            description: "",
                            overwrite: false,
                            thumbnails: "doclib",
                            username: null
                        }
                    },
                    widgets: [
                        {
                            name: "alfresco/forms/controls/FileSelect",
                            config: {
                                label: "Select files to upload...",
                                name: "files"
                            }
                        }
                    ]
                });
                this.uploadDialog.show();
            },

            /**
             * This function will be called whenever the [AlfFormDialog]{@link module:alfresco/forms/AlfFormDialog} created
             * by the [showUploader function]{@link module:alfresco/services/ContentService#showUploader} is confirmed to
             * trigger a dialog. This will destroy the dialog and pass the supplied payload onto the [AlfUpload]{@link module:alfresco/upload/AlfUpload}
             * module to actually perform the upload. It is necessary to destroy the dialog to ensure that all the subscriptions
             * are removed to prevent subsequent upload requests from processing old data.
             *
             * @instance
             * @param {object} payload The file upload data payload to pass on
             */
            _onFileUploadRequest: function alfresco_services_ContentService__onFileUploadRequest(payload) {
                if (this.uploadDialog != null) {
                    this.uploadDialog.destroyRecursive();
                }
                var responseTopic = this.generateUuid();
                this._uploadSubHandle = this.alfSubscribe(responseTopic, lang.hitch(this, "_onFileUploadComplete"), true);
                payload.alfResponseTopic = responseTopic;
                this.alfPublish("ALF_UPLOAD_REQUEST", payload);
            },

            /**
             * This function is called once the document upload is complete. It publishes a request to reload the
             * current document list data.
             *
             * @instance
             */
            _onFileUploadComplete: function alfresco_services_ContentService__onFileUploadComplete() {
                this.alfLog("log", "Upload complete");
                this.alfUnsubscribe(this._uploadSubHandle);
                //this.alfPublish(this.reloadDataTopic, {});
                this._documents(false);
            }
        });
    });