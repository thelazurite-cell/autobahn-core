const jquerySrc = '';
const jqueryUiSrc = 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.js';
let currentIframe = {};
let mutationObserver = {};

function createIframeContainerDialog(iSelector) {
    for (let i = 0; i < window.frames.length; i++) {
        if (finder(window.frames[i].frameElement) == iSelector) {
            currentIframe = window.frames[i];
            break;
        }
    }
    const divTag = document.createElement('div');
    divTag.setAttribute('align', 'center');
    divTag.setAttribute('id', 'generatorIframeDialog');
    divTag.style.fontFamily = 'sans-serif !important';
    divTag.style.fontSize = '12px !important';
    divTag.style.margin = '0px auto';
    divTag.style.padding = '5px';
    divTag.style.position = 'absolute';
    divTag.style.zIndex = '1111111111';
    divTag.style.minHeight = '30px'
    divTag.style.minWidth = '200px';

    divTag.style.width = '600px';
    divTag.style.height = '800px';

    divTag.style.top = '35%';
    divTag.style.left = '35%';
    divTag.style.background = '#eae7e2';
    divTag.style.border = '1px solid';
    divTag.style.boxShadow = '5px 10px #888888';
    divTag.className = 'generatorDialog';
    divTag.style.overflow = scroll;
    divTag.innerHTML = `
        <div style="display: block !important; background:white;width:100%;height:100%;">
            <div id="generatorIframeContainer" style="height: 100%;width: 100%;max-height:1000px;max-width:1000px;overflow:scroll;display: flow-root;">
            </div>
        </div>`;

    const titleBar = document.createElement('div');
    titleBar.setAttribute('id', 'generatorIframeTitleBar');
    titleBar.innerHTML = 'IFrame Preview';
    titleBar.style.padding = '0';
    titleBar.style.width = '100%';
    titleBar.style.color = 'white';
    titleBar.style.fontWeight = 'bold';
    titleBar.style.background = '#2e629d';
    titleBar.style.left = '0';
    titleBar.style.top = '0';
    titleBar.style.position = 'absolute';
    titleBar.style.borderBottom = '1px solid';
    divTag.appendChild(titleBar);
    document.body.appendChild(divTag);
    $('#generatorIframeDialog').resizable();
    $('#generatorIframeDialog').draggable();
    const iframeContainer = document.querySelector('#generatorIframeContainer');
    if (!currentIframe) {
        iframeContainer.innerHTML = '<p>The iframe doesn\'t exist</p>'
    } else {
        iframeContainer.innerHTML = currentIframe.document.body.innerHTML;
        mutationObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                console.log(mutation);
            });
            iframeContainer.innerHTML = currentIframe.document.body.innerHTML;
            attachUpdates();
        });

        mutationObserver.observe(currentIframe.document.documentElement, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
            attributeOldValue: true,
            characterDataOldValue: true
        });
        attachUpdates();
    }

    function attachUpdates() {
        $('#generatorIframeContainer > a, #generatorIframeContainer > button, #generatorIframeContainer > div').click((e) => {

            const help = finder(e.target).split('generatorIframeContainer');
            currentIframe.document.querySelector(help.length === 1 ? help[0] : help[1]).click();
        });
        $('#generatorIframeContainer input, #generatorIframeContainer textarea').on('change keydown paste input', (e) => {
            console.log(e);
            const help = finder(e.target).split('generatorIframeContainer');
            console.log(help);
            currentIframe.document.querySelector(help.length === 1 ? help[0] : help[1]).value = e.target.value;
        });

        currentIframe.document.onload = () => {
            iframeContainer.innerHTML = currentIframe.document.body.innerHTML;
        };
        currentIframe.document.onreadystatechange = () => {
            iframeContainer.innerHTML = currentIframe.document.body.innerHTML;
        };
    }
}

function createCurrentIframesWindow() {
    const divTag = document.createElement('div');
    divTag.setAttribute('align', 'center');
    divTag.setAttribute('id', 'generatorAllIframeDialog');
    divTag.style.fontFamily = 'sans-serif !important';
    divTag.style.fontSize = '12px !important';
    divTag.style.margin = '0px auto';
    divTag.style.padding = '5px';
    divTag.style.display = 'flex';
    divTag.style.flexDirection = 'column';
    divTag.style.position = 'absolute';
    divTag.style.zIndex = '1111111111';
    divTag.style.minHeight = '100px'
    divTag.style.minWidth = '200px';
    divTag.style.top = '0';
    divTag.style.left = '0';
    divTag.style.background = '#eae7e2';
    divTag.style.border = '1px solid';
    divTag.style.boxShadow = '5px 10px #888888';
    divTag.className = 'generatorDialog';
    divTag.innerHTML = `
    <div id="generatorAllIframeBody" style="flex-direction:column;margin-top:30px;font-size:12px!important;font-family:sans-serif;">
        <div id="generatorAllIframeToolbar">
            <button class="generatorBtn" id="generatorAllIframeRefresh">refresh</button>
        </div>
        <div id="generatorAllIframeRepeatableArea">
            <button class="generatorBtn">some item would be here</button>
        </div>
    </div>`;

    const titleBar = document.createElement('div');
    titleBar.setAttribute('id', 'generatorAllIframeTitleBar');
    titleBar.innerHTML = `
        <p style="width:100%; text-align: center; align-self: center; font-size:12px!important;font-family:sans-serif;">IFrame Selector</p>
        <button class="generatorBtn" style="font-size:12px!important;font-family:sans-serif;" id="generatorCurrentIframeToggle">Toggle</button>
    `;
    titleBar.style.padding = '0';
    titleBar.style.width = '100%';
    titleBar.style.height = '30px';
    titleBar.style.color = 'white';
    titleBar.style.fontWeight = 'bold';
    titleBar.style.background = '#2e629d';
    titleBar.style.display = 'flex';
    titleBar.style.left = '0';
    titleBar.style.top = '0';
    titleBar.style.position = 'absolute';
    titleBar.style.borderBottom = '1px solid';
    divTag.appendChild(titleBar);
    document.body.appendChild(divTag);
}

function findIframes() {
    const dialogBody = document.querySelector('#generatorAllIframeRepeatableArea');
    dialogBody.innerHTML = '';
    const iframes = window.frames;

    if (iframes.length === 0) {
        dialogBody.innerHTML = 'no IFrames found';
        return;
    }
    for (let i = 0; i < iframes.length; i++) {
        const iSelector = finder(iframes[i].frameElement);
        const btn = document.createElement('button');
        btn.innerHTML = iSelector;
        btn.setAttribute('class', 'generatorBtn')
        btn.onclick = () => {
            console.log(iSelector);

            if (!document.querySelector('#generatorIframeDialog'))
                createIframeContainerDialog(iSelector);
            else {
                const ele = document.getElementById('generatorIframeDialog');
                mutationObserver.disconnect();
                ele.remove();
                createIframeContainerDialog(iSelector);
            }
        }
        if (dialogBody)
            dialogBody.appendChild(btn);
    }
    $('.generatorBtn').button();
}

function loadScript(scriptSrc) {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.type = 'text/javascript';

    script.onload = function () {
        console.log(`loaded ${scriptSrc}`);
    };

    document.getElementsByTagName('head')[0].appendChild(script);
}
if (window === window.top) {
    document.addEventListener('DOMContentLoaded', (event) => {
        loadScript(jquerySrc);
        loadScript(jqueryUiSrc);
        createCurrentIframesWindow();
        const jqueryCheckInterval = setInterval(() => {
            if (typeof window.jQuery !== 'undefined') {

                const iframeDialog = $('#generatorAllIframeDialog')
                if (iframeDialog.draggable) {
                    // $('.generatorBtn').button();
                    iframeDialog.draggable();
                    iframeDialog.resizable();

                    function runEffect() {
                        var options = { direction: 'down' };
                        $("#generatorAllIframeBody").toggle('slide', options, 500);
                    };

                    // Set effect from select menu value
                    $("#generatorCurrentIframeToggle").on("click", function () {
                        runEffect();
                    });
                    $('#generatorAllIframeRefresh').on("click", () => {
                        findIframes();
                    });
                    findIframes();
                    clearInterval(jqueryCheckInterval);
                }
            }
        });

    });
    console.log('main window')
}