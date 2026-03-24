sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"

], (Controller, MessageBox) => {
    "use strict";

    return Controller.extend("zfinwardnew.controller.View1", {
        onInit() {

            // this._isHeaderCreated = false;

            //Header Model :
            var oHeaderModel = new sap.ui.model.json.JSONModel({
                HeaderData: []
            });

            this.getView().setModel(oHeaderModel, "HeaderModel");

            // TabModel :
            var oModel = new sap.ui.model.json.JSONModel({
                ItemData: []
            });
            this.getView().setModel(oModel, "TabModel");

            //Rep Model :
            var oReportModel = new sap.ui.model.json.JSONModel({
                ReportData: []
            });

            this.getView().setModel(oReportModel, "RepModel");

            // Frag Model :
            var oFragModel = new sap.ui.model.json.JSONModel({
                FragData: []
            });

            this.getView().setModel(oFragModel, "FragModel");


            // Make sure these exist in your JSON models
            this.getView().getModel("TabModel").setProperty("/visible", true);
            this.getView().getModel("RepModel").setProperty("/visible", false);
            this.getView().getModel("RepModel").setProperty("/GoVisible", false);

        },
        onLineItemChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oEvent.getParameter("value");

            // Allow only numbers
            sValue = sValue.replace(/\D/g, "");

            // Limit to 3 digits
            if (sValue.length > 3) {
                sValue = sValue.substring(0, 3);
            }

            oInput.setValue(sValue);
        },

        onAddPress: function () {

            sap.ui.core.BusyIndicator.show(0);

            var oView = this.getView();

            // Header Model
            var oHeaderModel = oView.getModel("HeaderModel");
            var oHeaderData = oHeaderModel.getProperty("/HeaderData");
            var oGateEntryValue = oHeaderData.gateentryno;
            var oGateEntryDt = oHeaderData.gateentrydate;
            var oRdc = oHeaderData.rdcno;
            var oRdcDt = oHeaderData.rdcdt;
            var oCustCode = oHeaderData.custcode;

            if (!oGateEntryValue || !oGateEntryDt || !oRdc || !oRdcDt || !oCustCode) {
                sap.m.MessageBox.information("Please enter all Header data");
                sap.ui.core.BusyIndicator.hide();
                return;
            }

            oHeaderModel.setProperty("/HeaderData/GateNoEdit", false);
            oHeaderModel.setProperty("/HeaderData/GateDtEdit", false);
            oHeaderModel.setProperty("/HeaderData/RdcNoEdit", false);
            oHeaderModel.setProperty("/HeaderData/RdcDtEdit", false);
            oHeaderModel.setProperty("/HeaderData/CustCodeEdit", false);


            // OData Model
            var oDataModel = oView.getModel("ZCDSGATE_ENTRY_SRVB");

            var aFilters = [new sap.ui.model.Filter("gateentryno", sap.ui.model.FilterOperator.EQ, oGateEntryValue)];

            var that = this;

            oDataModel.read("/ZCDSGATE_ENTRY_ITM", {
                filters: aFilters,
                urlParameters: {
                    "$orderby": "line_item desc",
                    "$top": "1"
                },

                success: function (oData) {

                    var backendMax = 0;
                    var uiMax = 0;

                    // Backend last item
                    if (oData.results.length > 0) {
                        backendMax = parseInt(oData.results[0].line_item, 10);
                    }

                    // TabModel
                    var oTabModel = oView.getModel("TabModel");
                    var aData = oTabModel.getProperty("/ItemData") || [];

                    if (aData.length > 0) {
                        aData.forEach(function (item) {
                            var num = parseInt(item.line_item, 10);
                            if (num > uiMax) {
                                uiMax = num;
                            }
                        });
                    }

                    // Take highest of backend or UI and add 10
                    var nextLineItem = Math.max(backendMax, uiMax) + 10;
                    nextLineItem = nextLineItem.toString().padStart(3, "0");

                    // Create new row
                    var oRow = {
                        gateentryno: oGateEntryValue,
                        line_item: nextLineItem,
                        rdcno: oRdc,
                        custcode: "",
                        salesorderno: "",
                        unbwmatcode: "",
                        matdes: "",
                        currency: "",
                        rdcewval: "",
                        cgst: "",
                        sgst: "",
                        igst: "",
                        equipmentid: "",
                        snequip: "",
                        pleqcode: "",
                        plant: "",
                        sloc: "",
                        grndocno: "",
                        grndocdate: "",
                        unit_field: "",
                        qtyrecd: "",
                        underwarranty: "",
                        nrgpno: "",
                        nrgpdate: "",
                        ewaybillno: "",
                        remarks: "",
                        iestatus: ""
                    };

                    aData.push(oRow);
                    oTabModel.setProperty("/ItemData", aData);

                    sap.ui.core.BusyIndicator.hide();
                },

                error: function () {
                    sap.m.MessageBox.error("Error fetching line items");
                    sap.ui.core.BusyIndicator.hide();
                }
            });
        },
        onResetPress: function () {
            var HeaderModel = this.getView().getModel("HeaderModel");
            HeaderModel.setProperty("/HeaderData/GateNoEdit", true);
            HeaderModel.setProperty("/HeaderData", []);
            // HeaderModel.setProperty("/HeaderData/GateDtEdit", true);


            var TabModel = this.getView().getModel("TabModel");
            TabModel.setProperty("/ItemData", []);
            TabModel.refresh(true);
        },
        onDeletePress: function () {
            var oTable = this.byId("zInward_tableId");
            var oModel = this.getView().getModel("TabModel");
            var aData = oModel.getProperty("/ItemData");

            var aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                sap.m.MessageToast.show("Please select at least one row");
                return;
            }

            // For Sorting
            aSelectedIndices.sort(function (a, b) {
                return b - a;
            });

            aSelectedIndices.forEach(function (iIndex) {
                aData.splice(iIndex, 1);
            });

            oModel.setProperty("/ItemData", aData);
            oTable.clearSelection();
        },
        formatDate: function (Datess) {
            if (!Datess) {
                return null;
            }

            var oDate = new Date(Datess);

            var yyyy = oDate.getFullYear();
            var mm = String(oDate.getMonth() + 1).padStart(2, "0");
            var dd = String(oDate.getDate()).padStart(2, "0");

            // DateTime format
            return yyyy + "-" + mm + "-" + dd + "T00:00:00";
        },

        // onSavePress: function () {
        //     sap.ui.core.BusyIndicator.show(0);

        //     var oModelo = this.getView().getModel("HeaderModel");
        //     var oHeader = oModelo.getProperty("/HeaderData");

        //     var that = this;
        //     var oTable = this.byId("zInward_tableId");
        //     var aSelectedIndices = oTable.getSelectedIndices();

        //     if (!aSelectedIndices || aSelectedIndices.length === 0) {
        //         sap.ui.core.BusyIndicator.hide();
        //         MessageBox.information("Please select at least one row to save");
        //         return;
        //     }

        //     var oView = this.getView();
        //     var oModel = oView.getModel("TabModel");
        //     var aData = oModel.getProperty("/ItemData");

        //     var oODataModel = oView.getModel("ZCDSGATE_ENTRY_SRVB");

        //     /* ---------- HEADER DATA ---------- */
        //     var oHeaderPayload = {
        //         gateentryno: oHeader.gateentryno,
        //         gateentrydate: that.formatDate(oHeader.gateentrydate),
        //         rdcno: oHeader.rdcno,
        //         rdcdt: that.formatDate(oHeader.rdcdt)
        //     };

        //     /* ---------- CREATE HEADER FIRST ---------- */
        //     oODataModel.create("/ZCDSGATE_ENTRY_HDR", oHeaderPayload, {

        //         success: function () {

        //             var iTotal = aSelectedIndices.length;
        //             var iCompleted = 0;

        //             /* ---------- LOOP SELECTED ROWS ---------- */
        //             aSelectedIndices.forEach(function (iIndex) {

        //                 var oRow = aData[iIndex];   // IMPORTANT

        //                 var oItemPayload = {
        //                     gateentryno: oRow.gateentryno,
        //                     line_item: oRow.line_item,
        //                     custcode: oRow.custcode,
        //                     salesorderno: oRow.salesorderno,
        //                     unbwmatcode: oRow.unbwmatcode,
        //                     matdes: oRow.matdes,
        //                     currency: oRow.currency,
        //                     rdcewval: oRow.rdcewval,
        //                     cgst: oRow.cgst,
        //                     sgst: oRow.sgst,
        //                     igst: oRow.igst,
        //                     equipmentid: oRow.equipmentid,
        //                     snequip: oRow.snequip,
        //                     pleqcode: oRow.pleqcode,
        //                     plant: oRow.plant,
        //                     sloc: oRow.sloc,
        //                     grndocno: oRow.grndocno,
        //                     grndocdate: that.formatDate(oRow.grndocdate),
        //                     unit_field: oRow.unit_field,
        //                     qtyrecd: oRow.qtyrecd,
        //                     underwarranty: oRow.underwarranty,
        //                     nrgpno: oRow.nrgpno,
        //                     nrgpdate: that.formatDate(oRow.nrgpdate),
        //                     ewaybillno: oRow.ewaybillno,
        //                     remarks: oRow.remarks,
        //                     iestatus: oRow.iestatus
        //                 };

        //                 oODataModel.create("/ZCDSGATE_ENTRY_ITM", oItemPayload, {

        //                     success: function () {

        //                         iCompleted++;

        //                         if (iCompleted === iTotal) {
        //                             sap.ui.core.BusyIndicator.hide();
        //                             sap.m.MessageToast.show("Gate Entry saved successfully");
        //                         }

        //                     },

        //                     error: function () {
        //                         sap.ui.core.BusyIndicator.hide();
        //                         sap.m.MessageBox.error("Failed to save item");
        //                     }

        //                 });

        //             });

        //         },

        //         error: function () {
        //             sap.ui.core.BusyIndicator.hide();
        //             sap.m.MessageBox.error("Failed to save header");
        //         }

        //     });

        // },
        onSavePress: function () {
            sap.ui.core.BusyIndicator.show(0);

            var oView = this.getView();
            var oHeaderModel = oView.getModel("HeaderModel");
            var oHeader = oHeaderModel.getProperty("/HeaderData");

            var oTable = this.byId("zInward_tableId");
            var aSelectedIndices = oTable.getSelectedIndices();

            if (!aSelectedIndices || aSelectedIndices.length === 0) {
                sap.ui.core.BusyIndicator.hide();
                MessageBox.information("Please select at least one row to save");
                return;
            }

            var oTabModel = oView.getModel("TabModel");
            var aData = oTabModel.getProperty("/ItemData");

            var oODataModel = oView.getModel("ZCDSGATE_ENTRY_SRVB");

            var that = this;

            // 1. Check if header exists
            oODataModel.read("/ZCDSGATE_ENTRY_HDR('" + oHeader.gateentryno + "')", {
                success: function () {
                    // Header exists → directly save line items
                    saveLineItems();
                },
                error: function () {
                    // Header does not exist → create header first
                    var oHeaderPayload = {
                        gateentryno: oHeader.gateentryno,
                        gateentrydate: that.formatDate(oHeader.gateentrydate),
                        rdcno: oHeader.rdcno,
                        rdcdt: that.formatDate(oHeader.rdcdt),
                        custcode: oHeader.custcode

                    };

                    oODataModel.create("/ZCDSGATE_ENTRY_HDR", oHeaderPayload, {
                        success: function () {
                            saveLineItems();
                        },
                        error: function () {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageBox.error("Failed to save header");
                        }
                    });
                }
            });

            // Function to save line items
            function saveLineItems() {
                var iTotal = aSelectedIndices.length;
                var iCompleted = 0;
                var iFailed = 0;

                aSelectedIndices.forEach(function (iIndex) {
                    var oRow = aData[iIndex];

                    var oItemPayload = {
                        gateentryno: oRow.gateentryno,
                        line_item: oRow.line_item.toString().padStart(3, "0"),
                        gateno_item: oRow.gateentryno + "_" + oRow.line_item.toString().padStart(3, "0"),
                        // custcode: oRow.custcode,
                        rdcno: oRow.rdcno,
                        salesorderno: oRow.salesorderno,
                        unbwmatcode: oRow.unbwmatcode,
                        matdes: oRow.matdes,
                        currency: oRow.currency,
                        rdcewval: oRow.rdcewval && oRow.rdcewval !== "" ? oRow.rdcewval : "0.00",
                        cgst: oRow.cgst && oRow.cgst !== "" ? parseFloat(oRow.cgst).toFixed(2) : "0",
                        // cgst: parseFloat(oRow.cgst).toFixed(2),
                        sgst: oRow.sgst && oRow.sgst !== "" ? parseFloat(oRow.sgst).toFixed(2) : "0",
                        // sgst: parseFloat(oRow.sgst).toFixed(2),
                        igst: oRow.igst && oRow.igst !== "" ? parseFloat(oRow.igst).toFixed(2) : "0",
                        // igst: parseFloat(oRow.igst).toFixed(2),
                        equipmentid: oRow.equipmentid,
                        snequip: oRow.snequip,
                        pleqcode: oRow.pleqcode,
                        plant: oRow.plant,
                        sloc: oRow.sloc,
                        grndocno: oRow.grndocno,
                        grndocdate: that.formatDate(oRow.grndocdate),
                        unit_field: oRow.unit_field,
                        qtyrecd: oRow.qtyrecd && oRow.qtyrecd !== "" ? oRow.qtyrecd : "0.000",
                        underwarranty: oRow.underwarranty,
                        nrgpno: oRow.nrgpno,
                        nrgpdate: that.formatDate(oRow.nrgpdate),
                        ewaybillno: oRow.ewaybillno,
                        remarks: oRow.remarks,
                        iestatus: oRow.iestatus
                    };

                    oODataModel.create("/ZCDSGATE_ENTRY_ITM", oItemPayload, {
                        success: function () {
                            iCompleted++;
                            if (iCompleted + iFailed === iTotal) {
                                sap.ui.core.BusyIndicator.hide();
                                if (iFailed > 0) {
                                    sap.m.MessageBox.error(iFailed + " items failed to save");
                                } else {
                                    sap.m.MessageToast.show("Gate Entry saved successfully");
                                }
                            }
                        },
                        error: function () {
                            iFailed++;
                            if (iCompleted + iFailed === iTotal) {
                                sap.ui.core.BusyIndicator.hide();
                                sap.m.MessageBox.error(iFailed + " items failed to save");
                            }
                        }
                    });
                });
            }
        },

        // ===========================================================
        // Customer Value help request :==============================
        // ===========================================================
        onCustomerValueHelpPress: function () {

            sap.ui.core.BusyIndicator.show();

            var oModel = this.getView().getModel();

            // Check if the model is valid
            if (!oModel) {
                console.error("OData model is not properly initialized.");
                sap.ui.core.BusyIndicator.hide();
                return;
            }

            var that = this;
            var aAllItems = []; // Array to hold all retrieved items

            // Function to fetch data recursively
            function fetchData(skipCount) {

                oModel.read("/Z_I_CUSTOMERTXT", {
                    //   filters: oFilters,
                    urlParameters: {
                        $top: 5000,  // Request a chunk of 5000 records
                        $skip: skipCount  // Start from the skipCount position
                    },
                    success: function (oData) {
                        var aItems = oData.results;
                        aAllItems = aAllItems.concat(aItems); // Concatenate current chunk to the array

                        // Check if there are more records to fetch
                        if (oData.results.length >= 5000) {
                            // If there are more records, fetch next chunk
                            fetchData(skipCount + 5000);
                        } else {
                            // If no more records, all data is fetched
                            finishFetching();
                        }
                    },
                    error: function (oError) {
                        console.error("Error reading data: ", oError);
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            }

            function finishFetching() {


                // Once all data is fetched, proceed to display it
                that.oJSONModel = new sap.ui.model.json.JSONModel({
                    Datas: aAllItems
                });
                that.getView().setModel(that.oJSONModel, "oJSONModel");
                console.log("that.oJSONModel:", that.oJSONModel)

                // Load the value help dialog fragment
                that._oBasicSearchField = new sap.m.SearchField();
                that.loadFragment({
                    name: "zfinwardnew.fragment.CustomerFragment"
                }).then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();

                    var oColumnProductCode, oColumnDescription, oColumnCompanyCode;
                    that._oVHD_ = oDialog;
                    that.getView().addDependent(oDialog);

                    // Set key fields for filtering in the Define Conditions Tab
                    oDialog.setRangeKeyFields([{
                        label: "Customer Code",
                        key: "CUSTCODE",
                        type: "string",
                        typeInstance: new sap.ui.model.type.String({}, {
                            maxLength: 10
                        })
                    }]);

                    // Set Basic Search for FilterBar
                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(that._oBasicSearchField);

                    // Trigger filter bar search when the basic search is fired
                    that._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(that.oJSONModel);

                        // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                        if (oTable.bindRows) {
                            // Desktop/Table scenario (sap.ui.table.Table)
                            oTable.bindAggregation("rows", {
                                path: "oJSONModel>/Datas",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.ui.table.Table oColumnProductCode
                            oColumnProductCode = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Customer Code" }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>CUSTCODE}" })
                            });
                            oColumnProductCode.data({
                                fieldName: "CUSTCODE"
                            });

                            oTable.addColumn(oColumnProductCode);

                            // Define columns for sap.ui.table.Table ORGANIZATION
                            oColumnDescription = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Organization" }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>ORGANIZATION}" })
                            });
                            oColumnDescription.data({
                                fieldName: "ORGANIZATION"
                            });

                            oTable.addColumn(oColumnDescription);


                        } else if (oTable.bindItems) {
                            // Mobile scenario (sap.m.Table)
                            oTable.bindAggregation("items", {
                                path: "oJSONModel>/Datas",
                                template: new sap.m.ColumnListItem({
                                    cells: [
                                        new sap.m.Text({ text: "{oJSONModel>CUSTCODE}" }),
                                        new sap.m.Text({ text: "{oJSONModel>ORGANIZATION}" })

                                    ]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Customer Code" })
                            }));

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Organization" })
                            }));

                        }

                        oDialog.update();
                        sap.ui.core.BusyIndicator.hide();
                    });

                    oDialog.open();
                    sap.ui.core.BusyIndicator.hide();
                });
            }

            // Start fetching data from the beginning
            fetchData(0);

        },

        onValueHelpOkPress_Customer: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getText();

            var oModel1 = this.getView().getModel("HeaderModel");
            oModel1.setProperty("/HeaderData/custcode", aValue);

            this._oVHD_.close();

        },

        onValueHelpCancelPress_Customer: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Customer: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Customer: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet");

            var aFilters = aSelectionSet && aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new sap.ui.model.Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter({ path: "CUSTCODE", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })


                ],
                and: false
            }));

            this._filterTableCustomer(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },
        _filterTableCustomer: function (oFilter) {
            var oVHD = this._oVHD_;

            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                // This method must be called after binding update of the table.
                oVHD.update();
            });
        },

        // =============================================================
        // Currency Fragment : =========================================
        // =============================================================


        onCurrencyValueHelpPress: function (oEvent) {

            sap.ui.core.BusyIndicator.show();

            var oModel = this.getView().getModel();

            this._oInput_C = oEvent.getSource();

            // Check if the model is valid
            if (!oModel) {
                console.error("OData model is not properly initialized.");
                sap.ui.core.BusyIndicator.hide();
                return;
            }


            var that = this;
            var aAllItems = []; // Array to hold all retrieved items

            // Function to fetch data recursively
            function fetchData(skipCount) {

                oModel.read("/Z_I_Currency", {
                    //   filters: oFilters,
                    urlParameters: {
                        $top: 5000,  // Request a chunk of 5000 records
                        $skip: skipCount  // Start from the skipCount position
                    },
                    success: function (oData) {
                        var aItems = oData.results;
                        aAllItems = aAllItems.concat(aItems); // Concatenate current chunk to the array

                        // Check if there are more records to fetch
                        if (oData.results.length >= 5000) {
                            // If there are more records, fetch next chunk
                            fetchData(skipCount + 5000);
                        } else {
                            // If no more records, all data is fetched
                            finishFetching();
                        }
                    },
                    error: function (oError) {
                        console.error("Error reading data: ", oError);
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            }

            function finishFetching() {


                // Once all data is fetched, proceed to display it
                that.oJSONModel = new sap.ui.model.json.JSONModel({
                    Datas: aAllItems
                });
                that.getView().setModel(that.oJSONModel, "oJSONModel");
                console.log("that.oJSONModel:", that.oJSONModel)

                // Load the value help dialog fragment
                that._oBasicSearchField = new sap.m.SearchField();
                that.loadFragment({
                    name: "zfinwardnew.fragment.CurrencyFragment"
                }).then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();

                    var oColumnProductCode, oColumnDescription, oColumnCompanyCode;
                    that._oVHD_ = oDialog;
                    that.getView().addDependent(oDialog);

                    // Set key fields for filtering in the Define Conditions Tab
                    oDialog.setRangeKeyFields([{
                        label: "Currency.",
                        key: "Currency",
                        type: "string",
                        typeInstance: new sap.ui.model.type.String({}, {
                            maxLength: 10
                        })
                    }]);

                    // Set Basic Search for FilterBar
                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(that._oBasicSearchField);

                    // Trigger filter bar search when the basic search is fired
                    that._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(that.oJSONModel);

                        // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                        if (oTable.bindRows) {
                            // Desktop/Table scenario (sap.ui.table.Table)
                            oTable.bindAggregation("rows", {
                                path: "oJSONModel>/Datas",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.ui.table.Table oColumnDescription
                            oColumnProductCode = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Currency" }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>Currency}" })
                            });
                            oColumnProductCode.data({
                                fieldName: "Currency"
                            });

                            oTable.addColumn(oColumnProductCode);

                            // Define columns for sap.ui.table.Table oColumn Description
                            oColumnDescription = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "CurrencyDescription" }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>CurrencyDescription}" })
                            });
                            oColumnDescription.data({
                                fieldName: "CurrencyDescription"
                            });

                            oTable.addColumn(oColumnDescription);



                        } else if (oTable.bindItems) {
                            // Mobile scenario (sap.m.Table)
                            oTable.bindAggregation("items", {
                                path: "oJSONModel>/Datas",
                                template: new sap.m.ColumnListItem({
                                    cells: [
                                        new sap.m.Text({ text: "{oJSONModel>Currency}" }),
                                        new sap.m.Text({ text: "{oJSONModel>CurrencyDescription}" }),


                                    ]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Currency" })
                            }));
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "CurrencyDescription" })
                            }));

                        }

                        oDialog.update();
                        sap.ui.core.BusyIndicator.hide();
                    });

                    oDialog.open();
                    sap.ui.core.BusyIndicator.hide();
                });
            }

            // Start fetching data from the beginning
            fetchData(0);

        },

        onValueHelpOkPress_Currency: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getText();

            var oContext = this._oInput_C.getBindingContext("TabModel");
            var sPath = oContext.getPath();

            this.getView().getModel("TabModel").setProperty(sPath + "/currency", aValue);

            this._oVHD_.close();

        },

        onValueHelpCancelPress_Currency: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Currency: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Currency: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet");

            var aFilters = aSelectionSet && aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new sap.ui.model.Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter({ path: "Currency", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })


                ],
                and: false
            }));

            this._filterTableCurrency(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTableCurrency: function (oFilter) {
            var oVHD = this._oVHD_;

            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                // This method must be called after binding update of the table.
                oVHD.update();
            });
        },

        // ============================================================
        // Equipment Fragment : ========================================
        // ============================================================ 

        onEquipmentValueHelpPress: function (oEvent) {

            this._oEquip = oEvent.getSource();

            sap.ui.core.BusyIndicator.show();

            var oModel = this.getView().getModel();

            // Check if the model is valid
            if (!oModel) {
                console.error("OData model is not properly initialized.");
                sap.ui.core.BusyIndicator.hide();
                return;
            }


            var that = this;
            var aAllItems = []; // Array to hold all retrieved items

            // Function to fetch data recursively
            function fetchData(skipCount) {

                oModel.read("/Z_I_EQUIPMENT", {
                    //   filters: oFilters,
                    urlParameters: {
                        $top: 5000,  // Request a chunk of 5000 records
                        $skip: skipCount  // Start from the skipCount position
                    },
                    success: function (oData) {
                        var aItems = oData.results;
                        aAllItems = aAllItems.concat(aItems); // Concatenate current chunk to the array

                        // Check if there are more records to fetch
                        if (oData.results.length >= 5000) {
                            // If there are more records, fetch next chunk
                            fetchData(skipCount + 5000);
                        } else {
                            // If no more records, all data is fetched
                            finishFetching();
                        }
                    },
                    error: function (oError) {
                        console.error("Error reading data: ", oError);
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            }

            function finishFetching() {


                // Once all data is fetched, proceed to display it
                that.oJSONModel = new sap.ui.model.json.JSONModel({
                    Datas: aAllItems
                });
                that.getView().setModel(that.oJSONModel, "oJSONModel");
                console.log("that.oJSONModel:", that.oJSONModel)

                // Load the value help dialog fragment
                that._oBasicSearchField = new sap.m.SearchField();
                that.loadFragment({
                    name: "zfinwardnew.fragment.EquipmentFragment"
                }).then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();

                    var oColumnProductCode, oColumnName, oColumnCompanyCode;
                    that._oVHD_ = oDialog;
                    that.getView().addDependent(oDialog);

                    // Set key fields for filtering in the Define Conditions Tab
                    oDialog.setRangeKeyFields([{
                        label: "Equipment No.",
                        key: "EQUIPMENT",
                        type: "string",
                        typeInstance: new sap.ui.model.type.String({}, {
                            maxLength: 10
                        })
                    }]);

                    // Set Basic Search for FilterBar
                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(that._oBasicSearchField);

                    // Trigger filter bar search when the basic search is fired
                    that._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(that.oJSONModel);

                        // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                        if (oTable.bindRows) {
                            // Desktop/Table scenario (sap.ui.table.Table)
                            oTable.bindAggregation("rows", {
                                path: "oJSONModel>/Datas",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.ui.table.Table
                            oColumnProductCode = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Equipment No." }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>EQUIPMENT}" })
                            });
                            oColumnProductCode.data({
                                fieldName: "EQUIPMENT"
                            });

                            oTable.addColumn(oColumnProductCode);

                            // Define columns for sap.ui.table.Table
                            oColumnName = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Equipment Name." }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>EQUIPMENT_NAME}" })
                            });
                            oColumnName.data({
                                fieldName: "EQUIPMENT_NAME"
                            });

                            oTable.addColumn(oColumnName);


                        } else if (oTable.bindItems) {
                            // Mobile scenario (sap.m.Table)
                            oTable.bindAggregation("items", {
                                path: "oJSONModel>/Datas",
                                template: new sap.m.ColumnListItem({
                                    cells: [
                                        new sap.m.Text({ text: "{oJSONModel>EQUIPMENT}" }),
                                        new sap.m.Text({ text: "{oJSONModel>EQUIPMENT_NAME}" }),


                                    ]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Equipment No." })
                            }));

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Equipment Name." })
                            }));

                        }

                        oDialog.update();
                        sap.ui.core.BusyIndicator.hide();
                    });

                    oDialog.open();
                    sap.ui.core.BusyIndicator.hide();
                });
            }

            // Start fetching data from the beginning
            fetchData(0);

        },

        onValueHelpOkPress_Equipment: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getText();

            var oContext = this._oEquip.getBindingContext("TabModel");
            var sPath = oContext.getPath();

            this.getView().getModel("TabModel").setProperty(sPath + "/equipmentid", aValue);

            this._oVHD_.close();

        },

        onValueHelpCancelPress_Equipment: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Equipment: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Equipment: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet");

            var aFilters = aSelectionSet && aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new sap.ui.model.Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter({ path: "EQUIPMENT", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })


                ],
                and: false
            }));

            this._filterTableEquipment(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTableEquipment: function (oFilter) {
            var oVHD = this._oVHD_;

            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                // This method must be called after binding update of the table.
                oVHD.update();
            });
        },

        // ============================================================
        // Material Fragment : ========================================
        // ============================================================ 

        onMaterialValueHelpPress: function (oEvent) {

            sap.ui.core.BusyIndicator.show();

            var oModel = this.getView().getModel();

            this._oInput_M = oEvent.getSource();

            // Check if the model is valid
            if (!oModel) {
                console.error("OData model is not properly initialized.");
                sap.ui.core.BusyIndicator.hide();
                return;
            }


            var that = this;
            var aAllItems = []; // Array to hold all retrieved items

            // Function to fetch data recursively
            function fetchData(skipCount) {

                oModel.read("/Z_I_ProductText", {
                    //   filters: oFilters,
                    urlParameters: {
                        $top: 5000,  // Request a chunk of 5000 records
                        $skip: skipCount  // Start from the skipCount position
                    },
                    success: function (oData) {
                        var aItems = oData.results;
                        aAllItems = aAllItems.concat(aItems); // Concatenate current chunk to the array

                        // Check if there are more records to fetch
                        if (oData.results.length >= 5000) {
                            // If there are more records, fetch next chunk
                            fetchData(skipCount + 5000);
                        } else {
                            // If no more records, all data is fetched
                            finishFetching();
                        }
                    },
                    error: function (oError) {
                        console.error("Error reading data: ", oError);
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            }

            function finishFetching() {


                // Once all data is fetched, proceed to display it
                that.oJSONModel = new sap.ui.model.json.JSONModel({
                    Datas: aAllItems
                });
                that.getView().setModel(that.oJSONModel, "oJSONModel");
                console.log("that.oJSONModel:", that.oJSONModel)

                // Load the value help dialog fragment
                that._oBasicSearchField = new sap.m.SearchField();
                that.loadFragment({
                    name: "zfinwardnew.fragment.MaterialFragment"
                }).then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();

                    var oColumnProductCode, oColumnProductCode1, oColumnCompanyCode;
                    that._oVHD_ = oDialog;
                    that.getView().addDependent(oDialog);

                    // Set key fields for filtering in the Define Conditions Tab
                    oDialog.setRangeKeyFields([{
                        label: "Product.",
                        key: "Product",
                        type: "string",
                        typeInstance: new sap.ui.model.type.String({}, {
                            maxLength: 10
                        })
                    }]);

                    // Set Basic Search for FilterBar
                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(that._oBasicSearchField);

                    // Trigger filter bar search when the basic search is fired
                    that._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(that.oJSONModel);

                        // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                        if (oTable.bindRows) {
                            // Desktop/Table scenario (sap.ui.table.Table)
                            oTable.bindAggregation("rows", {
                                path: "oJSONModel>/Datas",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.ui.table.Table
                            oColumnProductCode = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Product" }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>Product}" })
                            });
                            oColumnProductCode.data({
                                fieldName: "Product"
                            });

                            oTable.addColumn(oColumnProductCode);

                            // Define columns for sap.ui.table.Table
                            oColumnProductCode1 = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "ProductDescription" }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>ProductDescription}" })
                            });
                            oColumnProductCode1.data({
                                fieldName: "ProductDescription"
                            });

                            oTable.addColumn(oColumnProductCode1);



                        } else if (oTable.bindItems) {
                            // Mobile scenario (sap.m.Table)
                            oTable.bindAggregation("items", {
                                path: "oJSONModel>/Datas",
                                template: new sap.m.ColumnListItem({
                                    cells: [
                                        new sap.m.Text({ text: "{oJSONModel>Product}" }),
                                        new sap.m.Text({ text: "{oJSONModel>ProductDescription}" }),


                                    ]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Product" })

                            }));

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Product Description" })

                            }));

                        }

                        oDialog.update();
                        sap.ui.core.BusyIndicator.hide();
                    });

                    oDialog.open();
                    sap.ui.core.BusyIndicator.hide();
                });
            }

            // Start fetching data from the beginning
            fetchData(0);

        },

        onValueHelpOkPress_Material: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getKey();
            var sText = oToken.getText();
            var sDescription = sText.split(" (")[0];

            var oContext = this._oInput_M.getBindingContext("TabModel");
            var sPath = oContext.getPath();

            this.getView().getModel("TabModel").setProperty(sPath + "/unbwmatcode", aValue);
            this.getView().getModel("TabModel").setProperty(sPath + "/matdes", sDescription);

            this._oVHD_.close();
        },

        onValueHelpCancelPress_Material: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Material: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Material: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet");

            var aFilters = aSelectionSet && aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new sap.ui.model.Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter({ path: "Product", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })


                ],
                and: false
            }));

            this._filterTableMaterial(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTableMaterial: function (oFilter) {
            var oVHD = this._oVHD_;

            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                // This method must be called after binding update of the table.
                oVHD.update();
            });
        },

        // ============================================================
        // Unit of Measurement Fragment : =============================
        // ============================================================ 

        onUnitHelpRequestPress: function (oEvent) {

            sap.ui.core.BusyIndicator.show();

            var oModel = this.getView().getModel();

            this._oInput_U = oEvent.getSource();

            // Check if the model is valid
            if (!oModel) {
                console.error("OData model is not properly initialized.");
                sap.ui.core.BusyIndicator.hide();
                return;
            }


            var that = this;
            var aAllItems = []; // Array to hold all retrieved items

            // Function to fetch data recursively
            function fetchData(skipCount) {

                oModel.read("/Z_I_Unit", {
                    //   filters: oFilters,
                    urlParameters: {
                        $top: 5000,  // Request a chunk of 5000 records
                        $skip: skipCount  // Start from the skipCount position
                    },
                    success: function (oData) {
                        var aItems = oData.results;
                        aAllItems = aAllItems.concat(aItems); // Concatenate current chunk to the array

                        // Check if there are more records to fetch
                        if (oData.results.length >= 5000) {
                            // If there are more records, fetch next chunk
                            fetchData(skipCount + 5000);
                        } else {
                            // If no more records, all data is fetched
                            finishFetching();
                        }
                    },
                    error: function (oError) {
                        console.error("Error reading data: ", oError);
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            }

            function finishFetching() {


                // Once all data is fetched, proceed to display it
                that.oJSONModel = new sap.ui.model.json.JSONModel({
                    Datas: aAllItems
                });
                that.getView().setModel(that.oJSONModel, "oJSONModel");
                console.log("that.oJSONModel:", that.oJSONModel)

                // Load the value help dialog fragment
                that._oBasicSearchField = new sap.m.SearchField();
                that.loadFragment({
                    name: "zfinwardnew.fragment.UnitOfMeasure"
                }).then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();

                    var oColumnProductCode, oColumnPostingDate, oColumnCompanyCode;
                    that._oVHD_ = oDialog;
                    that.getView().addDependent(oDialog);

                    // Set key fields for filtering in the Define Conditions Tab
                    oDialog.setRangeKeyFields([{
                        label: "UnitOfMeasure.",
                        key: "UnitOfMeasure",
                        type: "string",
                        typeInstance: new sap.ui.model.type.String({}, {
                            maxLength: 10
                        })
                    }]);

                    // Set Basic Search for FilterBar
                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(that._oBasicSearchField);

                    // Trigger filter bar search when the basic search is fired
                    that._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(that.oJSONModel);

                        // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                        if (oTable.bindRows) {
                            // Desktop/Table scenario (sap.ui.table.Table)
                            oTable.bindAggregation("rows", {
                                path: "oJSONModel>/Datas",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.ui.table.Table
                            oColumnProductCode = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Unit Of Measure" }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>UnitOfMeasure}" })
                            });
                            oColumnProductCode.data({
                                fieldName: "UnitOfMeasure"
                            });

                            oTable.addColumn(oColumnProductCode);


                        } else if (oTable.bindItems) {
                            // Mobile scenario (sap.m.Table)
                            oTable.bindAggregation("items", {
                                path: "oJSONModel>/Datas",
                                template: new sap.m.ColumnListItem({
                                    cells: [
                                        new sap.m.Text({ text: "{oJSONModel>UnitOfMeasure}" }),

                                    ]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "Unit Of Measure" })
                            }));

                        }

                        oDialog.update();
                        sap.ui.core.BusyIndicator.hide();
                    });

                    oDialog.open();
                    sap.ui.core.BusyIndicator.hide();
                });
            }

            // Start fetching data from the beginning
            fetchData(0);

        },

        onValueHelpOkPress_Unit: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getText();

            var oContext = this._oInput_U.getBindingContext("TabModel");
            var sPath = oContext.getPath();

            this.getView().getModel("TabModel").setProperty(sPath + "/unit_field", aValue);

            this._oVHD_.close();

        },

        onValueHelpCancelPress_Unit: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Unit: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Unit: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet");

            var aFilters = aSelectionSet && aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new sap.ui.model.Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter({ path: "UnitOfMeasure", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })


                ],
                and: false
            }));

            this._filterTableUnit(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTableUnit: function (oFilter) {
            var oVHD = this._oVHD_;

            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                // This method must be called after binding update of the table.
                oVHD.update();
            });
        },


        onGoPress: async function () {

            // var batchTokens = this.getView().byId("IdBatch").getTokens();
            // var plantTokens = this.getView().byId("IdPlant").getTokens();
            // var procOrderTokens = this.getView().byId("IdProcessOrder").getTokens();


            // const aBatchValues = batchTokens.map(oToken => oToken.getText().trim());
            // const aPlantValues = plantTokens.map(oToken => oToken.getText().trim());
            // const aProcOrderValues = procOrderTokens.map(t => t.getText().trim().padStart(12, "0"));

            // // --- Date parsing ---
            // var oDateRange = this.getView().byId("DatesId");
            // var sDateRangeValue = oDateRange.getValue();
            // let bHasDate = sDateRangeValue && sDateRangeValue.trim() !== "";
            // let FromDate = "", ToDate = "";
            // if (bHasDate) {
            //     let [startDateStr, endDateStr] = sDateRangeValue.split(" - ");
            //     let startDate = new Date(startDateStr);
            //     let endDate = new Date(endDateStr);

            //     FromDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000))
            //         .toISOString().split("T")[0];
            //     ToDate = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000))
            //         .toISOString().split("T")[0];
            // }


            var oHeaderModel = this.getView().getModel("HeaderModel");
            var oGate = oHeaderModel.getProperty("/HeaderData/gateentryno");

            let aFilter = [];
            if (oGate) {
                aFilter.push(
                    new sap.ui.model.Filter("gateentryno", sap.ui.model.FilterOperator.EQ, oGate)
                );
            }

            // if (aBatchValues.length > 0) {
            //     const aBatchFilters = aBatchValues.map(batch =>
            //         new sap.ui.model.Filter("batch", sap.ui.model.FilterOperator.EQ, batch)
            //     );
            //     aFilter.push(new sap.ui.model.Filter({
            //         filters: aBatchFilters,
            //         and: false // OR condition for multiple batches
            //     }));
            // }

            // if (aPlantValues.length > 0) {
            //     const aPlantFilters = aPlantValues.map(plant =>
            //         new sap.ui.model.Filter("plant", sap.ui.model.FilterOperator.EQ, plant)
            //     );
            //     aFilter.push(new sap.ui.model.Filter({
            //         filters: aPlantFilters,
            //         and: false // OR condition for multiple plants
            //     }));
            // }


            // if (aProcOrderValues.length > 0) {
            //     const aProcOrderFilters = aProcOrderValues.map(procOrder =>
            //         new sap.ui.model.Filter("process_order", sap.ui.model.FilterOperator.EQ, procOrder)
            //     );
            //     aFilter.push(new sap.ui.model.Filter({
            //         filters: aProcOrderFilters,
            //         and: false // OR condition for multiple process orders
            //     }));
            // }


            const oModel = this.getView().getModel("ZCDSGATE_ENTRY_SRVB");
            const that = this;
            that.getView().setBusy(true);

            let aAllItems = [];
            let iSkip = 0;
            const iTop = 200;

            // --- Recursive fetch (paging) ---
            function fetchData() {
                oModel.read("/ZCDSGATE_ENTRY_ITM", {
                    filters: aFilter,
                    urlParameters: {
                        "$skip": iSkip,
                        "$top": iTop
                    },
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            aAllItems = aAllItems.concat(oData.results);
                            iSkip += iTop;
                            fetchData(); // continue loading
                        } else {
                            that.getView().setBusy(false);
                            console.log("Total rows fetched:", aAllItems.length);

                            let aResults = aAllItems;

                            // After fetchData() completes
                            aAllItems.sort(function (a, b) {
                                return Number(a.boxno) - Number(b.boxno); // 
                            });

                            const oReportModel = new sap.ui.model.json.JSONModel({
                                ReportData: aAllItems
                            });
                            that.getView().setModel(oReportModel, "RepModel");

                            //  Message if no results
                            if (aResults.length === 0) {
                                sap.m.MessageToast.show("No records found for the given filters.");
                            }
                        }
                    },
                    error: function (error) {
                        that.getView().setBusy(false);
                        console.error("Error fetching data:", error);
                        sap.m.MessageToast.show("Error fetching data.");
                    }
                });
            }

            // Start fetching
            fetchData();
        },

        onSwitchPress: function (oEvent) {
            var bState = oEvent.getParameter("state");
            var oTab = this.getView().getModel("TabModel");
            oTab.setProperty("/ItemData", []);

            // Clear Data for Header:
            var oHead = this.getView().getModel("HeaderModel");
            oHead.setProperty("/HeaderData", []);
            // // For Gate Entry Number
            // oHead.setProperty("/HeaderData/GateNoEdit", true);
            // oHead.setProperty("/HeaderData/gateentryno", "");
            // // For Gate Entry Date
            // oHead.setProperty("/HeaderData/GateDtEdit", true);
            // oHead.setProperty("/HeaderData/gateentrydate", "");
            // // For RDC No
            // oHead.setProperty("/HeaderData/RdcNoEdit", true);
            // oHead.setProperty("/HeaderData/rdcno", "");
            // // For RDC Dt
            // oHead.setProperty("/HeaderData/RdcDtEdit", true);
            // oHead.setProperty("/HeaderData/rdcdt", "");
            // // For Customer Code
            // oHead.setProperty("/HeaderData/CustCodeEdit", true);
            // oHead.setProperty("/HeaderData/custcode", "");

            var oRep = this.getView().getModel("RepModel");
            if (bState) {
                oTab.setProperty("/visible", false);
                oRep.setProperty("/visible", true);
                oRep.setProperty("/GoVisible", true);

            } else {
                oTab.setProperty("/visible", true);
                oRep.setProperty("/visible", false);
                oRep.setProperty("/GoVisible", false);
                oRep.setProperty("/ReportData", []);
            }
        },

        onUpdatePress: function () {
            var oView = this.getView();

            if (!this.pDialog) {
                this.pDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "zfinwardnew.fragment.ChangeFragment",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this.pDialog.then(function (oDialog) {
                oDialog.open();
            });
        },
        onCancelPress: function () {
            this.byId("Edit_Frag_Id").close();
            this.byId("gateEntryNoId").setValue("");
            var oModelo = this.getView().getModel("FragModel");
            oModelo.setProperty("/FragData", []);

        },

        // ==============================================================================
        // Date Picker Events: ==========================================================
        // ==============================================================================

        onGateEntryDateChange: function () {

            var oModel = this.getView().getModel("HeaderModel");
            var gateDate = oModel.getProperty("/HeaderData/gateentrydate");
            if (gateDate === "") {
                oModel.setProperty("/HeaderData/rdcdt", "");
            }

        },

        onRdcDateChange: function (oEvent) {

            var oModel = this.getView().getModel("HeaderModel");

            var gateDate = oModel.getProperty("/HeaderData/gateentrydate");
            var rdcDate = oModel.getProperty("/HeaderData/rdcdt");

            if (!gateDate) {
                sap.m.MessageToast.show("Please select Gate Entry Date..");
                oModel.setProperty("/HeaderData/rdcdt", null);
            }

            if (rdcDate >= gateDate) {
                sap.m.MessageToast.show("RDC Date cannot be greater than Gate Entry Date");
                oModel.setProperty("/HeaderData/rdcdt", null);
            }
        },

        onNrgpDateChange: function (oEvent) {

            var oHeaderModel = this.getView().getModel("HeaderModel");
            var oTabModel = this.getView().getModel("TabModel");

            var oSource = oEvent.getSource();
            var oContext = oSource.getBindingContext("TabModel");

            var gateDate = oHeaderModel.getProperty("/HeaderData/gateentrydate");
            var nrgpDate = oSource.getValue();

            if (nrgpDate <= gateDate) {

                sap.m.MessageToast.show("NRGP Date cannot be less than Gate Entry Date");

                var sPath = oContext.getPath();
                oTabModel.setProperty(sPath + "/nrgpdate", null);
            }

        },

        onGrnDateChange: function (oEvent) {

            var oHeaderModel = this.getView().getModel("HeaderModel");
            var oTabModel = this.getView().getModel("TabModel");

            var oSource = oEvent.getSource();
            var oContext = oSource.getBindingContext("TabModel");

            var gateDate = oHeaderModel.getProperty("/HeaderData/gateentrydate");
            var grnDate = oSource.getValue();


            if (grnDate > gateDate) {

                sap.m.MessageToast.show("GRN Doc Date cannot be greater than Gate Entry Date");

                var sPath = oContext.getPath();
                oTabModel.setProperty(sPath + "/grndocdate", null);
            }
        },

        // ============================================================================
        // Gate Entry Fragment : ======================================================
        // ============================================================================

        onGateValueHelpPress: function () {

            sap.ui.core.BusyIndicator.show();



            var oModel = this.getView().getModel("ZCDSGATE_ENTRY_SRVB");

            // Check if the model is valid
            if (!oModel) {
                console.error("OData model is not properly initialized.");
                sap.ui.core.BusyIndicator.hide();
                return;
            }


            var that = this;
            var aAllItems = []; // Array to hold all retrieved items

            // Function to fetch data recursively
            function fetchData(skipCount) {

                oModel.read("/ZCDSGATE_ENTRY_ITM", {
                    //   filters: oFilters,
                    urlParameters: {
                        $top: 5000,  // Request a chunk of 5000 records
                        $skip: skipCount  // Start from the skipCount position
                    },
                    success: function (oData) {
                        var aItems = oData.results;
                        aAllItems = aAllItems.concat(aItems); // Concatenate current chunk to the array                        

                        // Check if there are more records to fetch
                        if (oData.results.length >= 5000) {
                            // If there are more records, fetch next chunk
                            fetchData(skipCount + 5000);
                        } else {
                            // If no more records, all data is fetched
                            finishFetching();
                        }
                    },
                    error: function (oError) {
                        console.error("Error reading data: ", oError);
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            }

            function finishFetching() {

                // Once all data is fetched, proceed to display it
                that.oJSONModel = new sap.ui.model.json.JSONModel({
                    Datas: aAllItems
                });
                that.getView().setModel(that.oJSONModel, "oJSONModel");
                console.log("that.oJSONModel:", that.oJSONModel)

                // Load the value help dialog fragment
                that._oBasicSearchField = new sap.m.SearchField();
                that.loadFragment({
                    name: "zfinwardnew.fragment.GateEntryFragment"
                }).then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();

                    var oColumnProductCode, oColumnDescription, oColumnCompanyCode;
                    that._oVHD_ = oDialog;
                    that.getView().addDependent(oDialog);

                    // Set key fields for filtering in the Define Conditions Tab
                    oDialog.setRangeKeyFields([{
                        label: "gateentryno.",
                        key: "gateentryno",
                        type: "string",
                        typeInstance: new sap.ui.model.type.String({}, {
                            maxLength: 10
                        })
                    }]);

                    // Set Basic Search for FilterBar
                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(that._oBasicSearchField);

                    // Trigger filter bar search when the basic search is fired
                    that._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });

                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(that.oJSONModel);

                        // Bind rows/items based on table type (sap.ui.table.Table or sap.m.Table)
                        if (oTable.bindRows) {
                            // Desktop/Table scenario (sap.ui.table.Table)
                            oTable.bindAggregation("rows", {
                                path: "oJSONModel>/Datas",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.ui.table.Table oColumnDescription
                            oColumnProductCode = new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "gateentryno" }),
                                template: new sap.m.Text({ wrapping: false, text: "{oJSONModel>gateentryno}" })
                            });
                            oColumnProductCode.data({
                                fieldName: "gateentryno"
                            });

                            oTable.addColumn(oColumnProductCode);


                        } else if (oTable.bindItems) {
                            // Mobile scenario (sap.m.Table)
                            oTable.bindAggregation("items", {
                                path: "oJSONModel>/Datas",
                                template: new sap.m.ColumnListItem({
                                    cells: [
                                        new sap.m.Text({ text: "{oJSONModel>gateentryno}" })

                                    ]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Define columns for sap.m.Table (if necessary)
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({ text: "gateentryno" })
                            }));


                        }

                        oDialog.update();
                        sap.ui.core.BusyIndicator.hide();
                    });

                    oDialog.open();
                    sap.ui.core.BusyIndicator.hide();
                });
            }

            // Start fetching data from the beginning
            fetchData(0);

        },

        onValueHelpOkPress_Gate: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getText();

            this.byId("gateEntryNoId").setValue(aValue);

            let aFilter = [];
            if (aValue) {
                aFilter.push(
                    new sap.ui.model.Filter("gateentryno", sap.ui.model.FilterOperator.EQ, aValue)
                );
            }

            const oModel = this.getView().getModel("ZCDSGATE_ENTRY_SRVB");
            const that = this;
            that.getView().setBusy(true);

            let aAllItems = [];
            let iSkip = 0;
            const iTop = 200;

            // --- Recursive fetch (paging) ---
            function fetchData() {
                sap.ui.core.BusyIndicator.show(0);


                oModel.read("/ZCDSGATE_ENTRY_ITM", {
                    filters: aFilter,
                    urlParameters: {
                        "$skip": iSkip,
                        "$top": iTop
                    },
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            aAllItems = aAllItems.concat(oData.results);
                            iSkip += iTop;
                            fetchData(); // continue loading
                            sap.ui.core.BusyIndicator.hide();
                        } else {
                            that.getView().setBusy(false);
                            console.log("Total rows fetched:", aAllItems.length);

                            let aResults = aAllItems;

                            // After fetchData() completes
                            aAllItems.sort(function (a, b) {
                                return Number(a.boxno) - Number(b.boxno); // 
                            });

                            const oFragModel = new sap.ui.model.json.JSONModel({
                                FragData: aAllItems
                            });
                            that.getView().setModel(oFragModel, "FragModel");

                            //  Message if no results
                            if (aResults.length === 0) {
                                sap.m.MessageToast.show("No records found for the given filters.");
                            }
                        }
                    },
                    error: function (error) {
                        that.getView().setBusy(false);
                        console.error("Error fetching data:", error);
                        sap.m.MessageToast.show("Error fetching data.");
                        sap.ui.core.BusyIndicator.hide();

                    }
                });
            }
            // Start fetching
            fetchData();

            this._oVHD_.close();
        },

        onValueHelpCancelPress_Gate: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Gate: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Gate: function (oEvent) {
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet");

            var aFilters = aSelectionSet && aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new sap.ui.model.Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                return aResult;
            }, []);

            aFilters.push(new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter({ path: "gateentryno", operator: sap.ui.model.FilterOperator.Contains, value1: sSearchQuery })


                ],
                and: false
            }));

            this._filterTableGate(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },
        _filterTableGate: function (oFilter) {
            var oVHD = this._oVHD_;

            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                // This method must be called after binding update of the table.
                oVHD.update();
            });
        },

        onFragUpdatePress: function () {

            sap.ui.core.BusyIndicator.show(0);

            var that = this;
            var oTable = this.byId("zInward_tableId1");
            var oModel = this.getView().getModel("ZCDSGATE_ENTRY_SRVB");
            var aIndices = oTable.getSelectedIndices();

            if (aIndices.length === 0) {
                sap.m.MessageBox.information("Please select the row to update");
                sap.ui.core.BusyIndicator.hide();
                return;
            }

            aIndices.forEach(function (iIndex) {

                var oContext = oTable.getContextByIndex(iIndex);
                var oData = oContext.getObject();
                var sGateEntry = oData.gateentryno;
                var sLineItem = oData.line_item;
                // Build key path
                var sPath = oModel.createKey("/ZCDSGATE_ENTRY_ITM", {
                    gateentryno: sGateEntry,
                    line_item: sLineItem
                });

                var oPayload = {
                    gateentryno: oData.gateentryno,
                    line_item: oData.line_item.toString().padStart(3, "0"),
                    gateno_item: oData.gateentryno + "_" + oData.line_item.toString().padStart(3, "0"),
                    rdcno: oData.rdcno,
                    // custcode: oRow.custcode,
                    salesorderno: oData.salesorderno,
                    unbwmatcode: oData.unbwmatcode,
                    matdes: oData.matdes,
                    currency: oData.currency,
                    rdcewval: oData.rdcewval && oData.rdcewval !== "" ? oData.rdcewval : "0.00",
                    cgst: oData.cgst && oData.cgst !== "" ? parseFloat(oData.cgst).toFixed(2) : "0",
                    sgst: oData.sgst && oData.sgst !== "" ? parseFloat(oData.sgst).toFixed(2) : "0",
                    igst: oData.igst && oData.igst !== "" ? parseFloat(oData.igst).toFixed(2) : "0",
                    equipmentid: oData.equipmentid,
                    snequip: oData.snequip,
                    pleqcode: oData.pleqcode,
                    plant: oData.plant,
                    sloc: oData.sloc,
                    grndocno: oData.grndocno,
                    grndocdate: that.formatDate(oData.grndocdate),
                    unit_field: oData.unit_field,
                    qtyrecd: oData.qtyrecd && oData.qtyrecd !== "" ? oData.qtyrecd : "0.000",
                    underwarranty: oData.underwarranty,
                    nrgpno: oData.nrgpno,
                    nrgpdate: that.formatDate(oData.nrgpdate),
                    ewaybillno: oData.ewaybillno,
                    remarks: oData.remarks,
                    iestatus: oData.iestatus
                };

                oModel.update(sPath, oPayload, {
                    success: function () {
                        sap.m.MessageToast.show("Row Updated");
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function () {
                        sap.m.MessageToast.show("Update failed");
                        sap.ui.core.BusyIndicator.hide();

                    }
                });

            });

        },

        // TAX Change:
        onIGSTSelectChange: function (oEvent) {
            var oSelect = oEvent.getSource();
            var oContext = oSelect.getBindingContext("TabModel");
            var sPath = oContext.getPath();
            var oModel = oContext.getModel();

            var cgst = oModel.getProperty(sPath + "/cgst");

            console.log(cgst);
        }


    });
});