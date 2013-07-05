/**
 * @author Diego
 */

(function (angular, undefined) {
    "use strict";

    var app = angular.module('TestApp', ['dvViewport']);

    app.controller("TestController", TestController);

    function TestController($scope, $rootScope, dvViewport) {

        window.$s = $scope;
        $scope.window = window;
        $s.dvViewport = dvViewport;

        var scope = {
            last : 'never',
            count : 0
        };
        $scope.$on('viewportResize', function(event, width, height, oldWidth, oldHeight) {
            scope.last = new Date();
            scope.count++;
        });

        var rootScope = {
            last : 'never',
            count : 0
        };
        $rootScope.$on('viewportResize', function() {
            rootScope.last = new Date();
            rootScope.count++;
        });

        var directive = {
            last : 'never',
            count : 0,
            width : null,
            height : null,
            oldWidth : null,
            oldHeight : null,
            onViewportResize : function($event, width, height, oldWidth, oldHeight, element) {
                this.last = new Date();
                this.count++;
                this.width = width;
                this.height = height;
                this.oldWidth = oldWidth;
                this.oldHeight = oldHeight;
            }
        };

        $scope.scope = scope;
        $scope.rootScope = rootScope;
        $scope.directive = directive;
    }

})(angular);
