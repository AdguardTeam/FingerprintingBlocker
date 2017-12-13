const SupportedLocales = "RESOURCE:TRANSLATIONS";

const defaultLocale = 'en';
let currentLocale = null;
if (typeof AdguardSettings !== 'undefined') {
    var locale = AdguardSettings.locale;
    if (SupportedLocales[locale]) {
        currentLocale = locale;
    }
}
if (!currentLocale || !SupportedLocales[currentLocale]) {
    let lang = navigator.language;
    if (!SupportedLocales[lang]) {
        let i = lang.indexOf('-');
        if (i !== -1) {
            lang = lang.slice(0, i);
        }
    }
    currentLocale = lang;
}
if (!currentLocale || !SupportedLocales[currentLocale]) {
    currentLocale = defaultLocale;
}

export const getMessage = (messageId:string):string => {
    let message = SupportedLocales[currentLocale][messageId];
    if (!message) {
        message = SupportedLocales[defaultLocale][messageId];
    }
    return message;
};

const entityMap = {
    '&': 'amp;',
    '<': 'lt;',
    '>': 'gt;',
    '"': 'quot;',
    "'": '#39;',
    '/': '#x2F;',
    '`': '#x60;',
    '=': '#x3D;'
  };

function toHtmlSafeString(str:string):string {
    return str.replace(/[&<>"'`=\/]/g, (s) => ('&' + entityMap[s]));
}
  
/**
 * @param htmlSafe indicates that strings that are to be replaced with should be escaped
 * so that they can used as a value of `innerHTML` without allowing remote code execution
 * or breaking html structure.
 */
export function formatText(message:string, context:stringmap<string>, htmlSafe?:boolean):string {
    for (let contextId in context) {
        let toBeReplacedWith = context[contextId];
        if (htmlSafe) {
            toBeReplacedWith = toHtmlSafeString(toBeReplacedWith);
        }
        message = message.replace(new RegExp(`\\$\\{${contextId}\\}`), toBeReplacedWith);
    }
    return message;
}
