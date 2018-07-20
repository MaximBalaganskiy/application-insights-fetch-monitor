# application-insights-fetch-monitor
Fetch API monitor for Application Insights

The monitor is based on official [Ajax Monitor](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/JavaScript/JavaScriptSDK/ajax/ajax.ts) and mostly replicates what was done there for `fetch` function.
## Installation

```
npm i --save-dev applicationinsights-js @types/applicationinsights-js application-insights-fetch-monitor
```
## Usage

```js
import { initAppInsightsFetchMonitor } from "application-insights-fetch-monitor";

appInsights.downloadAndSetup({ instrumentationKey: "[YOUR INSTRUMENTATION KEY]" });
initAppInsightsFetchMonitor();
```
