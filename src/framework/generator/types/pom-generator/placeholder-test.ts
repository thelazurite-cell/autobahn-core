import { ClientFunction, Selector } from 'testcafe';
import { Configuration } from '../../../configuration/configuration';
import { Locator } from '../../../driver/locators/locator';
import { LocatorType } from '../../../driver/locators/locator-type';
import { PageObjectModel } from '../../../driver/page-object-model';
import { ConsoleColor } from '../../../helpers/console-color.enum';
import { camelize } from '../../../helpers/string-helpers';
import { GeneratePageObjects, PageObjectMetadata } from '../GeneratePageObjects';

fixture(`Generate a page object model`);

test('Generate a POM', async t => {
    console.log(`${ConsoleColor.FgCyan}
    Unlock the page and Navigate testcafe to
    the correct page location.
    once ready press 'resume'`);

    await t.navigateTo(`${Configuration.application.ssl ? 'https://' : 'http://'}${Configuration.application.testHost}`).debug();

    await discoverPageObjects(t);

    if (GeneratePageObjects.genericNameCounter > 0) {
        const update = await confirmUpdate(t);
        console.log(update);
        const elements: PageObjectMetadata[] = GeneratePageObjects.objectsNeedGenerating.filter(itm => itm.hasGenericName);

        if (update) {
            for (const item of elements) {
                await generateBrowserTask(item, t, async () => {
                    await setActiveItemUi(item);
                });

                await createPropNameInput(item, t, item.iframeSelector.length > 0);

                await generateBrowserTask(item, t, async () => {
                    await reseItemtUi(item);
                });
            }
        }
    }
});


async function generateBrowserTask(item: PageObjectMetadata, t: TestController, code: () => Promise<void>) {
    if (item.iframeSelector.length === 0) {
        await code();
    } else {
        const iframe = new Locator(item.iframeSelector, LocatorType.Css);
        // if (await iframe.get(t).visible) {
        await new PageObjectModel().withinIframe(t, iframe, async () => {
            await code();
        });
        // } else {
        //     console.log(`${ConsoleColor.FgMagenta} The iframe '${item.cssSelector}' is not visible, so items cannot be generated for it${ConsoleColor.Reset}`);
        // }
    }
}

async function discoverPageObjects(t: TestController, iframeSelector: string = '') {

    for (const type of GeneratePageObjects.typesToFind) {
        if (GeneratePageObjects.iframeOnly && iframeSelector.length === 0 && type.toLowerCase() !== 'iframe')
            continue;

        const result: PageObjectMetadata[] = await getPageElements(type, iframeSelector);

        if (type.toLowerCase() === 'iframe') {
            for (const item of result) {
                const iframe = new Locator(item.cssSelector, LocatorType.Css);
                if (await iframe.get(t).visible) {
                    await new PageObjectModel().withinIframe(t, iframe, async () => {
                        await discoverPageObjects(t, item.cssSelector);
                    });
                } else {
                    console.log(`${ConsoleColor.FgMagenta} The iframe '${item.cssSelector}' is not visible, so items cannot be generated for it${ConsoleColor.Reset}`);
                }
            }
        }

        setSuggestedNames(result);
    }
}

async function getPageElements(type: string, iframe: string): Promise<PageObjectMetadata[]> {
    return await ClientFunction((elementType, iframeSelector) => {
        const alwaysIgnore = ['generatorIframeDialog', 'generatorAllIframeDialog'];
        const foundElements = document.getElementsByTagName(elementType);
        const elementMetas = [];
        // this is code that gets sent to the browser window, so no fancy stuff here!
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < foundElements.length; i++) {
            try {
                const element = foundElements[i];
                const cssSelector = finder(element);

                if (alwaysIgnore.some(itm => cssSelector.includes(itm))) {
                    continue;
                }

                const id = element.getAttribute('id');
                const name = element.getAttribute('name');
                const textContent = element.textContent || element.getAttribute('value');
                const placeholder = element.getAttribute('placeholder');
                const elementType = element.nodeName;
                const type = element.getAttribute('type');
                const classes = element.getAttribute('class');

                element.style.backgroundColor = 'cyan';
                element.style.border = '2px solid red';

                if (!cssSelector.toString().includes('\\')) {
                    elementMetas.push({
                        elementType,
                        id,
                        cssSelector,
                        name,
                        textContent,
                        placeholder,
                        type,
                        classes,
                        suggestedPropName: '',
                        hasGenericName: false,
                        shouldGenerate: false,
                        isIframe: elementType.toLowerCase() === 'iframe',
                        iframeSelector
                    });
                }
            } catch (e) {
                console.log(e);
            }
        }

        return elementMetas;
    })(type, iframe);
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars -- needed
async function loadScript(script: string) {
    await ClientFunction((scriptSrc) => {

        const script = document.createElement('script');
        script.src = scriptSrc;
        script.type = 'text/javascript';

        script.onload = function () {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- client side call
            console.log(`loaded ${scriptSrc}`);
        };

        document.getElementsByTagName('head')[0].appendChild(script);
    })(script);
}

async function setActiveItemUi(item: PageObjectMetadata) {
    try {
        await ClientFunction((cssSelector) => {
            try {
                const ele = document.querySelectorAll(cssSelector)[0];
                if (ele) {
                    ele.setAttribute('style', '');
                    ele.setAttribute('style', 'background: lightgreen !important');
                    ele.style.color = 'black';
                    ele.style.fontWeight = 'bold';
                }
            } catch (e) {
                console.log('Couldn\'t find the element');
            }
        })(item.cssSelector);
    } catch (e) {
        console.log('ignore this error');
    }
}

async function reseItemtUi(item: PageObjectMetadata) {
    try {
        await ClientFunction((cssSelector) => {
            try {
                const ele = document.querySelectorAll(cssSelector)[0];
                ele.setAttribute('style', '');
                ele.style.backgroundColor = 'cyan';
                ele.style.border = '2px solid red';
            } catch (e) {
                console.log('ignore');
            }
        })(item.cssSelector);
    } catch (e) {
        console.log('ignore this error');
    }
}

async function createPropNameInput(item: PageObjectMetadata, t: TestController, inIframe: boolean) {
    let visibilityText: string;

    if (!inIframe) {
        let isVisible = true;
        try {
            // Selector(item.cssSelector).visible.then(
            //     (visible) => isVisible = visible
            // ).catch(
            //     () => isVisible = false
            // ); this could indeed take half a day

            visibilityText = isVisible ? '' : ' (item currently not visible)';
        } catch (e) {
            isVisible = false;
        }
        // console.log(`${item.cssSelector.toString()} ${visibilityText}`);
    } else {
        visibilityText = '(In IFrame)';
    }

    const nameDialog = 'nameInput';

    await createDialog(item.cssSelector, {
        title: 'Enter Property Name',
        message: `Enter a property name for '${item.cssSelector}' ${visibilityText}`,
        name: nameDialog,
        type: 'input',
        behavior: async () => {
            console.log(`${ConsoleColor.FgCyan}
            Unlock the page and once you have entered a value, press 'resume'`);

            let valid = false;

            while (!valid) {
                await t.debug();

                const value = camelize(await Selector(`#${nameDialog}`).value, false);
                if (GeneratePageObjects.objectsNeedGenerating.some(itm => itm.suggestedPropName.toLowerCase() === value.toLowerCase())) {
                    await showError('property name is already in use by another object');
                    continue;
                } else if (value.length === 0) {
                    await showError('no name provided');
                    continue;
                }

                item.suggestedPropName = value;
                console.log(item.suggestedPropName);
                valid = true;
            }
        }
    });
}

async function createDialog(parent: string, options: { title: string, message: string, name: string, type: 'input' | 'prompt', values?: string[], behavior: () => Promise<void> }) {
    await ClientFunction((cssSelector, options) => {

        const divTag = document.createElement('div');
        divTag.setAttribute('align', 'center');
        divTag.setAttribute('id', 'generatorDialog');
        divTag.style.margin = '0px auto';
        divTag.style.padding = '5px';
        divTag.style.position = 'absolute';
        divTag.style.zIndex = '1111111111';
        divTag.style.top = '0';
        divTag.style.left = '35%';
        divTag.style.background = '#eae7e2';
        divTag.style.border = '1px solid';
        divTag.style.boxShadow = '5px 10px #888888';
        divTag.className = 'generatorDialog';
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- client side call 
        divTag.innerHTML = `<p>${options.message}<br/></p>`;

        const titleBar = document.createElement('div');
        titleBar.setAttribute('id', 'generatorTitleBar');
        titleBar.innerHTML = options.title;
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

        const extraInfo = document.createElement('div');
        extraInfo.setAttribute('id', 'generatorExtraInfo');
        divTag.appendChild(extraInfo);

        if (options.type === 'input') {
            console.log(options);
            const input = document.createElement('input');
            input.setAttribute('id', options.name);
            input.style.width = '85%';
            input.setAttribute('placeholder', 'enter new name here');
            divTag.appendChild(input);
        }

        if (options.type === 'prompt') {
            const inputPos = document.createElement('input');
            inputPos.setAttribute('name', options.name);
            inputPos.setAttribute('type', 'radio');
            inputPos.setAttribute('id', 'yes');
            inputPos.setAttribute('value', 'yes');
            const labelPos = document.createElement('label');
            labelPos.setAttribute('for', 'yes');
            labelPos.innerHTML = 'Yes';
            labelPos.style.padding = '5px';

            const inputNeg = document.createElement('input');
            inputNeg.setAttribute('name', options.name);
            inputNeg.setAttribute('type', 'radio');
            inputNeg.setAttribute('id', 'no');
            inputNeg.setAttribute('value', 'no');
            const labelNeg = document.createElement('label');
            labelNeg.setAttribute('for', 'no');
            labelNeg.innerHTML = 'No';
            labelNeg.style.padding = '5px';

            divTag.appendChild(inputPos);
            divTag.appendChild(labelPos);
            divTag.appendChild(inputNeg);
            divTag.appendChild(labelNeg);
        }


        document.body.appendChild(divTag);

        const jqueryCheckInterval = setInterval(() => {
            if (typeof window.jQuery !== 'undefined') {

                const dialog = $('#generatorDialog');
                if (dialog.draggable) {
                    clearInterval(jqueryCheckInterval);
                    if (options.type === 'input') {
                        document.getElementById(options.name).focus();
                    }

                    const off = $(cssSelector).offset() || { top: dialog.height() * 2, left: '35%' };
                    // do something with jQuery here
                    dialog.draggable();
                    dialog.resizable();
                    let top = off.top - dialog.height() - 10;
                    top = top < 0 ? +off.top + (+dialog.height()) + 10 : top;
                    const left = off.left;
                    dialog.css({ top: top < 0 ? 0 : top, left: left < 0 ? 0 : left });
                }
            }
        }, 10);

    })(parent, options);

    await options.behavior();

    await ClientFunction(() => {
        const dialog = document.getElementById('generatorDialog');
        dialog.remove();
    })();
}

async function showError(error: string) {
    await ClientFunction((errorMessage) => {
        const errorMessageId = 'generateError';
        const existingError = document.getElementById(errorMessageId);
        if (existingError) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- client side call
            existingError.innerHTML = `<p>${errorMessage}</p>`;
        } else {
            const divTag = document.createElement('div');
            divTag.setAttribute('id', errorMessageId);
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- client side call
            divTag.innerHTML = `<p>${errorMessage}</p>`;
            divTag.style.color = 'red';
            divTag.style.fontWeight = 'bold';
            const dialog = document.getElementById('generatorDialog');
            dialog.appendChild(divTag);
        }
    })(error);
}

async function confirmUpdate(t): Promise<boolean> {
    let bool = true;
    await createDialog('body', {
        title: 'Confirm',
        message: 'Some suggested names are generic. Would you like to rename them?',
        name: 'toggle',
        type: 'prompt',
        behavior: async () => {
            console.log(`${ConsoleColor.FgCyan}
            Unlock the page and once you have entered a value, press 'resume'`);

            await ClientFunction((genericObjects) => {
                const ele = document.getElementById('generatorExtraInfo');
                ele.style.width = '100%';
                ele.style.height = '250px';
                ele.style.overflowY = 'scroll';
                const table = document.createElement('table');
                const trHead = document.createElement('tr');
                const thSelector = document.createElement('th');
                thSelector.innerHTML = 'Selector';
                const thPropName = document.createElement('th');
                thPropName.innerHTML = 'Prop name';
                trHead.appendChild(thSelector);
                trHead.appendChild(thPropName);
                table.appendChild(trHead);

                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let i = 0; i < genericObjects.length; i++) {
                    const current = genericObjects[i];

                    const selector = current.cssSelector;
                    const propName = current.suggestedPropName;

                    const trData = document.createElement('tr');
                    const tdSelector = document.createElement('td');
                    tdSelector.innerHTML = selector;
                    tdSelector.style.padding = '5px';
                    const tdPropName = document.createElement('td');
                    tdPropName.innerHTML = propName;
                    tdPropName.style.padding = '5px';

                    if (i % 2) {
                        tdSelector.style.background = 'lightgrey';
                        tdPropName.style.background = 'lightgrey';
                    }

                    trData.appendChild(tdSelector);
                    trData.appendChild(tdPropName);
                    table.appendChild(trData);
                }

                ele.appendChild(table);
            })(GeneratePageObjects.objectsNeedGenerating.filter(itm => itm.hasGenericName));

            let valid = false;

            while (!valid) {
                await t.debug();

                const selector = Selector('input').withAttribute('name', 'toggle').withAttribute('type', 'radio');
                const count = await selector.count;

                let anySelected = false;
                for (let i = 0; i < count; i++) {
                    const current = selector.nth(i);
                    if (await current.checked) {
                        anySelected = true;
                        bool = (await current.value) === 'yes';
                    }
                }

                if (!anySelected) {
                    await showError('You must select a value!');
                }
                else {
                    valid = true;
                }
            }
        }
    });

    return Promise.resolve(bool);
}

function setSuggestedNames(result: PageObjectMetadata[]) {
    for (const element of result) {
        if (element.id) {
            element.suggestedPropName = element.id;
        } else if (element.name) {
            element.suggestedPropName = element.name;
        } else if (element.placeholder) {
            const noType = element.type === null || element.type === undefined;
            element.suggestedPropName = `${element.elementType}${noType ? GeneratePageObjects.genericNameCounter.toString() : element.type}element.placeholder}`;
            if (noType) {
                element.hasGenericName = true;
                GeneratePageObjects.genericNameCounter++;
            }
        } else if (element.classes) {
            const noType = element.type === null || element.type === undefined;
            element.suggestedPropName = `${element.elementType}${noType ? GeneratePageObjects.genericNameCounter.toString() : element.type}${element.classes}`;
            if (noType) {
                element.hasGenericName = true;
                GeneratePageObjects.genericNameCounter++;
            }
        } else {
            element.suggestedPropName = `p${GeneratePageObjects.genericNameCounter.toString()}`;
            element.hasGenericName = true;
            GeneratePageObjects.genericNameCounter++;
        }

        element.suggestedPropName = camelize(element.suggestedPropName, false).replace(/[^a-zA-Z0-9]/g, ''); // Replace all symbols to prevent dodgy errors. 
        GeneratePageObjects.objectsNeedGenerating.push(element);
    }
}

/**
 * Note: these functions do not serve any purpose other than to shut up the typescript compiler.
 * The generator class instantiates the testcafe runner, which pulls in a custom javscript file
 * which contains the 'finder' function. As we are compiling TS, the compiler will winge that we are 
 * attempting to call an unknown function which is totally reasonable as it doesn't know or care about
 * how it's being resolved at runtime
 * @param a 
 * @param b 
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- see the above comment
function finder(a, b?): string {
    throw new Error('Function not implemented.');
}

const $: any = {};
const window: any = {};
