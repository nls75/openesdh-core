/**
 * Category picker control widget.
 */
define(["dojo/_base/declare",
        "dijit/_WidgetBase",
        "alfresco/core/Core",
        "dijit/_TemplatedMixin",
        "dojo/text!./templates/CategoryPickerControl.html",
        "dojo/store/Memory",
        "dojo/store/JsonRest",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/on",
        "dojo/dom-class",
        "dojo/dom-construct",
        "alfresco/buttons/AlfButton",
        "alfresco/dialogs/AlfDialog",
        "openesdh/common/widgets/controls/category/CategoryPicker"],
    function (declare, _Widget, AlfCore, _Templated, template, Memory, JsonRest, lang, array, on, domClass, domConstruct, AlfButton, AlfDialog, CategoryPicker) {

        return declare([_Widget, AlfCore, _Templated], {

            templateString: template,

            cssRequirements: [
                {cssFile: "./css/CategoryPickerControl.css"},
                {cssFile: "./css/CategoryPicker.css"},
                {cssFile: "./css/CategoryItem.css"}
            ],

            i18nRequirements: [
                {i18nFile: "./i18n/CategoryPickerControl.properties"}
            ],


            /**
             * The widget to use for the picker.
             *
             * @instance
             * @default "openesdh/common/widgets/controls/category/CategoryPicker"
             * @type string
             */
            pickerWidget: "openesdh/common/widgets/controls/category/CategoryPicker",

            /**
             * The NodeRef of the root category
             *
             * @instance
             * @default null
             * @type string
             */
            rootNodeRef: null,

            /**
             * Whether the picker should allow multiple selections.
             *
             * @instance
             * @default false
             * @type boolean
             */
            multipleSelect: false,

            /**
             * Whether or not the first level items in the picker can be chosen.
             *
             * @instance
             * @default false
             * @type boolean
             */
            canPickFirstLevelItems: false,

            /**
             * The current path as an array of strings.
             *
             * @instance
             * @default null
             * @type string[]
             */
            path: null,

            /**
             * The items currently selected.
             *
             * @instance
             * @default null
             * @type string[]
             */
            selectedItems: null,

            /**
             * The message key for the title of the picker dialog.
             *
             * @instance
             * @default "picker.dialog.title"
             * @type string
             */
            titleMessageKey: "picker.dialog.title",

            constructor: function () {
                this.inherited(arguments);
            },

            postCreate: function () {
                this.inherited(arguments);

                this.pubSubScope = this.id;

                var selectButton = new AlfButton({
                    label: this.message("button.select"),
                    onClick: lang.hitch(this, "_onSelectClick")
                });

                selectButton.placeAt(this.selectButtonNode);

                this.alfSubscribe("CATEGORY_PICKER_DIALOG_OK", lang.hitch(this, "_onDialogOK"));
                this.alfSubscribe("CATEGORY_PICKER_DIALOG_CANCEL", lang.hitch(this, "_onDialogCancel"));
                this.alfSubscribe("CATEGORY_PICKER_DIALOG_CLEAR", lang.hitch(this, "_onDialogClear"));
            },

            _onDialogOK: function (payload) {
                if (this.dialog) {
                    var selectedItems = ("selectedItems" in payload &&
                        payload.selectedItems) ||
                        payload.dialogContent[0].selectedItems;

                    this.dialog.hide();
                    this.dialog.destroyRecursive();

                    this.set("selectedItems", selectedItems);
                    console.log("OK", payload);
                }
            },

            _onDialogClear: function (payload) {
                if (this.dialog) {
                    this.dialog.hide();
                    this.dialog.destroyRecursive();
                }
                this.set("selectedItems", {});
            },

            _setSelectedItemsAttr: function (selectedItems) {
                this._set("selectedItems", selectedItems);
                var itemsHTML = [];
                for (var nodeRef in selectedItems) {
                    if (!selectedItems.hasOwnProperty(nodeRef)) continue;
                    itemsHTML.push(this._renderItem(selectedItems[nodeRef]));
                }
                var markup = '<div>' + itemsHTML.join(" ") + '</div>';
                domConstruct.place(markup, this.selectedItemsNode, "only");
            },

            _renderItem: function (item) {
                var iconUrl = Alfresco.constants.URL_CONTEXT + "res/components/images/filetypes/generic-category-16.png";
                return '<img src="' + iconUrl + '"/> ' + item.name;
            },

            _onDialogCancel: function (payload) {
                if (this.dialog) {
                    this.dialog.hide();
                    this.dialog.destroyRecursive();
                }
            },

            _onSelectClick: function () {
                var okButton = {
                    name: "alfresco/buttons/AlfButton",
                    config: {
                        label: this.message("button.ok"),
                        publishTopic: "CATEGORY_PICKER_DIALOG_OK",
                        publishPayload: {}
                    }
                };

                var clearButton = {
                    name: "alfresco/buttons/AlfButton",
                    config: {
                        label: this.message("button.clear"),
                        publishTopic: "CATEGORY_PICKER_DIALOG_CLEAR",
                        publishPayload: {}
                    }
                };

                var cancelButton = {
                    name: "alfresco/buttons/AlfButton",
                    config: {
                        label: this.message("button.cancel"),
                        publishTopic: "CATEGORY_PICKER_DIALOG_CANCEL",
                        publishPayload: {}
                    }
                };

                var buttons = [];
                if (this.multipleSelect) {
                    buttons.push(okButton);
                }

                if (this.selectedItems) {
                    buttons.push(clearButton);
                }
                buttons.push(cancelButton);

                var dialog = new AlfDialog({
                    pubSubScope: this.pubSubScope,
                    title: this.message(this.titleMessageKey),
                    widgetsContent: [
                        {
                            name: this.pickerWidget,
                            config: {
                                rootNodeRef: this.rootNodeRef,
                                multipleSelect: this.multipleSelect,
                                canPickFirstLevelItems: this.canPickFirstLevelItems,
                                path: this.path,
                                selectedItems: this.selectedItems
                            }
                        }
                    ],
                    widgetsButtons: buttons
                });
                this.dialog = dialog;
                dialog.show();
            }
        });
    });