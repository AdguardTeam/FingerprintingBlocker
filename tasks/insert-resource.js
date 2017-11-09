const minifyHtml = require('html-minifier').minify;
const CleanCSS = require('clean-css');
const fs = require('fs');

const RESOURCE_PATH_MAP = {
    "ALERT_TEMPLATE": 'src/ui/template.html',
    "ALERT_STYLE": 'src/ui/alerts/alert-style.css',
    // "TRANSLATIONS": 'src/locales/translations.json'
};

const RESOURCE_MAP = Object.create(null);
const reResourceMarker = /(['"])RESOURCE:([A-Za-z_\-]*?)\1/gm;

module.exports = (content, file) => {
    return content.replace(reResourceMarker, (match, c1, c2) => {
        if (RESOURCE_PATH_MAP[c2]) {
            let path = RESOURCE_PATH_MAP[c2];
            let resource;
            if (RESOURCE_MAP[c2]) {
                // Use cached resource
                resource = RESOURCE_MAP[c2];
            } else {
                resource = fs.readFileSync(path).toString();
                if (/\.html$/.test(path)) {
                    // Minify html resource
                    resource = minifyHtml(resource, {
                        collapseWhitespace: true,
                        minifyCSS: true,
                        removeAttributeQuotes: false,
                        removeComments: false,
                        removeOptionalTags: true
                    });
                    // Escape
                    resource = c1 + resource.replace(new RegExp("[\\\\" + c1 + "]", 'g'), (m) => {
                        return "\\" + m;
                    }) + c1;
                } else if (/\.json$/.test(path)) {
                    resource = JSON.stringify(JSON.parse(resource));
                } else if (/\.css$/.test(path)) {
                    resource = (new CleanCSS()).minify(resource).styles;
                    // Escape
                    resource = c1 + resource.replace(new RegExp("[\\\\" + c1 + "]", 'g'), (m) => {
                        return "\\" + m;
                    }).replace(/\r?\n/g, '\\n') + c1;
                }
                // Caching
                RESOURCE_MAP[c2] = resource;
            }
            if (resource) {
                console.log('A resource ' + c2 + ' in ' + file.path + ' was inserted');
                return resource;
            }
        }
    });
};
