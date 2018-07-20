import "./app-insights-sdk";

class FetchMonitor {
	private appInsights: Microsoft.ApplicationInsights.IAppInsights;
	private initialized: boolean;
	private static instrumentedByAppInsightsName = "InstrumentedByAppInsights";
	private currentWindowHost;

	constructor(appInsights: Microsoft.ApplicationInsights.IAppInsights) {
		this.currentWindowHost = window.location.host && window.location.host.toLowerCase();
		this.appInsights = appInsights;
		this.initialized = false;
		this.Init();
	}

	private Init(): void {
		if (this.supportsMonitoring()) {
			this.instrumentFetch();
			this.initialized = true;
		}
	}

	static DisabledPropertyName: string = "Microsoft_ApplicationInsights_BypassFetchInstrumentation";

	private supportsMonitoring(): boolean {
		let result: boolean = true;
		if (Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(Request) ||
			Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(Request.prototype) ||
			Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(fetch)) {
			result = false;
		}
		return result;
	}

	private instrumentFetch(): void {
		let originalFetch: (input?: Request | string, init?: RequestInit) => Promise<Response> = window.fetch;
		let fetchMonitorInstance: FetchMonitor = this;
		window.fetch = function fetch(input?: Request | string, init?: RequestInit): Promise<Response> {
			// this format corresponds with activity logic on server-side and is required for the correct correlation
			let id: string = `|${fetchMonitorInstance.appInsights.context.operation.id}.${Microsoft.ApplicationInsights.Util.newId()}`;
			let ajaxData: Microsoft.ApplicationInsights.ajaxRecord;
			try {
				ajaxData = new Microsoft.ApplicationInsights.ajaxRecord(id);
				ajaxData.requestSentTime = Microsoft.ApplicationInsights.dateTime.Now();
				if (typeof (input) === "string") {
					ajaxData.requestUrl = input;
				} else {
					ajaxData.requestUrl = input.url;
				}
				if (init && init.method) {
					ajaxData.method = init.method;
				} else if (typeof (input) !== "string") {
					ajaxData.method = input.method;
				} else {
					ajaxData.method = "GET";
				}
			} catch (e) {
				Microsoft.ApplicationInsights._InternalLogging.throwInternal(
					Microsoft.ApplicationInsights.LoggingSeverity.CRITICAL,
					Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxOpen,
					"Failed to monitor Window.fetch, monitoring data for this fetch call may be incorrect.",
					{
						ajaxDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(input),
						exception: Microsoft.ApplicationInsights.Util.dump(e)
					});
			}
			return originalFetch(input, init).then(response => {
				fetchMonitorInstance.onFetchComplete(response, ajaxData);
				return response;
			});
		};
	}

	private static getFailedFetchDiagnosticsMessage(input: Request | Response | string): string {
		let result: string = "";
		try {
			if (!Microsoft.ApplicationInsights.extensions.IsNullOrUndefined(input)) {
				if (typeof (input) === "string") {
					result += `(url: '${input}')`;
				} else {
					result += `(url: '${input.url}')`;
				}
			}
			// tslint:disable-next-line:no-empty
		} catch (e) { }

		return result;
	}

	private onFetchComplete(response: Response, ajaxData: Microsoft.ApplicationInsights.ajaxRecord): void {
		try {
			ajaxData.responseFinishedTime = Microsoft.ApplicationInsights.dateTime.Now();
			ajaxData.CalculateMetrics();

			if (ajaxData.ajaxTotalDuration < 0) {
				Microsoft.ApplicationInsights._InternalLogging.throwInternal(
					Microsoft.ApplicationInsights.LoggingSeverity.WARNING,
					Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxDur,
					"Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.",
					{
						fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
						requestSentTime: ajaxData.requestSentTime,
						responseFinishedTime: ajaxData.responseFinishedTime
					});
			} else {
				let dependency: Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData = new Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData(
					ajaxData.id,
					ajaxData.getAbsoluteUrl(),
					ajaxData.getPathName(),
					ajaxData.ajaxTotalDuration,
					response.status >= 200 && response.status < 400,
					response.status,
					ajaxData.method);

				// enrich dependency target with correlation context from the server
				let correlationContext: string = this.getCorrelationContext(response);
				if (correlationContext) {
					dependency.target = dependency.target + " | " + correlationContext;
				}

				this.appInsights.trackDependencyData(dependency);
			}
		} catch (e) {
			Microsoft.ApplicationInsights._InternalLogging.throwInternal(
				Microsoft.ApplicationInsights.LoggingSeverity.WARNING,
				Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
				"Failed to calculate the duration of the fetch call, monitoring data for this fetch call won't be sent.",
				{
					fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
					exception: Microsoft.ApplicationInsights.Util.dump(e)
				});
		}
	}

	private getCorrelationContext(response: Response): string {
		try {
			let responseHeader: string = response.headers.get(Microsoft.ApplicationInsights.RequestHeaders.requestContextHeader);
			return Microsoft.ApplicationInsights.CorrelationIdHelper.getCorrelationContext(responseHeader);
		} catch (e) {
			Microsoft.ApplicationInsights._InternalLogging.throwInternal(
				Microsoft.ApplicationInsights.LoggingSeverity.WARNING,
				Microsoft.ApplicationInsights._InternalMessageId.FailedMonitorAjaxGetCorrelationHeader,
				"Failed to get Request-Context correlation header as it may be not included in the response or not accessible.",
				{
					fetchDiagnosticsMessage: FetchMonitor.getFailedFetchDiagnosticsMessage(response),
					exception: Microsoft.ApplicationInsights.Util.dump(e)
				});
			return null;
		}
	}
}

let fetchMonitor: FetchMonitor;

export async function initAppInsightsFetchMonitor() {
	// tslint:disable-next-line:no-string-literal
	while (!window["Microsoft"] || !window["Microsoft"]["ApplicationInsights"]) {
		await new Promise(r => setTimeout(() => r(), 100));
	}
	if (!appInsights.config.disableAjaxTracking) {
		fetchMonitor = new FetchMonitor(appInsights);
	}
}
