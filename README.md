# WARNING! DEPRECATED!
Please upgrade to [ApplicationInsights-JS](https://github.com/microsoft/ApplicationInsights-JS)@^2.0.0.
It now has Fetch instrumentation which is based on the code of this package.

# application-insights-fetch-monitor
Fetch API monitor for Application Insights

The monitor is based on official [Ajax Monitor](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/JavaScript/JavaScriptSDK/ajax/ajax.ts) and mostly replicates what was done there for `fetch` function.
## Installation

```
npm i --save applicationinsights-js @types/applicationinsights-js application-insights-fetch-monitor
```
## Usage

```js
import { initAppInsightsFetchMonitor } from "application-insights-fetch-monitor";

appInsights.downloadAndSetup({ instrumentationKey: "[YOUR INSTRUMENTATION KEY]" });
initAppInsightsFetchMonitor();
```
