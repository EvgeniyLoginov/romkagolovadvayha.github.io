/**
 * OnlineMemberCtrl
 */
'use strict';
app.controller('OnlineMemberCtrl', function ($scope, ngToast, $timeout) {

    $scope.group = {
        name: null,
        members_count: null,
        photo_50: null,
        screen_name: null
    };
    $scope.groupFormActive = false;

    $scope.start = function (response) {
        var url = $scope.groupUrl;
        if (url) {
            if (response && response.session) {
                if (url.indexOf("com/") >= 0)
                    url = url.split('com/')[1];
                VK.Api.call('utils.resolveScreenName', {screen_name: url, v: '5.27'}, function (data) {
                    if (data.response) {
                        if (data.response.type == 'group') {
                            $scope.getGroupsInfo(data.response.object_id);
                            //$scope.startStats(data.response.object_id);
                        } else {
                            $scope.writeError('Неверно указана ссылка');
                        }
                    }
                });
            } else VK.Auth.login($scope.start);
        } else {
            $scope.writeError('Введите ссылку');
        }
    };

    $scope.startVK = function () {
        VK.Auth.getLoginStatus($scope.start);
    };


    $scope.writeError = function (error) {
        ngToast.success(error);
        $scope.$digest();
    };

    $scope.getGroupsInfo = function (groupID) {
        VK.Api.call('groups.getById', {group_id: groupID, fields: 'members_count', v: '5.34'}, function (data) {
            if (data.response) {
                $scope.group = data.response[0];
                $scope.getMembers20k(groupID, data.response[0].members_count);
                $scope.groupFormActive = true;
                $scope.$digest();
            }
        });
    };

    $scope.reset = function () {
        $scope.groupFormActive = false;
    };

    $scope.labels = [0,0,0,0,0,0,0,0,0,0];
    $scope.series = ['Онлайн'];
    $scope.data = [
        [0,0,0,0,0,0,0,0,0,0]
    ];
    $scope.options = {
        animation: false
    };

    $scope.labelsMobile = [0,0,0,0,0,0,0,0,0,0];
    $scope.seriesMobile = ['Онлайн с телефона'];
    $scope.dataMobile = [
        [0,0,0,0,0,0,0,0,0,0]
    ];
    $scope.optionsMobile = {
        animation: false
    };

    $scope.colours = [
        { // grey
            fillColor: 'rgba(148,159,177,0.2)',
            strokeColor: 'rgba(148,159,177,1)',
            pointColor: 'rgba(148,159,177,1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(148,159,177,0.8)'
        }
    ];


    $scope.coloursMobile = [
        { // dark grey
            fillColor: 'rgba(77,83,96,0.2)',
            strokeColor: 'rgba(77,83,96,1)',
            pointColor: 'rgba(77,83,96,1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(77,83,96,1)'
        }
    ];

    var memberOnline = [];
    var memberOnlineMobile = [];
    var count = 0;

    $scope.mutualmemberOnline = function (group_id, members_count) {
        var countOnline = 0;
        var countOnlineMobile = 0;
        var date = new Date();
        var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

        for (var i = 0; i < memberOnline.length; i++) {
            if (memberOnline[i] == 1) {
                countOnline++;
            }
        }
        var data = $scope.data;
        var labels = $scope.labels;
        if (data[0].length >= 10) {
            for (var j = 0; j < data[0].length - 1; j++) {
                data[0][j] = data[0][j + 1];
                labels[j] = labels[j + 1];
            }
            data[0].length--;
            labels.length--;
        }
        data[0].push(countOnline);
        labels.push(time);

        $scope.data = data;
        $scope.labels = labels;

        for (var i = 0; i < memberOnlineMobile.length; i++) {
            if (memberOnlineMobile[i] == '1') {
                countOnlineMobile++;
            }
        }

        if ($scope.dataMobile[0].length >= 10) {
            for (var j = 0; j < $scope.dataMobile[0].length - 1; j++) {
                $scope.dataMobile[0][j] = $scope.dataMobile[0][j + 1];
                $scope.labelsMobile[j] = $scope.labelsMobile[j + 1];
            }
            $scope.dataMobile[0].length--;
            $scope.labelsMobile.length--;
        }
        $scope.dataMobile[0].push(countOnlineMobile);
        $scope.labelsMobile.push(time);

        count = 0;
        memberOnline = [];
        memberOnlineMobile = [];
        $timeout(function () {
            $scope.getMembers20k(group_id, members_count);
        }, 4000);
    };

    $scope.getMembers20k = function (group_id, members_count) {
        var fields = 'online,online_mobile';
        var code = 'var arrMembers = API.groups.getMembers({"group_id": ' + group_id + ', "v": "5.27", "sort": "id_asc", "fields": "' + fields + '", "count": "1000", "offset": ' + memberOnline.length + '}).items;'
            + 'var membersOnline = arrMembers@.online;' // делаем первый запрос и создаем массив
            + 'var membersOnlineMobile = arrMembers@.online_mobile;' // делаем первый запрос и создаем массив
            + 'var offset = 1000;' // это сдвиг по участникам группы
            + 'while (offset < 25000 && (offset + ' + memberOnline.length + ') < ' + members_count + ')' // пока не получили 20000 и не прошлись по всем участникам
            + '{'
            + 'arrMembers = API.groups.getMembers({"group_id": ' + group_id + ', "v": "5.27", "sort": "id_asc", "fields": "' + fields + '", "count": "1000", "offset": (' + memberOnline.length + ' + offset)}).items;'
            + 'membersOnline = membersOnline + "," + arrMembers@.online;' // сдвиг участников на offset + мощность массива
            + 'membersOnlineMobile = membersOnlineMobile + "," + arrMembers@.online_mobile;' // сдвиг участников на offset + мощность массива
            + 'offset = offset + 1000;' // увеличиваем сдвиг на 1000
            + '};'
            + 'return [membersOnline, membersOnlineMobile];'; // вернуть массив members
        VK.Api.call("execute", {code: code}, function (data) {
            if (data.response) {
                memberOnline = memberOnline.concat(JSON.parse("[" + data.response[0] + "]")); // запишем это в массив
                memberOnlineMobile = memberOnlineMobile + data.response[1]; // запишем это в массив
                //$('.member_ids').html('Загрузка: ' + memberOnline.length + '/' + members_count);
                if (members_count > memberOnline.length) { // если еще не всех участников получили
                    setTimeout(function () {
                        $scope.getMembers20k(group_id, members_count);
                    }, 350); // задержка 0.35 с. после чего запустим еще раз
                } else // если конец то
                    $scope.mutualmemberOnline(group_id, members_count);

            } else {
                alert(data.error.error_msg); // в случае ошибки выведем её
            }
        });
    };


});