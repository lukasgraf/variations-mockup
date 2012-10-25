requirejs.config({
    baseUrl: "src/",
    paths: {
        "jquery": "3rdparty/require-jquery"
    }
});


define([
    'jquery',
    './registry',
    './3rdparty/prefixfree',
    './3rdparty/modernizr-2.0.6',
    './patterns/autofocus',
    './patterns/autoload',
    './patterns/autosubmit',
    './patterns/autosuggest',
    './patterns/breadcrumbs',
    './patterns/carousel',
    './patterns/checkedflag',
    './patterns/checklist',
    './patterns/chosen',
    './patterns/collapsible',
    './patterns/depends',
    './patterns/edit-tinymce',
    './patterns/expandable',
    './patterns/floatingpanel',
    './patterns/focus',
    './patterns/fullcalendar',
    './patterns/inject',
    './patterns/menu',
    './patterns/modal',
    './patterns/navigation',
    './patterns/placeholder',
    './patterns/setclass',
    './patterns/sorting',
    './patterns/switch',
    './patterns/toggle',
    './patterns/tooltip',
    './patterns/validate',
    './patterns/zoom'
], function($, registry) {
    // wait for the DOM to be ready and initialize
    $(document).ready(function(){
        registry.scan(document.body);
    });
    return registry;
});
