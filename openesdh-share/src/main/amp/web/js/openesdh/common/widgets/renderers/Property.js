/**
 * @module openesdh/common/widgets/renderers/Property
 * @extends module:alfresco/renderers/Property
 * @mixes module:alfresco/core/TemporalUtils
 * @mixes module:alfresco/core/UrlUtils
 * @author Torben Lauritzen
 */
define(["dojo/_base/declare",
        "alfresco/renderers/Property",
        "alfresco/core/TemporalUtils",
        "alfresco/core/UrlUtils",
        "dojo/_base/lang"],
    function(declare, Property, TemporalUtils, UrlUtils, lang) {

        return declare([Property, UrlUtils], {

            /**
             * An array of the i18n files to use with this widget.
             *
             * @instance
             * @type {object[]}
             * @default [{i18nFile: "./i18n/Property.properties"}]
             */
            i18nRequirements: [
                {i18nFile: "./i18n/Property.properties"}
            ],

            /**
             * An array of the CSS files to use with this widget.
             *
             * @instance
             * @type {object[]}
             * @default [{cssFile:"./css/Property.css"}]
             */
            cssRequirements: [
                {cssFile: "./css/Property.css"}
            ],

            /**
             * Set up the attributes to be used when rendering the template.
             *
             * @instance
             */
            postMixInProperties: function alfresco_renderers_Property__postMixInProperties() {
/*
                var valueObj = lang.getObject(this.propertyToRender, false, this.currentItem);
                this.renderedValue = valueObj.value;
console.log(this.renderOnNewLine);
                if (this.renderOnNewLine == true)
                {
                    this.renderedValueClass = this.renderedValueClass + " block";
                }
                */
            }
        });
    });