/**
 * Messenger.js
 * Extends definition of messenger, a function in Backbone
 */
define(function() {
    messenger = _.extend({}, Backbone.Events)
    // Semantic aliases
    messenger.when = messenger.on
    messenger.dispatch = messenger.trigger
    return messenger;
})