﻿/** @license
 | Version 10.2
 | Copyright 2012 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
dojo.require("esri.map");
dojo.require("mobile.InfoWindow");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.tasks.geometry");
dojo.require("esri.tasks.query");
dojo.require("esri.tasks.locator");
dojo.require("esri.tasks.route");
dojo.require("dojo.date.locale");
dojo.require("dojox.mobile.parser");
dojo.require("dojox.mobile");
dojo.require("js.Config");
dojo.require("dojo.window");
dojo.require("js.date");

var baseMapLayers;  //Variable for storing base map layers
var infoBoxWidth; //variable for storing the width of the box
var showCommentsTab; //variable used for toggling the comments tab
var formatDateAs; //variable to store the date format
var desgFlag = false; //flag used for setting the designation
var devObjectId;    //Temp variable for storing feature object ID
var directions; //Directions in route.
var fontSize; //variable for storing font sizes for all devices.
var showNullValueAs; //variable to store the default value for replacing null values
var webMapId; //Variable used to store webmap id
var generateRouteToNonDesignatedPollingPlace; //flag used for setting the non designated polling place
var handleElected; ////variable for storing elected officials container touch event
var handlePoll; //variable for storing polling container touch event
var highlightPollLayerId = "highlightPollLayerId"; //variable to store highlighting layer ID
var infoPopupFieldsCollection; //array used for storing the fields collection in the info window
var infoTitle; //variable used for the webmap to store the title of the header
var infoWindowContent; //variable used to store the info window content
var infoWindowHeader; //variable used to store the info window header
var infoPopupHeight; //variable used for storing the info window height
var infoPopupWidth; //variable used for storing the info window width
var isBrowser = false; //This variable will be set to 'true' when application is accessed from desktop browsers
var isiOS = false; //This variable will be set to 'true' if the application is accessed from iPhone or iPad
var isMobileDevice = false; //This variable will be set to 'true' when application is accessed from mobile phone device
var isTablet = false; //This variable will be set to 'true' when application is accessed from tablet device


var map;    //variable to store map object
var mapPoint;   //variable to store mappoint
var messages; //variable used for storing the error messages
var newLeft = 0;    //Variable to store the new left value for carrousel of polling place
var newLeftOffice = 0;    //Variable to store the new left value for carrousel of Elected Offices
var pollingCommentsLayer; //variable to store polling comments layer URL
var pollingCommentsLayerId = "pollingCommentsLayerId"; //variable to store polling comments layer Id
var pollingPlaceData;  //variable to store polling place layer URL
var pollMobileLayer; //variable to store polling place layer URL for mobile
var pollLayer;  //variable to store polling place layer URL
var pollLayerId = 'pollLayerID';    //variable to store polling place layer ID
var pollPoint; //Point represent polling place geometry.
var precinctLayer; //variable to store precinct layer URL
var precinctLayerId = 'precinctLayerID';    //variable to store precinct layer ID
var precinctOfficeLayer; //variable to store table layer URL
var precinctOfficeLayerId = 'precinctOfficeLayerId'; //variable to store table layer ID
var queryTask; //variable used to query the layer
var electedOfficialsTabData; //array used for storing the collection of fields for election results

var routeGraphicsLayerId = 'routeGraphicsLayerID'; //variable to store route layer Id
var routeSymbol; //Symbol to mark the route.
var routeTask; //Route Task to find the route.

var selectedPollPoint; //variable used to store the selected polling place
var tempGraphicsLayerId = 'tempGraphicsLayerID';  //variable to store graphics layer ID
var mapSharingOptions; //variable to store the tiny service URL
var useWebmap; //flag used for setting the webmap use.
var referenceOverlayLayer; //variable to store the reference overlayLayer service URL
var locatorSettings; //variable to store the locator settings
var commentsInfoPopupFieldsCollection; //variable to store the info popup fields for comments
var databaseFields; // Define the database field names
var precinctID; //variable to store the field Id for precinct
var featureID; //variable to store feature Id while sharing

var lastSearchString; //variable for storing the last search string value
var stagedSearch; //variable for storing the time limit for search
var lastSearchTime; //variable for storing the time of last searched value
var primaryKeyForComments; //variable to store the primary key for non spatial comments table


//This initialization function is called when the DOM elements are ready
function init() {
    esri.config.defaults.io.proxyUrl = "proxy.ashx";        //Setting to use proxy file
    esriConfig.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.io.timeout = 180000;    //esri request timeout value

    var userAgent = window.navigator.userAgent;

    if (userAgent.indexOf("iPhone") >= 0 || userAgent.indexOf("iPad") >= 0) {
        isiOS = true;
    }
    if ((userAgent.indexOf("Android") >= 0 && userAgent.indexOf("Mobile") >= 0) || userAgent.indexOf("iPhone") >= 0) {
        fontSize = 15;
        isMobileDevice = true;
        dojo.byId('dynamicStyleSheet').href = "styles/mobile.css";
    }
    else if ((userAgent.indexOf("iPad") >= 0) || (userAgent.indexOf("Android") >= 0)) {
        fontSize = 14;
        isTablet = true;
        dojo.byId('dynamicStyleSheet').href = "styles/tablet.css";
    }
    else {
        fontSize = 11;
        isBrowser = true;
        dojo.byId('dynamicStyleSheet').href = "styles/browser.css";
    }
    dojo.byId("divSplashContent").style.fontSize = fontSize + "px";

    // Identify the key presses while implementing auto-complete and assign appropriate actions
    dojo.connect(dojo.byId("txtAddress"), 'onkeyup', function (evt) {
	
        if (evt) {
            if (evt.keyCode == dojo.keys.ENTER) {
                if (dojo.byId("txtAddress").value != '') {
                    dojo.byId("imgSearchLoader").style.display = "block";
                    LocateAddress();
                    return;
                }
            }
            if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode == 8 || evt.keyCode == 110 || evt.keyCode == 188)) || (evt.keyCode == 86 && evt.ctrlKey) || (evt.keyCode == 88 && evt.ctrlKey)) {
                evt = (evt) ? evt : event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) evt.stopPropagation();
                return;
            }

            if (dojo.coords("divAddressContent").h > 0) {
                if (dojo.byId("txtAddress").value.trim() != '') {
                    if (lastSearchString != dojo.byId("txtAddress").value.trim()) {
                        lastSearchString = dojo.byId("txtAddress").value.trim();
                        RemoveChildren(dojo.byId('tblAddressResults'));

                        // Clear any staged search
                        clearTimeout(stagedSearch);

                        if (dojo.byId("txtAddress").value.trim().length > 0) {
                            // Stage a new search, which will launch if no new searches show up
                            // before the timeout
                            stagedSearch = setTimeout(function () {
                                dojo.byId("imgSearchLoader").style.display = "block";
                                LocateAddress();
                            }, 500);
                        }
                    }
                } else {
                    lastSearchString = dojo.byId("txtAddress").value.trim();
                    dojo.byId("imgSearchLoader").style.display = "none";
                    RemoveChildren(dojo.byId('tblAddressResults'));
                    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
                }
            }
        }
    });

    dojo.connect(dojo.byId("txtAddress"), 'onpaste', function (evt) {
        setTimeout(function () {
            LocateAddress();
        }, 100);
    });

    dojo.connect(dojo.byId("txtAddress"), 'oncut', function (evt) {
        setTimeout(function () {
            LocateAddress();
        }, 100);
    });

    window.onkeydown = function (e) {
        return !(e.keyCode == 9);
    };

    //Check whether browser supports geolocation or not using modernizr
    if (!Modernizr.geolocation) {
        dojo.byId("tdGeolocation").style.display = "none";
    }

    // Read config.js file to set appropriate values
    var responseObject = new js.Config();
    useWebmap = responseObject.UseWebmap;
    if (useWebmap) {
        webMapId = responseObject.WebMapId;
        var count = 0;
        var webmapDetails = getWebMapInfo("electionPollingPlace", webMapId);
        webmapDetails.addCallback(function (webmapInfo) {
            electedOfficialsTabData = [];
            infoPopupFieldsCollection = [];
            referenceOverlayLayer.ServiceUrl = webmapInfo.basemap.url;

            for (var b = 0; b < webmapInfo.operationalLayers.length; b++) {
                dojo.io.script.get({
                    url: webmapInfo.operationalLayers[b].url + "?f=pjson",
                    callbackParamName: "callback",
                    load: function (data) {
                        count++;
                        for (var c = 0; c < webmapInfo.operationalLayers.length; c++) {
                            if (this.url == webmapInfo.operationalLayers[c].url + "?f=pjson") {
                                break;
                            }
                        }
                        if (data.geometryType == "esriGeometryPolygon") {
                            if (webmapInfo.operationalLayers[c].popupInfo) {
                                if (!electedOfficialsTabData[webmapInfo.operationalLayers[c].id]) {
                                    dataLayer = [];
                                    for (var d = 0; d < webmapInfo.operationalLayers[c].popupInfo.fieldInfos.length; d++) {
                                        if (webmapInfo.operationalLayers[c].popupInfo.fieldInfos[d].visible) {
                                            dataLayer.push({ "DisplayText": webmapInfo.operationalLayers[c].popupInfo.fieldInfos[d].label + ":", "FieldName": "${" + webmapInfo.operationalLayers[c].popupInfo.fieldInfos[d].fieldName + "}" });
                                        }
                                    }
                                    electedOfficialsTabData[webmapInfo.operationalLayers[c].id] = [];
                                    electedOfficialsTabData[webmapInfo.operationalLayers[c].id] = ({ "ServiceUrl": webmapInfo.operationalLayers[c].url, "HeaderColor": "#393939", "Title": webmapInfo.operationalLayers[c].title.split("- ")[1], "Data": dataLayer });
                                }
                            }
                            else {
                                precinctLayer.ServiceUrl = webmapInfo.operationalLayers[c].url;
                            }
                        }
                        else {
                            if (!isMobileDevice) {
                                pollLayer.ServiceUrl = webmapInfo.operationalLayers[c].url;
                                if (webmapInfo.operationalLayers[c].popupInfo.title) {
                                    infoTitle = webmapInfo.operationalLayers[c].popupInfo.title.split("{")[0];
                                    infoWindowHeader = "$" + webmapInfo.operationalLayers[c].popupInfo.title.split(": ")[1];
                                }
                                if (webmapInfo.operationalLayers[c].popupInfo.fieldInfos.length > 0) {
                                    for (var r = 0; r < webmapInfo.operationalLayers[c].popupInfo.fieldInfos.length; r++) {
                                        if (webmapInfo.operationalLayers[c].popupInfo.fieldInfos[r].visible) {
                                            infoWindowContent = "${" + webmapInfo.operationalLayers[c].popupInfo.fieldInfos[r].fieldName + "}";
                                            break;
                                        }
                                    }
                                }
                                for (var e = 0; e < webmapInfo.operationalLayers[c].popupInfo.fieldInfos.length; e++) {
                                    if (webmapInfo.operationalLayers[c].popupInfo.fieldInfos[e].visible) {
                                        infoPopupFieldsCollection.push({ "DisplayText": webmapInfo.operationalLayers[c].popupInfo.fieldInfos[e].label + ":", "FieldName": "${" + webmapInfo.operationalLayers[c].popupInfo.fieldInfos[e].fieldName + "}" });
                                    }
                                }
                            }
                            else {
                                pollMobileLayer.ServiceUrl = webmapInfo.operationalLayers[c].url;
                                if (webmapInfo.operationalLayers[c].popupInfo.title) {
                                    infoTitle = webmapInfo.operationalLayers[c].popupInfo.title.split("{")[0];
                                    infoWindowHeader = "$" + webmapInfo.operationalLayers[c].popupInfo.title.split(": ")[1];
                                }
                                if (webmapInfo.operationalLayers[c].popupInfo.fieldInfos.length > 0) {
                                    for (var r = 0; r < webmapInfo.operationalLayers[c].popupInfo.fieldInfos.length; r++) {
                                        if (webmapInfo.operationalLayers[c].popupInfo.fieldInfos[r].visible) {
                                            infoWindowContent = "${" + webmapInfo.operationalLayers[c].popupInfo.fieldInfos[r].fieldName + "}";
                                            break;
                                        }
                                    }
                                }
                                for (var e = 0; e < webmapInfo.operationalLayers[c].popupInfo.fieldInfos.length; e++) {
                                    if (webmapInfo.operationalLayers[c].popupInfo.fieldInfos[e].visible) {
                                        infoPopupFieldsCollection.push({ "DisplayText": webmapInfo.operationalLayers[c].popupInfo.fieldInfos[e].label + ":", "FieldName": "${" + webmapInfo.operationalLayers[c].popupInfo.fieldInfos[e].fieldName + "}" });
                                    }
                                }
                            }
                        }
                        if (count == webmapInfo.operationalLayers.length) {
                            MapInitFunction();
                        }
                    },
                    error: function (error) {
                        alert(error.message);
                    }
                });
            }
        });
    }
    Initialize(responseObject);
}

//This function calls at initialize state
function Initialize(responseObject) {
    var infoWindow = new mobile.InfoWindow({
        domNode: dojo.create("div", null, dojo.byId("map"))
    });

    if (isMobileDevice) {
        dojo.byId('divInfoContainer').style.display = "none";
        dojo.replaceClass("divAddressHolder", "hideContainer", "hideContainerHeight");
        dojo.byId('divAddressContainer').style.display = "none";
        dojo.removeClass(dojo.byId('divInfoContainer'), "opacityHideAnimation");
        dojo.removeClass(dojo.byId('divAddressContainer'), "hideContainerHeight");
        dojo.byId('divSplashScreenContent').style.width = "95%";
        dojo.byId('divSplashScreenContent').style.height = "95%";
        dojo.byId('imgDirections').src = "images/imgDirections.png";
        dojo.byId('imgDirections').title = "Directions";
        dojo.byId("divLogo").style.display = "none";
        dojo.byId("lblAppName").style.display = "none";
        dojo.byId("lblAppName").style.width = "80%";
    }
    else {
        var imgBasemap = document.createElement('img');
        imgBasemap.src = "images/imgBaseMap.png";
        imgBasemap.className = "imgOptions";
        imgBasemap.title = "Switch Basemap";
        imgBasemap.id = "imgBaseMap";
        imgBasemap.style.cursor = "pointer";
        imgBasemap.onclick = function () {
            ShowBaseMaps();
        }
        dojo.byId("tdBaseMap").appendChild(imgBasemap);
        dojo.byId("tdBaseMap").className = "tdHeader";
        dojo.byId('divSplashScreenContent').style.width = "350px";
        dojo.byId('divSplashScreenContent').style.height = "290px";
        dojo.byId('divAddressContainer').style.display = "block";
        dojo.byId('imgDirections').src = "images/Details.png";
        dojo.byId('imgDirections').title = "Details";
        dojo.byId('imgDirections').style.display = "none";
        dojo.byId("divLogo").style.display = "block";
    }

    dojo.byId('imgApp').src = responseObject.ApplicationIcon;
    dojo.byId("lblAppName").innerHTML = responseObject.ApplicationName;
    dojo.byId('divSplashContent').innerHTML = responseObject.SplashScreenMessage;

    dojo.xhrGet(
                    {
                        url: "ErrorMessages.xml",
                        handleAs: "xml",
                        preventCache: true,
                        load: function (xmlResponse) {
                            messages = xmlResponse;
                        }
                    });


    map = new esri.Map("map", {
        slider: true,
        infoWindow: infoWindow
    });

    ShowProgressIndicator();

    geometryService = new esri.tasks.GeometryService(responseObject.GeometryService);

    pollLayer = responseObject.PollLayer;
    pollMobileLayer = responseObject.PollMobileLayer;
    precinctLayer = responseObject.PrecinctLayer;
    precinctOfficeLayer = responseObject.PrecinctOfficeLayer;
    baseMapLayers = responseObject.BaseMapLayers;
    locatorSettings = responseObject.LocatorSettings;
    electedOfficialsTabData = responseObject.ElectedOfficialsTabData;
    infoPopupFieldsCollection = responseObject.InfoPopupFieldsCollection;
    pollingPlaceData = responseObject.PollingPlaceTabData;
    infoBoxWidth = responseObject.InfoBoxWidth;
    mapSharingOptions = responseObject.MapSharingOptions;

    infoPopupWidth = responseObject.InfoPopupWidth;
    infoPopupHeight = responseObject.InfoPopupHeight;
    infoWindowContent = responseObject.InfoWindowContent;
    infoWindowHeader = responseObject.InfoWindowHeader;
    showCommentsTab = responseObject.ShowCommentsTab;

    formatDateAs = responseObject.FormatDateAs;
    generateRouteToNonDesignatedPollingPlace = responseObject.GenerateRouteToNonDesignatedPollingPlace;
    pollingCommentsLayer = responseObject.PollingCommentsLayer;
    showNullValueAs = responseObject.ShowNullValueAs;
    commentsInfoPopupFieldsCollection = responseObject.CommentsInfoPopupFieldsCollection;
    databaseFields = responseObject.DatabaseFields;
    precinctID = responseObject.PrecinctID;
    referenceOverlayLayer = responseObject.ReferenceOverlayLayer;
    primaryKeyForComments = responseObject.PrimaryKeyForComments;

    if (!showCommentsTab) {
        dojo.byId('tdComments').style.display = "none";
    }

    CreateBaseMapComponent();
    dojo.connect(map, "onLoad", function () {
        var zoomExtent;
        var extent = GetQuerystring('extent');
        if (extent != "") {
            zoomExtent = extent.split(',');
        }
        else {
            zoomExtent = responseObject.DefaultExtent.split(",");
        }
        var startExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
        map.setExtent(startExtent);
        if (!useWebmap) {
            MapInitFunction();
        }
    });

    dojo.connect(map, "onExtentChange", function (evt) {
        SetMapTipPosition();
        if (dojo.coords("divAppContainer").h > 0) {
            ShareLink(false);
        }
    });

    dojo.connect(map, "onClick", FindLocation);

    // Set address search parameters
    dojo.byId("txtAddress").setAttribute("defaultAddress", responseObject.LocatorSettings.DefaultValue);
    dojo.byId('txtAddress').value = responseObject.LocatorSettings.DefaultValue;
    dojo.byId("txtAddress").setAttribute("defaultAddressTitle", responseObject.LocatorSettings.DefaultValue);
    dojo.byId("txtAddress").style.color = "gray";
    dojo.connect(dojo.byId('txtAddress'), "ondblclick", ClearDefaultText);
    dojo.connect(dojo.byId('txtAddress'), "onfocus", function (evt) {
        this.style.color = "#FFF";
    });
    dojo.connect(dojo.byId('txtAddress'), "onblur", ReplaceDefaultText);

    for (var index in pollingPlaceData) {
        if (pollingPlaceData[index].ShowDirection) {
            routeTask = new esri.tasks.RouteTask(responseObject.RouteServiceURL);
            routeSymbol = new esri.symbol.SimpleLineSymbol().setColor(responseObject.RouteColor).setWidth(responseObject.RouteWidth);
            dojo.connect(routeTask, "onSolveComplete", function (routeResponse) {
                ShowRoute(routeResponse);
            });
        }
    }

    dojo.connect(dojo.byId('imgHelp'), "onclick", function () {
        window.open(responseObject.HelpURL);
    });
}

//Function to create graphics and feature layer
function MapInitFunction() {
	
    if (dojo.query('.esriControlsBR', dojo.byId('map')).length > 0) {
        dojo.query('.esriControlsBR', dojo.byId('map'))[0].id = "esriLogo";
    }
	
    dojo.addClass("esriLogo", "esriLogo");
    dojo.byId('divSplashScreenContainer').style.display = "block";
    dojo.replaceClass("divSplashScreenContent", "showContainer", "hideContainer");
    SetHeightSplashScreen();
    if (!isMobileDevice) {
        CreateDataLayOut();
        CreateOfficeDataLayOut();
    }
    else {
        SetAddressResultsHeight();
        SetHeightComments();
        SetHeightViewDetails();
        SetHeightViewDirections();
        SetHeightCmtControls();
    }

    dojo.byId("esriLogo").style.bottom = "10px";

    if (referenceOverlayLayer.DisplayOnLoad) {
        var layerType = referenceOverlayLayer.ServiceUrl.substring(((referenceOverlayLayer.ServiceUrl.lastIndexOf("/")) + 1), (referenceOverlayLayer.ServiceUrl.length));
        if (!isNaN(layerType)) {
            var overlaymap = new esri.layers.FeatureLayer(referenceOverlayLayer.ServiceUrl, {
                mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
                outFields: ["*"]
            });
            map.addLayer(overlaymap);

        }
        else {
            var url1 = referenceOverlayLayer.ServiceUrl + "?f=json";
            esri.request({
                url: url1, handleAs: "json",
                load: function (data) {
                    if (!data.singleFusedMapCache) {
                        var imageParameters = new esri.layers.ImageParameters();
                        //Takes a URL to a non cached map service.
                        var overlaymap = new esri.layers.ArcGISDynamicMapServiceLayer(referenceOverlayLayer.ServiceUrl, { "imageParameters": imageParameters });
                        map.addLayer(overlaymap);
                    }
                    else {
                        var overlaymap = new esri.layers.ArcGISTiledMapServiceLayer(referenceOverlayLayer.ServiceUrl);
                        map.addLayer(overlaymap);
                    }
                }
            });
        }
    }

    var precinctLayer1 = new esri.layers.FeatureLayer(precinctLayer.ServiceUrl, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        displayOnPan: isBrowser ? false : true,
        outFields: ["*"]
    });

    precinctLayer1.id = precinctLayerId;
    if (precinctLayer.UseColor) {
        var precinctSymbol = new esri.symbol.SimpleFillSymbol();
        var precinctfillColor = new dojo.Color(precinctLayer.Color);
        precinctfillColor.a = precinctLayer.Alpha;
        precinctSymbol.setColor(precinctfillColor);
        var precinctRenderer = new esri.renderer.SimpleRenderer(precinctSymbol);
        precinctLayer1.setRenderer(precinctRenderer);
    }

    var officeLayer = new esri.layers.FeatureLayer(precinctOfficeLayer, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["*"]
    });
    officeLayer.id = 'precinctOfficeLayerId';

    map.addLayer(precinctLayer1);
    map.addLayer(officeLayer);

    var gLayer = new esri.layers.GraphicsLayer({ displayOnPan: isBrowser ? false : true });
    gLayer.id = tempGraphicsLayerId;
    map.addLayer(gLayer);

    var pollLayer1 = new esri.layers.FeatureLayer(isBrowser ? pollLayer.ServiceUrl : pollMobileLayer.ServiceUrl, {
        mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
        displayOnPan: isBrowser ? true : true,
        outFields: ["*"]
    });

    pollLayer1.id = pollLayerId;
    if (isBrowser) {
        if (pollLayer.UseImage) {
            var pictureSymbol = new esri.symbol.PictureMarkerSymbol(pollLayer.Image, 25, 25);
            var pollingPlaceRenderer = new esri.renderer.SimpleRenderer(pictureSymbol);
            pollLayer1.setRenderer(pollingPlaceRenderer);
        }
    }
    else {
        if (pollMobileLayer.UseImage) {
            var pictureSymbol = new esri.symbol.PictureMarkerSymbol(pollMobileLayer.Image, 25, 25);
            var pollingPlaceRenderer = new esri.renderer.SimpleRenderer(pictureSymbol);
            pollLayer1.setRenderer(pollingPlaceRenderer);
        }
    }

    var gLayer = new esri.layers.GraphicsLayer({ displayOnPan: isBrowser ? false : true });
    gLayer.id = highlightPollLayerId;
    map.addLayer(gLayer);

    var gLayer = new esri.layers.GraphicsLayer({ displayOnPan: isBrowser ? false : true });
    gLayer.id = routeGraphicsLayerId;
    map.addLayer(gLayer);

    dojo.connect(pollLayer1, "onUpdateEnd", function (err) {
        if (err) {
            HideProgressIndicator();
            alert(err.message);
            return;
        }

        var extent = GetQuerystring('extent');
        if (extent != "") {
            var addressPoint = window.location.toString().split('$addressPoint=');
            if (addressPoint.length > 1) {
                if (addressPoint[1].split(",").length > 0) {
                    if (window.location.toString().split('$featureID=').length > 0) {
                        mapPoint = new esri.geometry.Point(addressPoint[1].split(",")[0], addressPoint[1].split(",")[1].split('$featureID=')[0], map.spatialReference);
                    }
                    else {
                        mapPoint = new esri.geometry.Point(addressPoint[1].split(",")[0], addressPoint[1].split(",")[1], map.spatialReference);
                    }
                    LocateGraphicOnMap(false);
                }
            }
            setTimeout(function () {
                var url = esri.urlToObject(window.location.toString());
                if (url.query && url.query != null) {
                    if (url.query.extent.split("$featureID=").length > 0) {
                        featureID = url.query.extent.split("$featureID=")[1];
                    }
                }
                if (featureID != "" && featureID != null && featureID != undefined) {
                    ExecuteQueryTask();
                }
                HideProgressIndicator();
            }, (generateRouteToNonDesignatedPollingPlace) ? 2500 : 3000);
        }
        else {
            HideProgressIndicator();
        }
        dojo.disconnect(this);
    });

    dojo.connect(pollLayer1, "onClick", function (evtArgs) {
        ShowServiceInfoDetails(evtArgs.graphic.geometry, evtArgs.graphic.attributes);
        evtArgs = (evtArgs) ? evtArgs : event;
        evtArgs.cancelBubble = true;
        if (evtArgs.stopPropagation) {
            evtArgs.stopPropagation();
        }
        if (!isMobileDevice) {
            ShowPollingPlaceDetails();
        }
    });
    map.addLayer(pollLayer1);

    var pollingCommentsLayer1 = new esri.layers.FeatureLayer(pollingCommentsLayer, {
        mode: esri.layers.FeatureLayer.MODE_SELECTION,
        outFields: ["*"],
        id: pollingCommentsLayerId,
        displayOnPan: isBrowser ? false : true
    });
    map.addLayer(pollingCommentsLayer1);

    dojo.byId("txtComments").onfocus = function () {
        CreateScrollbar(dojo.byId("divCmtIpContainer"), dojo.byId("divCmtIpContent"));
    };

    if (!isMobileDevice) {
        window.onresize = function () {
            resizeHandler();
            setTimeout(function () {
                dojo.disconnect(handlePoll);
                dojo.disconnect(handleElected);
                CreateHorizontalScrollbar(dojo.byId("divOfficeData"), dojo.byId("carouselOfficescroll"));
                CreateHorizontalScrollbar(dojo.byId("divPollingData"), dojo.byId("carouselscroll"));
            }, 300);
            ResetSlideControls();
        }
    }
    else {
        window.onresize = function () {
            orientationChanged();
        }
    }
}

//Display polling details at bottom panel
function ShowPollingPlaceDetails() {
    if (mapPoint) {
        if (!noRoute) {
            dojo.byId('divPollingPlaceDetailsHeader').className = "divSelectedHeader";
            dojo.byId('divElectedOfficialsHeader').className = "divDefaultHeader2";
            dojo.byId('divPollingPlaceDetailsHeader').style.cursor = "default";
            dojo.byId('divElectedOfficialsHeader').style.cursor = "pointer";
            dojo.byId("imgToggleResults").style.cursor = "pointer";
            dojo.byId('divGradient').style.display = 'none';
            dojo.byId('divPollingDetails').style.display = "block";
            ResetSlideControls();
            if (dojo.byId("divSegmentContent")) {
                CreateDirectionsScrollBar();
            }
            for (var index in pollingPlaceData) {
                if (pollingPlaceData[index].ShowDirection) {
                    continue;
                }
                if (dojo.byId("div" + index + "content")) {
                    CreatePollingDetailsScrollBar("div" + index + "container", "div" + index + "content");
                }
            }
            dojo.disconnect(handlePoll);
            dojo.disconnect(handleElected);
            CreateHorizontalScrollbar(dojo.byId("divPollingData"), dojo.byId("carouselscroll"));
        }
    }
    else {
        ClearSelection();
    }
}

//Display data for elected officials at bottom panel
function ElectedOfficials() {
    if (mapPoint) {
        if (!noRoute) {
            dojo.byId('divElectedOfficialsHeader').className = "divSelectedHeader";
            dojo.byId('divPollingPlaceDetailsHeader').className = "divDefaultHeader";

            dojo.byId('divPollingPlaceDetailsHeader').style.cursor = "pointer";
            dojo.byId('divElectedOfficialsHeader').style.cursor = "default";
            dojo.byId("imgToggleResults").style.cursor = "pointer";

            dojo.byId('divPollingDetails').style.display = "none";
            dojo.byId('divGradient').style.display = 'block';

            ResetSlideControls();

            dojo.disconnect(handlePoll);
            dojo.disconnect(handleElected);
            CreateHorizontalScrollbar(dojo.byId("divOfficeData"), dojo.byId("carouselOfficescroll"));
        }
    }
    else {
        ClearSelection();
    }
}

//Create layout for polling data at bottom panel
function CreateDataLayOut() {
    RemoveChildren(dojo.byId('divPollingPlaceDataContainer'));
    var i = 0;
    var tableHeader = document.createElement("table");
    var tbodyHeader = document.createElement("tbody");
    tableHeader.appendChild(tbodyHeader);
    var tr = document.createElement("tr");
    tbodyHeader.appendChild(tr);

    for (var index in pollingPlaceData) {
        var cmtsBox = false;
        if (!pollingPlaceData[index].Data) {
            if (!((pollingPlaceData[index].ShowDirection) || (pollingPlaceData[index].ShowDirection == false))) {
                if (showCommentsTab) {
                    cmtsBox = true;
                }
            }
        }

        if (pollingPlaceData[index].Data || (pollingPlaceData[index].ShowDirection) || cmtsBox) {
            var td = document.createElement("td");
            var templateNode = dojo.byId('divTemplate');
            var dataContainerNode = templateNode.cloneNode(true);
            dataContainerNode.style.display = "block";
            dataContainerNode.id = "div" + index;
            dataContainerNode.style.width = infoBoxWidth + "px";
            var divDataHeader = dojo.query(".divDetailsHeader", dataContainerNode)[0];

            var spanHeader = dojo.query(".spanHeader", divDataHeader)[0];
            var value;
            if (pollingPlaceData[index].Title.length > 0) {
                if (isBrowser) {
                    value = pollingPlaceData[index].Title.trim();
                    value = value.trimString(Math.round(infoBoxWidth / 7));
                    if (value.length > Math.round(infoBoxWidth / 7)) {
                        spanHeader.title = pollingPlaceData[index].Title;
                    }
                }
                else if (isTablet) {
                    value = pollingPlaceData[index].Title.trim();
                    value = value.trimString(Math.round(infoBoxWidth / 9));
                }
            }
            spanHeader.innerHTML = value;
            divDataHeader.style.backgroundColor = pollingPlaceData[index].HeaderColor;
            divDataHeader.style.borderBottom = "gray 1px solid";
            var divDataContent = dojo.query(".divContentStyle", dataContainerNode);
            divDataContent[0].id = "div" + index + "container";
            divDataContent[0].style.position = "relative";
            divDataContent[1].id = "div" + index + "content";
            divDataContent[1].style.position = "absolute";
            divDataContent[1].style.overflow = "hidden";

            td.appendChild(dataContainerNode);
            tr.appendChild(td);
        }
    }
    dojo.byId('divPollingPlaceDataContainer').appendChild(tableHeader);
}

//Create layout for elected data at bottom panel
function CreateOfficeDataLayOut() {
    RemoveChildren(dojo.byId('divOfficeDataContainer'));
    var i = 0;
    var tableHeader = document.createElement("table");
    var tbodyHeader = document.createElement("tbody");
    tableHeader.appendChild(tbodyHeader);
    var tr = document.createElement("tr");
    tbodyHeader.appendChild(tr);
    for (var index in electedOfficialsTabData) {
        var td = document.createElement("td");
        var templateNode = dojo.byId('divTemplate');
        var dataContainerNode = templateNode.cloneNode(true);
        dataContainerNode.style.display = "block";
        dataContainerNode.id = "div" + index;
        dataContainerNode.style.width = infoBoxWidth + "px";

        var divDataHeader = dojo.query(".divDetailsHeader", dataContainerNode)[0];
        var spanHeader = dojo.query(".spanHeader", divDataHeader)[0];
        var value;
        if (electedOfficialsTabData[index].Title.length > 0) {
            if (isBrowser) {
                value = electedOfficialsTabData[index].Title.trim();
                value = value.trimString(Math.round(infoBoxWidth / 7));
                if (value.length > Math.round(infoBoxWidth / 7)) {
                    spanHeader.title = electedOfficialsTabData[index].Title;
                }
            }
            else if (isTablet) {
                value = electedOfficialsTabData[index].Title.trim();
                value = value.trimString(Math.round(infoBoxWidth / 9));
            }
        }
        spanHeader.innerHTML = value;
        divDataHeader.style.backgroundColor = electedOfficialsTabData[index].HeaderColor;
        divDataHeader.style.borderBottom = "gray 1px solid";
        var divDataContent = dojo.query(".divContentStyle", dataContainerNode);
        divDataContent[0].id = "div" + index + "container";
        divDataContent[1].id = "div" + index + "content";

        td.appendChild(dataContainerNode);
        tr.appendChild(td);
    }
    dojo.byId('divOfficeDataContainer').appendChild(tableHeader);
}

//Clear data at bottom panel
function ClearSelection() {
    dojo.byId('divPollingPlaceDetailsHeader').className = "divDefaultHeader";
    dojo.byId('divElectedOfficialsHeader').className = "divDefaultHeader2";
    dojo.byId('divPollingPlaceDetailsHeader').style.cursor = "default";
    dojo.byId('divElectedOfficialsHeader').style.cursor = "default";
    dojo.byId("imgToggleResults").style.cursor = "default";
    dojo.byId('imgToggleResults').title = "";
}

dojo.addOnLoad(init);