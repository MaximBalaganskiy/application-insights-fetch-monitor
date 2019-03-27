var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import "./app-insights-sdk";
class FetchMonitor {
    constructor(appInsights) {
        this.currentWindowHost = window.location.host && window.location.host.toLowerCase();
        this.appInsights = appInsights;
        this.initialized = false;
        this.Init();
    }
    Init() {
        if (this.supportsMonitoring()) {
            this.instrumentFetch();
            this.initialized = true;
        }
    }
    supportsMonitoring() {
        let result = true;
        if (Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(Request) ||
            Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(Request.prototype) ||
            Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(fetch)) {
            result = false;
        }
        return result;
    }
    instrumentFetch() {
        let originalFetch = window.fetch;
        let fetchMonitorInstance = this;
        window.fetch = function fetch(input, init) {
            // this format corresponds with activity logic on server-side and is required for the correct correlation
            let ajaxData;
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
                .then(response => {
                fetchMonitorInstance.onFetchComplete(response, ajaxData);
                return response;
            })
                .catch(reason => {
                fetchMonitorInstance.onFetchFailed(input, ajaxData, reason);
                throw reason;
            });
        };
    }
    createAjaxRecord(input, init) {
        // this format corresponds with activity logic on server-side and is required for the correct correlation
        let id = `|${this.appInsights.context.operation.id}.${Microsoft.ApplicationInsights.Util.newId()}`;
        let ajaxData = new Microsoft.ApplicationInsights.ajaxRecord(id);
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
    }
    includeCorrelationHeaders(ajaxData, input, init) {
        if (Microsoft.ApplicationInsights.CorrelationIdHelper.canIncludeCorrelationHeader(this.appInsights.config, ajaxData.getAbsoluteUrl(), this.currentWindowHost)) {
            if (!init) {
                init = {};
            }
            // init headers override original request headers
            // so, if they exist use only them, otherwise use request's because they should have been applied in the first place
            // not using original request headers will result in them being lost
            init.headers = new Headers(init.headers || (input instanceof Request ? (input.headers || {}) : {}));
            init.headers.set(Microsoft.ApplicationInsights.RequestHeaders.requestIdHeader, ajaxData.id);
            let appId = this.appInsights.context ? this.appInsights.context.appId() : null;
            if (appId) {
                init.headers.set(Microsoft.ApplicationInsights.RequestHeaders.requestContextHeader, Microsoft.ApplicationInsights.RequestHeaders.requestContextAppIdFormat + appId);
            }
        }
        return init;
    }
    static getFailedFetchDiagnosticsMessage(input) {
        let result = "";
        try {
            if (!Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(input)) {
                if (typeof (input) === "string") {
                    result += `(url: '${input}')`;
                }
                else {
                    result += `(url: '${input.url}')`;
                }
            }
            // tslint:disable-next-line:no-empty
        }
        catch (e) { }
        return result;
    }
    onFetchComplete(response, ajaxData) {
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
                let dependency = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(ajaxData.id, ajaxData.getAbsoluteUrl(), ajaxData.getPathName(), ajaxData.ajaxTotalDuration, response.status >= 200 && response.status < 400, response.status, ajaxData.method);
                // enrich dependency target with correlation context from the server
                let correlationContext = this.getCorrelationContext(response);
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
    }
    onFetchFailed(input, ajaxData, reason) {
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
                let dependency = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(ajaxData.id, ajaxData.getAbsoluteUrl(), ajaxData.getPathName(), ajaxData.ajaxTotalDuration, false, 0, ajaxData.method);
                dependency.properties = { error: reason.message };
                this.appInsights.trackDependencyData(dependency);
            }
        }
        catch (e) {
            Microsoft.ApplicationInsights._InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to calculate the duration of the failed fetch call, monitoring data for this fetch call won't be sent.", {
                fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(input),
                exception: Microsoft.ApplicationInsights.Util.dump(e)
            });
        }
    }
    getCorrelationContext(response) {
        try {
            let responseHeader = response.headers.get(Microsoft.ApplicationInsights.RequestHeaders.requestContextHeader);
            return Microsoft.ApplicationInsights.CorrelationIdHelper.getCorrelationContext(responseHeader);
        }
        catch (e) {
            Microsoft.ApplicationInsights._InternalLogging.throwInternal(Microsoft.ApplicationInsights.LoggingSeverity.WARNING, Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxGetCorrelationHeader, "Failed to get Request-Context correlation header as it may be not included in the response or not accessible.", {
                fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
                exception: Microsoft.ApplicationInsights.Util.dump(e)
            });
            return null;
        }
    }
}
FetchMonitor.instrumentedByAppInsightsName = "InstrumentedByAppInsights";
FetchMonitor.DisabledPropertyName = "Microsoft_ApplicationInsights_BypassFetchInstrumentation";
let fetchMonitor;
export function initAppInsightsFetchMonitor() {
    return __awaiter(this, void 0, void 0, function* () {
        // tslint:disable-next-line:no-string-literal
        while (!window["Microsoft"] || !window["Microsoft"]["ApplicationInsights"]) {
            yield new Promise(r => setTimeout(() => r(), 100));
        }
        if (!appInsights.config.disableAjaxTracking) {
            fetchMonitor = new FetchMonitor(appInsights);
        }
    });
}
//# sourceMappingURL=index.js.map