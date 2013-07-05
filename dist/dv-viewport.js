//noinspection JSCheckFunctionSignatures
/**
 * dv.viewport
 * https://github.com/diegovilar/dv.viewport
 *
 * @version 0.9.0-alpha.1
 * @license BSD
 */

(function(angular, undefined){
    'use strict';

    /**
     * @constant
     * @type {!string}
     */
    var MODULE_NAME = 'dv.viewport';

    /**
     * @constant
     * @type {!string}
     */
    var VIEWPORT_SERVICE_NAME = 'dvViewport';

    /**
     * @constant
     * @type {!string}
     */
    var RESIZE_EVENT_NAME = 'viewportResize';

    /**
     * @constant
     * @type {!string}
     */
    var RESIZE_DIRECTIVE_NAME = 'dvViewportResize';

    /**
     * @constant
     * @type {number}
     */
    var DEFAULT_EVENT_DEBOUNCE_DELAY = 25;

    //noinspection JSCheckFunctionSignatures
    var module = angular.module(MODULE_NAME, []);



    //region Listener setup
    //------------------------------------------------------------------------------------------------------------------
    //noinspection JSUnresolvedFunction
    module.run(setupListener);

    setupListener.$inject = ['dvViewport', '$window', '$rootScope'];

    /**
     *
     * @param viewport
     * @param $window
     * @param $rootScope
     */
    function setupListener(viewport, $window, $rootScope) {

        var oldWidth = viewport.getWidth(),
            oldHeight = viewport.getHeight();

        /**
         * Creates a debouncing function that executes on the end of the delay.
         *
         * @param delay
         * @param func
         * @returns {Function}
         */
        function tailDebounce(delay, func) {
            var timeout,
                context,
                args,
                slice = [].slice;

            function invokeFunc() {
                func.apply(context, args)
            }

            return function() {
                context = this;
                args = slice.call(arguments, 0);

                // We don't use $timeout because we don't want to force a $digest after every resize.
                // For listeners of the viewportResize event, it's their responsibility to call $digest/$apply
                // if they find it necessary, as well as come up with a strategy to do it as few times as possible,
                // specially if there are many listeners to the event.
                // The dv-viewport-resize directive, on the other hand, will call $apply on it's current scope
                // automatically.
                $window.clearTimeout(timeout);
                timeout = $window.setTimeout(invokeFunc, delay);
            };
        }

        //noinspection JSUnresolvedFunction,JSCheckFunctionSignatures
        angular.element($window).bind('resize', tailDebounce(DEFAULT_EVENT_DEBOUNCE_DELAY, function() {

            var width = viewport.getWidth(),
                height = viewport.getHeight();

            // Did we really get resized?
            if (width != oldWidth || height != oldHeight) {
                //noinspection JSUnresolvedFunction
                $rootScope.$broadcast(
                    RESIZE_EVENT_NAME,
                    width,
                    height,
                    oldWidth,
                    oldHeight
                );

                oldWidth = width;
                oldHeight = height;
            }
        }));

    }
    //---------------------------------------------------------------------------------------------
    //endregion



    //region Resize directive
    //---------------------------------------------------------------------------------------------
    //noinspection JSUnresolvedFunction
    module.directive(RESIZE_DIRECTIVE_NAME, resizeDirectiveFactory);

    resizeDirectiveFactory.$inject = ['$parse'];

    /**
     *
     * @param $parse
     * @returns {{restrict: string, link: Function}}
     */
    function resizeDirectiveFactory($parse) {

        return {
            restrict: 'ACM',

            link: function(scope, element, attributes) {

                var userListener = $parse(attributes[RESIZE_DIRECTIVE_NAME]);

                //noinspection JSUnresolvedFunction
                scope.$on(RESIZE_EVENT_NAME, function(event, width, height, oldWidth, oldHeight) {

                    scope.$apply(function() {
                        //noinspection JSUnresolvedVariable
                        userListener(scope, {
                            $event: event,
                            element: element,

                            width: width,
                            height: height,

                            oldWidth: oldWidth,
                            oldHeight: oldHeight
                        });
                    });
                });
            }
        };
    }
    //---------------------------------------------------------------------------------------------
    //endregion



    //region Viewport service
    //------------------------------------------------------------------------------------------------------------------
    module.service(VIEWPORT_SERVICE_NAME, ['$window', '$document', viewportFactory]);

    function viewportFactory($window, $document) {

        var doc = $document[0].documentElement;

        return {
            getWidth : function () {
                return $window.innerWidth || doc.clientWidth;
            },

            getHeight : function getViewportHeight() {
                return $window.innerHeight || doc.clientHeight;
            },

            getPixelRatio : function() {
                return $window.devicePixelRatio || 1;
            }
        };
    }
    //------------------------------------------------------------------------------------------------------------------
    //endregion

})(angular);
