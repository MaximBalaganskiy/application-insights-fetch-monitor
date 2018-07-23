System.register(["./app-insights-sdk"], function (exports_1, context_1) {
    "use strict";
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (this && this.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var FetchMonitor, fetchMonitor;
    var __moduleName = context_1 && context_1.id;
    function initAppInsightsFetchMonitor() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!window["Microsoft"] || !window["Microsoft"]["ApplicationInsights"])) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(function () { return r(); }, 100); })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 2:
                        if (!appInsights.config.disableAjaxTracking) {
                            fetchMonitor = new FetchMonitor(appInsights);
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    exports_1("initAppInsightsFetchMonitor", initAppInsightsFetchMonitor);
    return {
        setters: [
            function (_1) {
            }
        ],
        execute: function () {
            FetchMonitor = /** @class */ (function () {
                function FetchMonitor(appInsights) {
                    this.currentWindowHost = window.location.host && window.location.host.toLowerCase();
                    this.appInsights = appInsights;
                    this.initialized = false;
                    this.Init();
                }
                FetchMonitor.prototype.Init = function () {
                    if (this.supportsMonitoring()) {
                        this.instrumentFetch();
                        this.initialized = true;
                    }
                };
                FetchMonitor.prototype.supportsMonitoring = function () {
                    var result = true;
                    if (Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(Request) ||
                        Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(Request.prototype) ||
                        Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(fetch)) {
                        result = false;
                    }
                    return result;
                };
                FetchMonitor.prototype.instrumentFetch = function () {
                    var originalFetch = window.fetch;
                    var fetchMonitorInstance = this;
                    window.fetch = function fetch(input, init) {
                        // this format corresponds with activity logic on server-side and is required for the correct correlation
                        var id = "|" + fetchMonitorInstance.appInsights.context.operation.id + "." + Microsoft.ApplicationInsights.Util.newId();
                        var ajaxData;
                        try {
                            ajaxData = fetchMonitorInstance.createAjaxRecord(input, init);
                            init = fetchMonitorInstance.includeCorrelationHeaders(ajaxData, input, init);
                        }
                        catch (e) {
                            Microsoft.ApplicationInsights._InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL, Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxOpen, "Failed to monitor Window.fetch, monitoring data for this fetch call may be incorrect.", {
                                ajaxDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(input),
                                exception: Microsoft.ApplicationInsights.Util.dump(e)
                            });
                        }
                        return originalFetch(input, init)
                            .then(function (response) {
                            fetchMonitorInstance.onFetchComplete(response, ajaxData);
                            return response;
                        })
                            .catch(function (reason) {
                            fetchMonitorInstance.onFetchFailed(input, ajaxData);
                            throw reason;
                        });
                    };
                };
                FetchMonitor.prototype.createAjaxRecord = function (input, init) {
                    // this format corresponds with activity logic on server-side and is required for the correct correlation
                    var id = "|" + this.appInsights.context.operation.id + "." + Microsoft.ApplicationInsights.Util.newId();
                    var ajaxData = new Microsoft.ApplicationInsights.ajaxRecord(id);
                    ajaxData.requestSentTime = Microsoft.ApplicationInsights.dateTime.Now();
                    if (input instanceof Request) {
                        ajaxData.requestUrl = input ? input.url : "";
                    }
                    else {
                        ajaxData.requestUrl = input;
                    }
                    if (init && init.method) {
                        ajaxData.method = init.method;
                    }
                    else if (input && typeof (input) !== "string") {
                        ajaxData.method = input.method;
                    }
                    else {
                        ajaxData.method = "GET";
                    }
                    return ajaxData;
                };
                FetchMonitor.prototype.includeCorrelationHeaders = function (ajaxData, input, init) {
                    if (Microsoft.ApplicationInsights.CorrelationIdHelper.canIncludeCorrelationHeader(this.appInsights.config, ajaxData.getAbsoluteUrl(), this.currentWindowHost)) {
                        if (!init) {
                            init = {};
                        }
                        // init headers override original request headers
                        // so, if they exist use only them, otherwise use request's because they should have been applied in the first place
                        // not using original request headers will result in them being lost
                        init.headers = new Headers(init.headers || (input instanceof Request ? (input.headers || {}) : {}));
                        init.headers.set(Microsoft.ApplicationInsights.RequestHeaders.requestIdHeader, ajaxData.id);
                        var appId = this.appInsights.context ? this.appInsights.context.appId() : null;
                        if (appId) {
                            init.headers.set(Microsoft.ApplicationInsights.RequestHeaders.requestContextHeader, Microsoft.ApplicationInsights.RequestHeaders.requestContextAppIdFormat + appId);
                        }
                    }
                    return init;
                };
                FetchMonitor.getFailedFetchDiagnosticsMessage = function (input) {
                    var result = "";
                    try {
                        if (!Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(input)) {
                            if (typeof (input) === "string") {
                                result += "(url: '" + input + "')";
                            }
                            else {
                                result += "(url: '" + input.url + "')";
                            }
                        }
                        // tslint:disable-next-line:no-empty
                    }
                    catch (e) { }
                    return result;
                };
                FetchMonitor.prototype.onFetchComplete = function (response, ajaxData) {
                    try {
                        ajaxData.responseFinishedTime = Microsoft.ApplicationInsights.dateTime.Now();
                        ajaxData.CalculateMetrics();
                        if (ajaxData.ajaxTotalDuration < 0) {
                            Microsoft.ApplicationInsights._InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxDur, "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.", {
                                fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
                                requestSentTime: ajaxData.requestSentTime,
                                responseFinishedTime: ajaxData.responseFinishedTime
                            });
                        }
                        else {
                            var dependency = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(ajaxData.id, ajaxData.getAbsoluteUrl(), ajaxData.getPathName(), ajaxData.ajaxTotalDuration, response.status >= 200 && response.status < 400, response.status, ajaxData.method);
                            // enrich dependency target with correlation context from the server
                            var correlationContext = this.getCorrelationContext(response);
                            if (correlationContext) {
                                dependency.target = dependency.target + " | " + correlationContext;
                            }
                            this.appInsights.trackDependencyData(dependency);
                        }
                    }
                    catch (e) {
                        Microsoft.ApplicationInsights._InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.", {
                            fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
                            exception: Microsoft.ApplicationInsights.Util.dump(e)
                        });
                    }
                };
                FetchMonitor.prototype.onFetchFailed = function (input, ajaxData) {
                    try {
                        ajaxData.responseFinishedTime = Microsoft.ApplicationInsights.dateTime.Now();
                        ajaxData.CalculateMetrics();
                        if (ajaxData.ajaxTotalDuration < 0) {
                            Microsoft.ApplicationInsights._InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxDur, "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.", {
                                fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(input),
                                requestSentTime: ajaxData.requestSentTime,
                                responseFinishedTime: ajaxData.responseFinishedTime
                            });
                        }
                        else {
                            var dependency = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(ajaxData.id, ajaxData.getAbsoluteUrl(), ajaxData.getPathName(), ajaxData.ajaxTotalDuration, false, 0, ajaxData.method);
                            this.appInsights.trackDependencyData(dependency);
                        }
                    }
                    catch (e) {
                        Microsoft.ApplicationInsights._InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.", {
                            fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(input),
                            exception: Microsoft.ApplicationInsights.Util.dump(e)
                        });
                    }
                };
                FetchMonitor.prototype.getCorrelationContext = function (response) {
                    try {
                        var responseHeader = response.headers.get(Microsoft.ApplicationInsights.RequestHeaders.requestContextHeader);
                        return Microsoft.ApplicationInsights.CorrelationIdHelper.getCorrelationContext(responseHeader);
                    }
                    catch (e) {
                        Microsoft.ApplicationInsights._InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.", {
                            fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
                            exception: Microsoft.ApplicationInsights.Util.dump(e)
                        });
                        return null;
                    }
                };
                FetchMonitor.instrumentedByAppInsightsName = "InstrumentedByAppInsights";
                FetchMonitor.DisabledPropertyName = "Microsoft_ApplicationInsights_BypassFetchInstrumentation";
                return FetchMonitor;
            }());
        }
    };
});
//# sourceMappingURL=index.js.map