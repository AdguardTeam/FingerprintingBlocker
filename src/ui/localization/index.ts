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
