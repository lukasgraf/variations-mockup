/**
 * @license
 * Patterns @VERSION@ parser - argument parser
 *
 * Copyright 2012 Simplon B.V.
 * Copyright 2012 Florian Friesdorf
 */
define([
    'jquery',
    '../logging'
], function($, logging) {
    var log = logging.getLogger('parser');

    function ArgumentParser(name) {
        this.order = [];
        this.mappings = {};
        this.parameters = {};
        this.attribute = "data-pat-" + name;
    }

    ArgumentParser.prototype = {
        named_param_pattern: /^\s*([a-zA-Z0-9\-]+)\s*:(.*)/,

        add_argument: function(name, default_value, choices) {
            var js_name = name.replace(/\-([a-z])/g, function(_,p1){return p1.toUpperCase();}),
                spec;

            spec={name: name,
                  value: (default_value===undefined) ? null : default_value};
            if (choices && Array.isArray(choices) && choices.length) {
                spec.choices=choices;
                spec.type=this._typeof(choices[0]);
            } else if (typeof spec.value==="string" && spec.value.slice(0, 1)==="$")
                spec.type=this.parameters[spec.value.slice(1)].type;
            else
                spec.type=this._typeof(spec.value);

            this.order.push(name);
            this.mappings[name]=js_name;
            this.parameters[js_name]=spec;
        },

        _typeof: function(obj) {
            var type = typeof obj;
            if (obj===null)
                return "null";
            return type;
        },

        _set: function(opts, name, value) {
            if (!(name in this.parameters)) {
                log.debug("Ignoring value for unknown argument " + name);
                return;
            }

            var spec=this.parameters[name];
            try {
                if (typeof value !== spec.type)
                    switch (spec.type) {
                        case "boolean":
                            if (typeof value === "string") {
                                value=value.toLowerCase();
                                var num = parseInt(value, 10);
                                if (!isNaN(num))
                                    value=!!num;
                                else
                                    value=(value==="true" || value==="y" || value==="yes" || value==="y");
                            } else if (typeof value === "number")
                                value=!!value;
                            else
                                throw ("Cannot convert value for " + name + " to boolean");
                            break;
                        case "number":
                            if (typeof value === "string") {
                                value=parseInt(value, 10);
                                if (isNaN(value))
                                    throw ("Cannot convert value for " + name + " to number");
                            } else if (typeof value === "boolean")
                                value=value + 0;
                            else
                                throw ("Cannot convert value for " + name + " to number");
                            break;
                        case "string":
                            value=value.toString();
                            break;
                        case "null":  // Missing default values
                        case "undefined":
                            break;
                        default:
                            throw ("Do not know how to convert value for " + name + " to " + spec.type);
                    }

                if (spec.choices && spec.choices.indexOf(value)===-1)
                    log.warn("Illegal value for " + name + ": " + value);
                else
                    opts[name]=value;
            } catch (e) {
                log.warn(e);
            }
        },

        _parse: function(parameter) {
            var opts = {}, i, name;

            if (parameter) {
                var parts = parameter.split(";"),
                    part, matches;

                // Grab all positional parameters
                i=-1;
                while (parts.length) {
                    i++;
                    if (i>=this.order.length) {
                        break;
                    }
                    part = parts.shift().trim();
                    if (!part)
                        continue;
                    if (this.named_param_pattern.test(part)) {
                        parts.unshift(part);
                        break;
                    }
                    this._set(opts, this.mappings[this.order[i]], part.trim());
                }

                // Handle all named parameters
                for (i=0; i<parts.length; i++) {
                    if (!parts[i])
                        continue;

                    matches = parts[i].match(this.named_param_pattern);
                    if (!matches) {
                        log.warn("Positional parameters not allowed after named parameters");
                        break;
                    }
                    if (this.parameters[this.mappings[matches[1]]] === undefined) {
                        log.warn("Unknown named parameter " + matches[1]);
                        continue;
                    }

                    this._set(opts, this.mappings[matches[1]], matches[2].trim());
                }
            }

            return opts;
        },

        _defaults: function() {
            var result = {};
            for (var name in this.parameters)
                result[name]=this.parameters[name].value;
            return result;
        },

        parse: function($el, options, multiple) {
            if (typeof options==="boolean" && multiple===undefined) {
                multiple=options;
                options={};
            }

            var stack = [[this._defaults()]];

            var $parents = $el.parents().andSelf(),
                final_length = 1,
                i, data, frame;
            for (i=0; i<$parents.length; i++) {
                data = $parents.eq(i).attr(this.attribute);
                if (data) {
                    var _parse = this._parse.bind(this); // Needed to fix binding in map call
                    if (data.match(/&&/))
                        frame=data.split(/\s*&&\s*/).map(_parse);
                    else
                        frame=[_parse(data)];
                    final_length = Math.max(frame.length, final_length);
                    stack.push(frame);
                }
            }
            if (typeof options==="object") {
                if (Array.isArray(options)) {
                    stack.push(options);
                    final_length=Math.max(options.length, final_length);
                } else
                    stack.push([options]);
            }

            if (!multiple)
                final_length=1;

            var results=[], frame_length, x, xf;
            for (i=0; i<final_length; i++)
                results.push({});

            for (i=0; i<stack.length; i++) {
                frame=stack[i];
                frame_length=frame.length-1;

                for (x=0; x<final_length; x++) {
                    xf=(x>frame_length) ? frame_length : x;
                    results[x]=$.extend(results[x], frame[xf]);
                }
            }

            // Resolve references
            var name, value, spec;
            for (i=0; i<results.length; i++)
                for (name in results[i]) {
                    spec=this.parameters[name];
                    if (results[i][name]===spec.value && typeof spec.value==="string" && spec.value.slice(0, 1)==="$")
                        results[i][name]=results[i][spec.value.slice(1)];
                }

            return multiple ? results : results[0];
        }
    };

    return ArgumentParser;
});
// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab

