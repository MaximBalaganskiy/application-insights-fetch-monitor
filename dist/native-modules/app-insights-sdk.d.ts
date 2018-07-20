declare namespace Microsoft.ApplicationInsights {
    interface ITelemetryContext {
        appId(): string;
    }
    class Util {
        static newId(): string;
        static dump(object: any): string;
    }
    class ajaxRecord {
        constructor(id: string);
        id: string;
        method: string;
        requestUrl: string;
        requestSentTime: number;
        responseFinishedTime: number;
        status: number;
        ajaxTotalDuration: number;
        CalculateMetrics(): any;
        getAbsoluteUrl(): string;
        getPathName(): string;
    }
    class dateTime {
        static Now(): number;
    }
    class RequestHeaders {
        static requestIdHeader: string;
        static requestContextHeader: string;
        static requestContextAppIdFormat: string;
    }
    class extensions {
        static IsNullOrUndefined(obj: any): any;
    }
    enum LoggingSeverity {
        CRITICAL = 0,
        WARNING = 1
    }
    enum _InternalMessageId {
        FailedMonitorAjaxDur = 14,
        FailedMonitorAjaxOpen = 15,
        FailedMonitorAjaxGetCorrelationHeader = 18
    }
    class _InternalLogging {
        static throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: object, isUserAct?: boolean): any;
    }
    class CorrelationIdHelper {
        static getCorrelationContext(responseHeader: string): string;
    }
    interface IAppInsights {
        trackDependencyData(dependency: Telemetry.RemoteDependencyData): any;
    }
}
declare namespace Microsoft.ApplicationInsights.Telemetry {
    interface RemoteDependencyData {
        target: string;
    }
}
