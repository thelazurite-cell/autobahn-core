/*
 * snoopy.js

 *
 * Listen to typical calls for debugging purposes and send them to the map service.
 */
(() => {

    /***
     * Client Enum: Log Levels
     * @type {{Info: string, Warning: string, Error: string, Debug: string}}
     */
    const logLevel = {
        Info: "Info",
        Warning: "Warning",
        Error: "Error",
        Debug: "Debug"
    };

    // preserve default console behaviour
    const _log = console.log;
    const _error = console.error;
    const _warning = console.warning;
    const _exception = console.exception;

    // preserve default XMLHttpRequest behaviour
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;
    const _setHeader = XMLHttpRequest.prototype.setRequestHeader;
    const _xhrConstructor = XMLHttpRequest.prototype.constructor;

    // additions to XHR prototype for test telemetry
    XMLHttpRequest.prototype.isTracked = true;
    XMLHttpRequest.prototype.trackedHeaders = [];
    XMLHttpRequest.prototype.trackedDetails = {};

    /***
     * send a log message to the test framework
     * @param message - the message
     * @param level - the log level
     */
    function postMessage(message, level, isAjaxStart = false, isAjaxEnd = false) {
        try {
            let xhr = new XMLHttpRequest();
            xhr.isTracked = false;
            xhr.open("POST", "http://localhost:31373/sendLogItem", true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                message,
                level,
                dateTime: new Date().toString(),
                external: true,
                isAjaxStart,
                isAjaxEnd
            }));
        } catch (e) {
            _error("Test Framework Failure: couldn't post logging message");
        }
    }

    /***
     * override the console.error function
     * @param errMessage - the associated error message
     */
    console.error = function (errMessage) {
        postMessage(errMessage, logLevel.Error);
        _error.apply(console, arguments);
    };

    /***
     * override the console.log message
     * @param logMessage - the associated log message
     */
    console.log = function (logMessage) {
        postMessage(logMessage, logLevel.Debug);
        _log.apply(console, arguments);
    };

    /***
     * override the console.warning function
     * @param warnMessage - the associated warning message
     */
    console.warning = function (warnMessage) {
        postMessage(warnMessage, logLevel.Warning);
        _warning.apply(console, arguments);
    };

    /***
     * override the console.exception function
     * @param exceptionMessage - the associated exception message
     */
    console.exception = function (exceptionMessage) {
        postMessage(exceptionMessage, logLevel.Error);
        _exception.apply(console, arguments)
    };

    /***
     * two digit format - ensure a value has two digits;
     * @param n
     * @returns {string}
     */
    function tdf(n) {
        return n > 9 ? "" + n : "0" + n;
    }

    function xhrSuper() {
        let self = new _xhrConstructor();
        self.prototype = Object.create(_xhrProto);
        return self;
    }


    XMLHttpRequest.prototype.open = function (requestType, requestUrl, async, username, password) {
        let self = this;
        self.trackedHeaders = [];
        self.trackedDetails = {};
        if (self.isTracked) {
            self.trackedDetails = { requestType, requestUrl, async, username, password }
        }

        if (async != null) {
            _open.call(this, requestType, requestUrl, async, username, password);
        } else {
            console.warn("bad practise: synchronous call to XMLHttpRequest. Calls using be async.");
            _open.call(this, requestType, requestUrl);
        }
    };

    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
        if (this.isTracked) {
            this.trackedHeaders.push({ name, value });
        }
        _setHeader.call(this, name, value);
    };

    XMLHttpRequest.prototype.send = function (body) {
        const self = this;
        if (self.isTracked) {

            postMessage(`Sending a ${self.trackedDetails.requestType} Request to ${self.trackedDetails.requestUrl}`, logLevel.Info, true);
            postMessage("Request Details: " + JSON.stringify(self.trackedDetails), logLevel.Debug);
            postMessage("Headers: " + JSON.stringify(self.trackedHeaders), logLevel.Debug);
            postMessage("Body: " + body, logLevel.Debug);
            self.trackedHeaders = [];

            const changed = self.onreadystatechange;
            const startTime = new Date();

            function onReadyStateChange() {
                try {
                    if (!self) return;
                    if (!self.readyState) return;
                    if (self.readyState === XMLHttpRequest.DONE) {
                        const endTime = new Date();
                        const diff = endTime - startTime;

                        let msMod = 1000;
                        let minSecMod = 60;
                        const h = Math.floor(diff / (msMod * minSecMod * minSecMod));
                        const m = Math.floor((diff % (msMod * minSecMod * minSecMod)) / (msMod * minSecMod));
                        const s = Math.floor(((diff % (msMod * minSecMod * minSecMod)) % (msMod * minSecMod)) / msMod);
                        const ms = Math.floor(((diff % (msMod * minSecMod * minSecMod)) % (msMod * minSecMod)) % msMod);

                        postMessage(`response from ${self.responseURL} took ${tdf(h)}:${tdf(m)}:${tdf(s)}.${ms}`, logLevel.Info, false, true);
                        if (self.status === 200) {
                            postMessage(`Request to ${self.responseURL} was successful`, logLevel.Info);
                        } else {
                            postMessage(`Request to ${self.responseURL} was unsuccessful`, logLevel.Error);
                        }
                        postMessage(self.responseText, logLevel.Debug);
                    }
                    if (changed) {
                        changed();
                    }
                } catch {

                }
            }

            this.addEventListener("readystatechange", onReadyStateChange, false);
        }
        _send.call(this, body);
    };
    const _xhrProto = XMLHttpRequest.prototype;


    /***
     * any time an unhandled error occurs, trigger an event to capture this in the test log
     * the final parameter 'useCapture' allows us to know if elements failed to load on page
     * e.g. an image.
     */
    window.addEventListener("error", function (e) {
        postMessage("Unhandled exception thrown on client browser", logLevel.Error);
        postMessage(JSON.stringify(e), logLevel.Error);
        return false;
    }, true);

    window.addEventListener('unhandledrejection', function (e) {
        postMessage("Unhandled promise rejection on client browser", logLevel.Error);
        postMessage(JSON.stringify(e), logLevel.Error);
    }, true);
})();
