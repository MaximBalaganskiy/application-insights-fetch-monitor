// tslint:disable:no-namespace
// tslint:disable:class-name
// tslint:disable:max-classes-per-file
// tslint:disable:interface-name
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
		CalculateMetrics();
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
		static IsNullOrUndefined(obj);
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
		static throwInternal(severity: LoggingSeverity, msgId: _InternalMessageId, msg: string, properties?: object, isUserAct?: boolean);
	}

	class CorrelationIdHelper {
		static getCorrelationContext(responseHeader: string): string;
		static canIncludeCorrelationHeader(config: IConfig, requestUrl: string, currentHost: string);
	}

	interface IAppInsights {
		trackDependencyData(dependency: Telemetry.RemoteDependencyData);
	}
}

declare namespace Microsoft.ApplicationInsights.Telemetry {
	interface RemoteDependencyData {
		target: string;
	}
}
