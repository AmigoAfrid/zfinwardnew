sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",    

], (Controller, MessageBox, MessageToast, t) => {
    "use strict";

    return Controller.extend("zfinwardnew.controller.ChangeController", {

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

                oModel.read("/ZCDSGATE_ENTRY_HDR", {
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
                        label: "Gate Entry No.",
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
                                label: new sap.m.Label({ text: "Gate Entry No" }),
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

        // ================================================================ 
        // Table Level material : =========================================
        // ================================================================ 
        onMaterialValueHelpPress_Change: function (oEvent) {

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
                    name: "zfinwardnew.fragment.insideChangeFragment.ChangeMaterial"
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

        onValueHelpOkPress_Material_Change: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getKey();
            var sText = oToken.getText();
            var sDescription = sText.split(" (")[0];

            var oContext = this._oInput_M.getBindingContext("FragModel");
            var sPath = oContext.getPath();

            this.getView().getModel("FragModel").setProperty(sPath + "/unbwmatcode", aValue);
            this.getView().getModel("FragModel").setProperty(sPath + "/matdes", sDescription);

            this._oVHD_.close();
        },

        onValueHelpCancelPress_Material_Change: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Material_Change: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Material_Change: function (oEvent) {
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

            this._filterTableMaterial_Change(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTableMaterial_Change: function (oFilter) {
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


        onCurrencyValueHelpPress_Change: function (oEvent) {

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
                    name: "zfinwardnew.fragment.insideChangeFragment.ChangeCurrency"
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

        onValueHelpOkPress_Currency_Change: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getText();

            var oContext = this._oInput_C.getBindingContext("FragModel");
            var sPath = oContext.getPath();

            this.getView().getModel("FragModel").setProperty(sPath + "/currency", aValue);

            this._oVHD_.close();

        },

        onValueHelpCancelPress_Currency_Change: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Currency_Change: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Currency_Change: function (oEvent) {
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

            this._filterTableCurrency_Change(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTableCurrency_Change: function (oFilter) {
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

        onEquipmentValueHelpPress_Change: function (oEvent) {

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
                    name: "zfinwardnew.fragment.insideChangeFragment.ChangeEquipment"
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

        onValueHelpOkPress_Equipment_Change: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getText();

            var oContext = this._oEquip.getBindingContext("FragModel");
            var sPath = oContext.getPath();

            this.getView().getModel("FragModel").setProperty(sPath + "/equipmentid", aValue);

            this._oVHD_.close();

        },

        onValueHelpCancelPress_Equipment_Change: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Equipment_Change: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Equipment_Change: function (oEvent) {
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

            this._filterTableEquipment_Change(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTableEquipment_Change: function (oFilter) {
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

        onUnitHelpRequestPress_Change: function (oEvent) {

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
                    name: "zfinwardnew.fragment.insideChangeFragment.ChangeUnit"
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

        onValueHelpOkPress_Unit_Change: function (oEvent) {

            var oToken = oEvent.getParameter("tokens")[0];

            var aValue = oToken.getText();

            var oContext = this._oInput_U.getBindingContext("FragModel");
            var sPath = oContext.getPath();

            this.getView().getModel("FragModel").setProperty(sPath + "/unit_field", aValue);

            this._oVHD_.close();

        },

        onValueHelpCancelPress_Unit_Change: function () {
            this._oVHD_.close();
        },

        onValueHelpAfterClose_Unit_Change: function () {
            this._oVHD_.destroy();
        },

        onFilterBarSearch_Unit_Change: function (oEvent) {
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

            this._filterTableUnit_Change(new sap.ui.model.Filter({
                filters: aFilters,
                and: true
            }));
        },

        _filterTableUnit_Change: function (oFilter) {
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

         // ====================================================================
        // Tax Change: ========================================================
        // ====================================================================

        onCgstChange_Change: function (oEvent) {
            var oCgst = oEvent.getParameter("selectedItem").getKey();
            var oContext = oEvent.getSource().getBindingContext("FragModel");
            console.log("cgst", oCgst);

            var oSgst = oContext.getModel().getProperty(oContext.getPath() + "/sgst");
            console.log("sgst", oSgst);
            var oIgst = oContext.getModel().getProperty(oContext.getPath() + "/igst");
            console.log("igst", oIgst);

            if (oIgst === "18") {
                sap.m.MessageToast.show("Invalid tax combination selected");
                oContext.getModel().setProperty(oContext.getPath() + "/cgst", 0);

            }

        },

        onSgstChange_Change: function (oEvent) {
            var oSgst = oEvent.getParameter("selectedItem").getKey();
            var oContext = oEvent.getSource().getBindingContext("FragModel");
            console.log("sgst", oSgst);

            var oCgst = oContext.getModel().getProperty(oContext.getPath() + "/cgst");
            console.log("cgst", oCgst);
            var oIgst = oContext.getModel().getProperty(oContext.getPath() + "/igst");
            console.log("igst", oIgst);

            if (oIgst === "18") {
                sap.m.MessageToast.show("Invalid tax combination selected");
                oContext.getModel().setProperty(oContext.getPath() + "/sgst", 0);

            }
        },

        onIgstChange_Change: function (oEvent) {

            var oIgst = oEvent.getParameter("selectedItem").getKey();
            var oContext = oEvent.getSource().getBindingContext("FragModel");
            console.log("igst", oIgst);


            var oCgst = oContext.getModel().getProperty(oContext.getPath() + "/cgst");
            console.log("cgst", oCgst);
            var oSgst = oContext.getModel().getProperty(oContext.getPath() + "/sgst");
            console.log("sgst", oSgst);

            if ((oCgst === "9" || oSgst === "9")) {
                sap.m.MessageToast.show("Invalid tax combination selected");
                oContext.getModel().setProperty(oContext.getPath() + "/igst", 0);

            }
        },        





    });

});