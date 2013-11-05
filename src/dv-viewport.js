//noinspection JSCheckFunctionSignatures
/**
 * $PROJECT_NAME$
 * $PROJECT_HOMEPAGE$
 *
 * @version $PROJECT_VERSION$
 * @license $PROJECT_LICENSE$
 */

(function(angular, undefined){
    'use strict';

    /**
     * @constant
     * @type {!string}
     */
    var MODULE_NAME = 'dvViewport';

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

    /**
     * @constant
     * @type {number}
     */
    var DEFAULT_POOL_INTERVAL = 30;

    /**
     * @constant
     * @type {boolean}
     */
    var DEFAULT_POOL_ACTIVE_CONFIGURAION = false;



    //noinspection JSCheckFunctionSignatures
    var module = angular.module(MODULE_NAME, []);




    //region Resize directive
    //---------------------------------------------------------------------------------------------
    //noinspection JSUnresolvedFunction
    module.directive(RESIZE_DIRECTIVE_NAME, resizeDirectiveFactory);

    resizeDirectiveFactory.$inject = ['$parse', VIEWPORT_SERVICE_NAME];

    /**
     *
     * @param $parse
     * @returns {{restrict: string, link: Function}}
     */
    function resizeDirectiveFactory($parse, viewport) {

        return {
            restrict: 'ACM',

            link: function(scope, element, attributes) {

                var userHandler = $parse(attributes[RESIZE_DIRECTIVE_NAME]);

                function handler(event, width, height, oldWidth, oldHeight) {

                    scope.$apply(function() {
                        //noinspection JSUnresolvedVariable
                        userHandler(scope, {
                            $event: event,
                            element: element,

                            width: width,
                            height: height,
                            oldWidth: oldWidth,
                            oldHeight: oldHeight
                        });
                    });
                }

                //noinspection JSUnresolvedFunction
                scope.$on(RESIZE_EVENT_NAME, handler);

                // We always fire once when attaching
                userHandler(scope, {
                    $event : {
                        name: RESIZE_EVENT_NAME,
                        targetScope: scope,
                        preventDefault: function() {
                            this.defaultPrevented = true;
                        },
                        defaultPrevented: false
                    },
                    element: element,
                    width: viewport.getWidth(),
                    height: viewport.getHeight(),
                    oldWidth: 0,
                    oldHeight: 0
                });
            }
        };
    }
    //---------------------------------------------------------------------------------------------
    //endregion



    //region Viewport service
    //------------------------------------------------------------------------------------------------------------------
    module.provider(VIEWPORT_SERVICE_NAME, function() {

        var config = {
            pool : DEFAULT_POOL_ACTIVE_CONFIGURAION,
            poolInterval : DEFAULT_POOL_INTERVAL,
            debounceDelay : DEFAULT_EVENT_DEBOUNCE_DELAY
        };

        viewportServiceFactory.$inject = ['$window', '$document', '$rootScope', '$log'];

        function viewportServiceFactory($window, $document, $rootScope, $log) {

            var doc = $document[0].documentElement;

            function getViewportWidth() {
                return $window.innerWidth || doc.clientWidth;
            }

            function getViewportHeight() {
                return $window.innerHeight || doc.clientHeight;
            }

            function getPixelRatio() {
                return $window.devicePixelRatio || 1;
            }

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

            var oldWidth = getViewportWidth(),
                oldHeight = getViewportHeight(),
                debounceDelay = Math.abs(parseInt(config.debounceDelay, 10)) || DEFAULT_EVENT_DEBOUNCE_DELAY,
                rootElement = angular.element($window);

            //noinspection JSUnresolvedFunction,JSCheckFunctionSignatures
            rootElement.bind('resize', tailDebounce(debounceDelay, function() {

                var width = getViewportWidth(),
                    height = getViewportHeight();

                // Did we really get resized?
                if (width != oldWidth || height != oldHeight) {

                    $log.info('dvViewport: Viewport resized from ' + oldWidth + 'x' + oldHeight + ' to ' + width + 'x' + height + '.');

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

            // TODO Tratar poolInterval para nunca ser menor do que debounceDelay sob pena de a detecção por pooling
            // disparar infinitamente.
            if (config.pool) {
                $log.info('dvViewport: Pooling enabled, every ' + config.poolInterval + ' milliseconds.');

                setInterval(function() {

                    var width = getViewportWidth(),
                        height = getViewportHeight();

                    if (width != oldWidth || height != oldHeight) {
                        $log.info('dvViewport: Resize detected by pooling. Triggering event.');
                        //$log.info('dvViewport: Viewport resize detected by pooling from ' + oldWidth + 'x' + oldHeight + ' to ' + width + 'x' + height + '. Triggering event.');
                        rootElement.triggerHandler('resize');
                    }

                }, config.poolInterval)
            }

            $log.info('dvViewport: Service instantiated.');
            $log.info('dvViewport: Initial viewport size is ' + oldWidth + 'x' + oldHeight + '.');

            // The actual service API
            return {
                getWidth : getViewportWidth,
                getHeight : getViewportHeight,
                getPixelRatio : getPixelRatio
            };
        }

        return {
            $get : viewportServiceFactory,

            /**
             *
             * @param {object} configOptions
             */
            config : function(configOptions) {

                if (angular.isObject(configOptions) && !angular.isArray(configOptions)) {
                    angular.extend(config, angular.copy(configOptions));
                }

            }
        };

    });
    //------------------------------------------------------------------------------------------------------------------
    //endregion

})(angular);
