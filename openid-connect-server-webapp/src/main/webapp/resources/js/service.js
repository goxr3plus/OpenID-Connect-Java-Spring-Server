/*******************************************************************************
 * Copyright 2017 The MIT Internet Trust Consortium
 *
 * Portions copyright 2011-2013 The MITRE Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/

var ServiceModel = Backbone.Model.extend({

    idAttribute: "id",

    initialize: function () {

        // bind validation errors to dom elements
        // this will display form elements in red if they are not valid
        this.bind('error', function (model, errs) {
            _.map(errs, function (val, elID) {
                $('#' + elID).addClass('error');
            });
        });

    },

    // We can pass it default values.
    defaults: {
        id: null,
        clientId: null,
        clientName: null,
        logoUri: null,
        scope: [],
        clientDescription: null
    },

    urlRoot: "api/clients",

    matches: function (term) {

        var matches = [];

        if (term) {
            if (this.get('clientId').toLowerCase().indexOf(term.toLowerCase()) != -1) {
                matches.push($.t('service.service-table.match.id'));
            }
            if (this.get('clientName') != null && this.get('clientName').toLowerCase().indexOf(term.toLowerCase()) != -1) {
                matches.push($.t('service.service-table.match.name'));
            }
            if (this.get('clientDescription') != null && this.get('clientDescription').toLowerCase().indexOf(term.toLowerCase()) != -1) {
                matches.push($.t('service.service-table.match.description'));
            }
            if (this.get('scope') != null) {
                var f = _.filter(this.get('scope'), function (item) {
                    return item.toLowerCase().indexOf(term.toLowerCase()) != -1;
                });
                if (f.length > 0) {
                    matches.push($.t('service.service-table.match.scope'));
                }
            }
        } else {
            // there's no search term, we always match

            this.unset('matches', {
                silent: true
            });
            // console.log('no term');
            return true;
        }

        var matchString = matches.join(' | ');

        if (matches.length > 0) {
            this.set({
                matches: matchString
            }, {
                silent: true
            });

            return true;
        } else {
            this.unset('matches', {
                silent: true
            });

            return false;
        }
    }

});

var ServiceCollection = Backbone.Collection.extend({

    initialize: function () {
        // this.fetch();
    },

    model: ServiceModel,
    url: "api/clients",

    getByClientId: function (clientId) {
        var services = this.where({
            clientId: clientId
        });
        if (services.length == 1) {
            return services[0];
        } else {
            return null;
        }
    }
});

var ServiceView = Backbone.View.extend({

    tagName: 'tr',

    isServiceRendered: false,

    initialize: function (options) {
        this.options = options;

        if (!this.template) {
            this.template = _.template($('#tmpl-service-client').html());
        }

        this.model.bind('change', this.render, this);

    },

    render: function (eventName) {
        var json = {
            service: this.model.toJSON()
        };
        this.$el.html(this.template(json));

        $(this.el).i18n();

        this.isServiceRendered = true;

        return this;
    },

    events: {
        "click .btn-delete": "deleteService",
        'click .toggleDisplayTokens': 'toggleDisplayTokens'
    },

    deleteService: function (e) {
        e.preventDefault();

        if (confirm($.t('service.service-table.confirm-service'))) {
            var _self = this;

            var clientID = this.model.attributes.clientId;

            _.each(_.clone(_self.parentView.refreshTokensList.models), function (model) {
                var service = model.get('clientId');
                if (clientID == service) {
                    model.destroy({
                        dataType: false,
                        processData: false,
                        success: function () {
                            $(_self.$el).remove(); // then remove from the DOM
                        }     
                    });
                }

            });

            _.each(_.clone(_self.parentView.accessTokensList.models), function (model) {
                var service = model.get('clientId');
                if (clientID == service) {
                    model.destroy({
                        dataType: false,
                        processData: false,
                         success: function () {
                            $(_self.$el).remove(); // then remove from the DOM
                        }  
                    });
                }

            });

            _self.$el.fadeTo("fast", 0.00, function () { // fade
                $(this).slideUp("fast", function () { // slide up
                    $(this).remove(); // then remove from the DOM
                    _self.parentView.togglePlaceholder();
                    _self.parentView.refreshTable();
                });
            });

            _self.parentView.delegateEvents();
        }

        return false;
    },

    toggleDisplayTokens: function (e) {
        e.preventDefault();
        if ($('.displayTokens', this.el).is(':visible')) {
            // hide it
            $('.displayTokensContainer', this.el).addClass('muted');
            $('.displayTokens', this.el).hide('fast');
            $('.toggleDisplayTokens i', this.el).attr('class', 'icon-chevron-right');

        } else {
            // show it
            $('.displayTokensContainer', this.el).removeClass('muted');
            $('.displayTokens', this.el).show('fast');
            $('.toggleDisplayTokens i', this.el).attr('class', 'icon-chevron-down');
        }
    },

    close: function () {
        $(this.el).unbind();
        $(this.el).empty();
    }
});

var ServiceRefreshTokenModel = Backbone.Model.extend({
    idAttribute: 'id',

    defaults: {
        id: null,
        value: null,
        scopes: [],
        clientId: null,
        userId: null,
        expiration: null
    },

    urlRoot: 'api/tokens/refresh'
});

var ServiceRefreshTokenCollection = Backbone.Collection.extend({
    idAttribute: 'id',

    model: ServiceRefreshTokenModel,

    url: 'api/tokens/refresh',

    getByClientId: function (clientId) {
        var refTok = this.where({
            clientId: clientId
        });
        if (refTok.length > 0) {
            return refTok[0];
        } else {
            return null;
        }
    }

});

var ServiceRefreshTokenView = Backbone.View.extend({

    tagName: 'tr',

    initialize: function (options) {
        this.options = options;

        if (!this.template) {
            this.template = _.template($('#tmpl-service-token').html());
        }

        if (!this.scopeTemplate) {
            this.scopeTemplate = _.template($('#tmpl-scope-description').html());
        }

        this.model.bind('change', this.render, this);

    },

    events: {
        'click .btn-delete': 'deleteToken',
        'click .toggleAccessTokens': 'toggleAccessTokens',
        'click .btn-copy': 'copyToken'
    },

    render: function (eventName) {

        var expirationDate = this.model.get("expiration");

        if (expirationDate == null) {
            expirationDate = "Never";
        } else if (!moment(expirationDate).isValid()) {
            expirationDate = "Unknown";
        } else {
            expirationDate = moment(expirationDate).calendar();
        }

        var json = {
            token: this.model.toJSON(),
            formattedExpiration: expirationDate,
            type: "refresh"
        };

        this.$el.html(this.template(json));

        // show scopes
        $('.scope-description', this.el).html(this.scopeTemplate({
            scopes: this.model.get('scopes'),
            systemScopes: this.options.systemScopeList
        }));

        //Show to user that it was successfully copied
        $('[data-toggle="tooltip"]').tooltip();


        $(this.el).i18n();
        return this;

    },

    deleteToken: function (e) {
        e.preventDefault();

        if (confirm($.t('token.token-table.confirm-refresh'))) {

            var _self = this;

            this.model.destroy({
                dataType: false,
                processData: false,
                success: function () {

                    _self.$el.fadeTo("fast", 0.00, function () { // fade
                        $(this).slideUp("fast", function () { // slide up
                            $(this).remove(); // then remove from the DOM
                            // refresh the table in case the access tokens have
                            // changed, too
                            _self.parentView.refreshTable();
                        });
                    });
                },
                error: app.errorHandlerView.handleError()
            });

            _self.parentView.delegateEvents();
        }

        return false;
    },

    toggleAccessTokens: function (e) {
        e.preventDefault();
        if ($('.AccessTokens', this.el).is(':visible')) {
            // hide it
            $('.AccessTokens', this.el).hide('fast');
            $('.toggleAccessTokens i', this.el).attr('class', 'icon-chevron-right');
            $('.AccessTokensContainer', this.el).addClass('muted');
        } else {
            // show it
            $('.AccessTokens', this.el).show('fast');
            $('.toggleAccessTokens i', this.el).attr('class', 'icon-chevron-down');
            $('.AccessTokensContainer', this.el).removeClass('muted');
        }

    },

    copyToken: function (e) {

        //Get the current horizontal scroll position
        var horizontalScroll = $(window).scrollLeft();

        //Get the current vertical scroll position
        var verticalScroll = $(window).scrollTop();

        var val = this.model.get("value");
        var dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.setAttribute("id", "dummy_id");
        $('#dummy_id').val(val);
        try {
            dummy.focus();
            dummy.select();
            document.execCommand("copy");
        } catch (e) {
            alert('please press Ctrl/Cmd+C to copy');
        }
        document.body.removeChild(dummy);

        //Scroll back to the original horizontal bar scroll position
        $(window).scrollLeft(horizontalScroll);

        //Scroll back to the original vertical bar scroll position
        $(window).scrollTop(verticalScroll);


        return false;
    },

    close: function () {
        $(this.el).unbind();
        $(this.el).empty();
    }
});

var ServiceAccessTokenModel = Backbone.Model.extend({
    idAttribute: 'id',

    defaults: {
        id: null,
        value: null,
        refreshTokenId: null,
        scopes: [],
        clientId: null,
        userId: null,
        expiration: null
    },

    urlRoot: 'api/tokens/access'
});

var ServiceAccessTokenCollection = Backbone.Collection.extend({
    idAttribute: 'id',

    model: ServiceAccessTokenModel,

    url: 'api/tokens/access',

    getByClientId: function (clientId) {
        var accTok = this.where({
            clientId: clientId
        });
        if (accTok.length > 0) {
            return accTok[0];
        } else {
            return null;
        }
    }

});

var ServiceAccessTokenView = Backbone.View.extend({

    tagName: 'tr',

    initialize: function (options) {
        this.options = options;

        if (!this.template) {
            this.template = _.template($('#tmpl-service-associated-token').html());
        }

        if (!this.scopeTemplate) {
            this.scopeTemplate = _.template($('#tmpl-scope-description').html());
        }

        this.model.bind('change', this.render, this);

    },

    events: {
        'click .btn-delete': 'deleteToken',
        'click .btn-copy': 'copyToken'
    },

    render: function (eventName) {

        var expirationDate = this.model.get("expiration");

        if (expirationDate == null) {
            expirationDate = "Never";
        } else if (!moment(expirationDate).isValid()) {
            expirationDate = "Unknown";
        } else {
            expirationDate = moment(expirationDate).calendar();
        }

        var token = this.model.get("value");

        var decoded = jwt_decode(token);

        var issuedDate = decoded.iat;

        issuedDate = new Date(issuedDate * 1000);
        issuedDate = moment(issuedDate).calendar();

        var json = {
            token: this.model.toJSON(),
            formattedExpiration: expirationDate,
            formattedIssuedDate: issuedDate,
            type: "access"
        };

        this.$el.html(this.template(json));

        // show scopes
        $('.scope-description', this.el).html(this.scopeTemplate({
            scopes: this.model.get('scopes'),
            systemScopes: this.options.systemScopeList
        }));

        $(this.el).i18n();
        return this;
    },

    deleteToken: function (e) {
        e.preventDefault();

        if (confirm($.t("token.token-table.confirm"))) {

            var _self = this;

            var clId = this.model.get('clientId');
            var refId = this.model.get('refreshTokenId');

            this.model.destroy({
                dataType: false,
                processData: false,
                success: function () {

                    _self.$el.fadeTo("fast", 0.00, function () { // fade
                        $(this).slideUp("fast", function () { // slide up
                            $(this).remove(); // then remove from the DOM
                            $('#service-table #refresh-token-table-' + clId + ' #access-token-container-' + refId, _self.el).hide();
                            // refresh the table in case we removed an id token,
                            // too
                            _self.parentView.refreshTable();
                        });
                    });
                },
                error: app.errorHandlerView.handleError()
            });

            this.parentView.delegateEvents();
        }

        return false;
    },

    copyToken: function (e) {

        //Get the current horizontal scroll position
        var horizontalScroll = $(window).scrollLeft();

        //Get the current vertical scroll position
        var verticalScroll = $(window).scrollTop();

        var val = this.model.get("value");
        var dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.setAttribute("id", "dummy_id");
        $('#dummy_id').val(val);
        try {
            dummy.focus();
            dummy.select();
            document.execCommand("copy");
        } catch (e) {
            alert('please press Ctrl/Cmd+C to copy');
        }
        document.body.removeChild(dummy);

        //Scroll back to the original horizontal bar scroll position
        $(window).scrollLeft(horizontalScroll);

        //Scroll back to the original vertical bar scroll position
        $(window).scrollTop(verticalScroll);


        return false;
    },

    close: function () {
        $(this.el).unbind();
        $(this.el).empty();
    }
});

var ServiceListView = Backbone.View.extend({

    tagName: 'span',

    tokenCountLength: 0,

    initialize: function (options) {
        this.options = options;
        this.filteredModel = this.model.serviceClient;
        this.accessTokensList = this.model.serviceAccessT;
        this.refreshTokensList = this.model.serviceRefreshT;
    },

    load: function (callback) {
        if (this.model.serviceClient.isFetched && this.model.serviceRefreshT.isFetched && this.model.serviceAccessT.isFetched && this.options.systemScopeList.isFetched) {
            callback();
            return;
        }

        $('#loadingbox').sheet('show');
        $('#loading').html('<span class="label" id="loading-access">' + $.t('token.token-table.access-tokens') + '</span> ' + '<span class="label" id="loading-refresh">' + $.t('token.token-table.refresh-tokens') + '</span> ' + '<span class="label" id="loading-services">' + $.t("common.services") + '</span> ' + '<span class="label" id="loading-scopes">' + $.t("common.scopes") + '</span> ');

        $.when(this.model.serviceClient.fetchIfNeeded({
            success: function (e) {
                $('#loading-services').addClass('label-success');
            },
            error: app.errorHandlerView.handleError()
        }), this.model.serviceAccessT.fetchIfNeeded({
            success: function (e) {
                $('#loading-access').addClass('label-success');
            },
            error: app.errorHandlerView.handleError()
        }), this.model.serviceRefreshT.fetchIfNeeded({
            success: function (e) {
                $('#loading-refresh').addClass('label-success');
            },
            error: app.errorHandlerView.handleError()
        }), this.options.systemScopeList.fetchIfNeeded({
            success: function (e) {
                $('#loading-scopes').addClass('label-success');
            },
            error: app.errorHandlerView.handleError()
        })).done(function () {
            $('#loadingbox').sheet('hide');
            callback();
        });

    },

    events: {
        "click .refresh-table": "refreshTable",
        'keyup .search-query': 'searchTable',
        'click .form-search button': 'clearSearch',
        'page .paginator-refresh': 'changePage'
    },

    render: function (eventName) {

        // append and render table structure
        $(this.el).html($('#tmpl-service-table').html());

        this.renderInner();
        $(this.el).i18n();
        return this;
    },

    renderInner: function (eventName) {

        // set up the rows to render
        // (note that this doesn't render until visibility is determined in
        // togglePlaceholder)

        var refreshCount = {};

        var _self = this;

        // var accessTokensList = this.model.serviceAccessT;
        // var refreshTokensList = this.model.serviceRefreshT;

        _.each(this.accessTokensList.models, function (token, index) {
            var refId = token.get('refreshTokenId');
            if (refId != null) {
                if (refreshCount[refId]) {
                    refreshCount[refId] += 1;
                } else {
                    refreshCount[refId] = 1;
                }
            }
        });

        this.tokenCountLength = 0;

        _.each(this.filteredModel.models, function (service, index) {
            var view = new ServiceView({
                model: service
            });
            var refTok = _self.refreshTokensList.getByClientId(service.get('clientId'));
            var accTok = _self.accessTokensList.getByClientId(service.get('clientId'));
            if (refTok != null || accTok != null) {
                this.tokenCountLength += 1;
                view.parentView = this;
                // var element = view.render().el;
                var element = view.render().el;
                var clId = service.get('clientId');
                $('#service-table', _self.el).append(element);
                $('#service-table tr:last #refresh-token-table', _self.el).attr('id', 'refresh-token-table-' + clId);
                this.addView(service.get('id'), view);
            }
        }, this);

        _.each(this.refreshTokensList.models, function (token, index) {
            var view = new ServiceRefreshTokenView({
                model: token,
                systemScopeList: _self.options.systemScopeList
            });
            view.parentView = _self;
            var element = view.render().el;
            var refId = token.get('id');
            var clId = token.get('clientId');
            $('#service-table #refresh-token-table-' + clId, _self.el).append(element);
            $('#service-table #refresh-token-table-' + clId + ' tr:last #access-token-table', _self.el).attr('id', 'access-token-table-' + refId);
            $('#service-table #refresh-token-table-' + clId + ' tr:last .AccessTokensContainer', _self.el).attr('id', 'access-token-container-' + refId);
            $('#service-table #refresh-token-table-' + clId + ' #access-token-container-' + refId, _self.el).hide();

        });

        _.each(this.accessTokensList.models, function (token, index) {
            var view = new ServiceAccessTokenView({
                model: token,
                systemScopeList: _self.options.systemScopeList
            });
            view.parentView = _self;
            var element = view.render().el;
            var refId = token.get('refreshTokenId');
            var clId = token.get('clientId');
            if (refId != null) {
                //$('#refresh-token-table > #'+refTokenId+' > #more-access-tokens-list', _self.el).append(element);
                $('#service-table #refresh-token-table-' + clId + ' #access-token-table-' + refId, _self.el).append(element);
                $('#service-table #refresh-token-table-' + clId + ' #access-token-container-' + refId, _self.el).show();
            } else {
                $('#service-table #refresh-token-table-' + clId, _self.el).append(element);
            }

        });

        _self.togglePlaceholder();
    },

    views: {},

    addView: function (index, view) {
        this.views[index] = view;
    },

    getView: function (index) {
        return this.views[index];
    },

    togglePlaceholder: function () {
        // set up pagination
        var numPages = Math.ceil(this.tokenCountLength / 10);
        if (numPages > 1) {
            $('.paginator-refresh', this.el).show();
            $('.paginator-refresh', this.el).bootpag({
                total: numPages,
                maxVisible: 10,
                leaps: false,
                page: 1
            });
        } else {
            $('.paginator-refresh', this.el).hide();
        }

        if (this.tokenCountLength > 0 && this.filteredModel.length >= this.tokenCountLength) {
            this.changePage(undefined, 1);
            $('#service-table', this.el).show();
            $('#service-table-empty', this.el).hide();
            $('#service-table-search-empty', this.el).hide();
        } else {
            if (this.filteredModel.length <= this.tokenCountLength) {
                // there's stuff in the model but it's been filtered out
                $('#service-table', this.el).hide();
                $('#service-table-empty', this.el).hide();
                $('#service-table-search-empty', this.el).show();
            } else {
                // we're empty
                $('#service-table', this.el).hide();
                $('#service-table-empty', this.el).show();
                $('#service-table-search-empty', this.el).hide();
            }
        }
    },

    changePage: function (event, num) {
        console.log('Page changed: ' + num);

        $('.paginator-refresh', this.el).bootpag({
            page: num
        });
        var _self = this;

        _.each(this.filteredModel.models, function (service, index) {
            var view = _self.getView(service.get('id'));
            if (!view) {
                console.log('Error: no view for client ' + service.get('id'));
                return;
            }

            // only show/render clients on the current page

            console.log(':: ' + index + ' ' + num + ' ' + Math.ceil((index + 1) / 10) != num);

            if (Math.ceil((index + 1) / 10) != num) {
                $(view.el).hide();
            } else {
                if (!view.isServiceRendered) {
                    view.render();
                }
                $(view.el).show();
            }
        });

        /*
         * $('#service-table tbody tr', this.el).each(function(index, element) {
         * if (Math.ceil((index + 1) / 10) != num) { // hide the element
         * $(element).hide(); } else { // show the element $(element).show(); }
         * });
         */
    },

    refreshTable: function (e) {
        $('#loadingbox').sheet('show');
        $('#loading').html('<span class="label" id="loading-access">' + $.t('token.token-table.access-tokens') + '</span> ' + '<span class="label" id="loading-refresh">' + $.t('token.token-table.refresh-tokens') + '</span> ' + '<span class="label" id="loading-services">' + $.t("common.services") + '</span> ' + '<span class="label" id="loading-scopes">' + $.t("common.scopes") + '</span> ');

        var _self = this;
        $.when(this.model.serviceClient.fetch({
            success: function (e) {
                $('#loading-services').addClass('label-success');
            },
            error: app.errorHandlerView.handleError()
        }), this.model.serviceAccessT.fetch({
            success: function (e) {
                $('#loading-access').addClass('label-success');
            },
            error: app.errorHandlerView.handleError()
        }), this.model.serviceRefreshT.fetch({
            success: function (e) {
                $('#loading-refresh').addClass('label-success');
            },
            error: app.errorHandlerView.handleError()
        }), this.options.systemScopeList.fetch({
            success: function (e) {
                $('#loading-scopes').addClass('label-success');
            },
            error: app.errorHandlerView.handleError()
        })).done(function () {
            $('#loadingbox').sheet('hide');
            _self.render();
        });
    },

    searchTable: function (e) {
        var term = $('.search-query', this.el).val();

        this.filteredModel = new ServiceCollection(this.model.serviceClient.filter(function (service) {
            return service.matches(term);
        }));

        // clear out the table
        $('tbody', this.el).html('');

        // re-render the table
        this.renderInner();

    },

    clearSearch: function (e) {
        $('.search-query', this.el).val('');
        this.searchTable();
    }

});

ui.routes.push({
    path: "user/services",
    name: "services",
    callback: function () {

        this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([{
                text: $.t('admin.home'),
                href: ""
            }, {
                text: $.t('service.manage'),
                href: "manage/#user/services"
            }]);

        this.updateSidebar('user/services');

        var view = new ServiceListView({
            model: {
                serviceClient: this.serviceList,
                serviceRefreshT: this.serviceRefreshTokensList,
                serviceAccessT: this.serviceAccessTokensList
            },
            systemScopeList: this.systemScopeList
        });
        view.load(function () {
            $('#content').html(view.render().el);
            setPageTitle($.t('service.manage'));
        });

    }

});

ui.templates.push('resources/template/service.html');

ui.init.push(function (app) {
    app.serviceList = new ServiceCollection();
    app.serviceRefreshTokensList = new ServiceRefreshTokenCollection();
    app.serviceAccessTokensList = new ServiceAccessTokenCollection();
});
