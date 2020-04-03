import * as AlertsPage from './pages/AlertsPage.js';
import * as SymbolsPage from './pages/SymbolsPage.js';
import * as TicksPage from './pages/TicksPage.js';
import * as RequestsPage from './pages/RequestsPage.js';
import * as CountriesPage from './pages/CountriesPage.js';
import * as CurrenciesPage from './pages/CurrenciesPage.js';
import * as ThumbnailsPage from './pages/ThumbnailsPage.js';
import * as NewsPage from './pages/NewsPage.js';
import * as LastNewsPage from './pages/LastNewsPage.js';
import * as GraphsPage from './pages/GraphsPage.js';

import {VPopover, VTooltip} from './../lib/v-tooltip/dist/v-tooltip.esm.js';

import * as OtbSelector from './otb/components/OtbExpertSelector.js';
import * as OtbTable from './otb/components/OtbExpertTable.js';
import * as OtbLookup from './otb/components/OtbExpertLookup.js';
import * as OtbEditor from './otb/components/OtbExpertEditor.js';
import * as OtbCalendar from './otb/components/OtbExpertCalendar.js';
import * as OtbChart from './otb/components/OtbExpertChart.js';
import * as OtbThumbnail from './otb/components/OtbExpertThumbnail.js';
import * as OtbHorizontal from './otb/components/OtbExpertHorizontal.js';
import * as OtbNews from './otb/components/OtbExpertNews.js';
import * as OtbLastNews from './otb/components/OtbExpertLastNews.js';
import services from './otb/services/index.js';
// import Autocomplete from './../lib/vue2-autocomplete/dist/vue2-autocomplete.js';

Vue.use(VTooltip);

Vue.filter("ravelloDate",
    function(value) {
        if (!value) {
            return "";
        }
        return (new Date(parseInt(value))).toISOString();
    });

Vue.filter('dateOnly', function(value) {
    if (value) {    
        if (!value) {
            return "";
        }
        return moment(String(value)).format('DD-MM-YYYY')
    }
});

Vue.filter("truncate",
    function(text, stop, clamp) {
        return text.slice(0, stop) + (stop < text.length ? clamp || "..." : "");
    });

Vue.directive("relativetime",
    function(el, binding) {
         Ajuro.RelativeTimeManager.updateElementUsingValue(el, parseInt(binding.value));
    });

function formToJson(formEl) {
    let result = {};
    $.each(formEl.serializeArray(),
        function() {
            result[this.name] = this.value;
        });
    return JSON.stringify(result);
}

let app = new Vue({
    el: "#ajuroApp",
    components: {   
        AlertsPage,
        CountriesPage,
        CurrenciesPage,
        GraphsPage,
        NewsPage,
        LastNewsPage,
        RequestsPage,
        SymbolsPage,
        ThumbnailsPage,
        TicksPage,
        VPopover,
        VTooltip
        // autocomplete
    },
    data: {
        ttt: 8,
        isMobile: false,
        // currentPage: "page-requests",
        // currentPage: "page-news",
        // currentPage: "page-thumbnails",
        // currentPage: "page-thumbnails",
        // currentPage: "page-graphs",
        currentPage: "page-symbols",
        lookup:
        {
            symbols: {
                items: [],
                loaded: false,
                isLoading: false,
                endpoint: "symbol/lookup"
            }
        },
        meta:
        {
            endpoints: {
                listing: {
                    action: "GET",
                    endpoint: "alert/list"
                }
            },
        },
        metaSymbol:{
            endpoints: {
                reload: {
                    action: "POST",
                    endpoint: "symbol/list"
                }
            },
            topActions:
            [
                {
                    name: "Reload",
                    class: "glyphicon glyphicon-refresh blue",
                    linkClass: "blue",
                    boxClass: "action-box",
                    action: "execute request reload" 
                },
            ],
            actions:
            [
                {
                    name: "isAlert",
                    type: 1,
                    states:[
                        {
                            name: "Enable",
                            class: "glyphicon glyphicon-eye-close",
                            action: "execute switch alert on"
                        },
                        {
                            name: "Disable",
                            class: "glyphicon glyphicon-download-alt",
                            action: "execute switch alert off"
                        },
                    ]
                },
            ],
            columns:[
            ]
        },
        requestErrors: [],
        errors: {
            displayed: null,
            requestId: null,
            loading: false
        },
        modalErrors: [],
        showMenu: false,
        showEditor: false,
        selectedItem: null
    },
    computed: {
        lookupSymbols() {
            return this.lookup.symbols.items.filter(instance => {
                return true;
            });
        },
    },
    mounted: function() {
        setTimeout(function () {
            document.getElementById('app-waiting').style.display = 'none';
            document.getElementById('app-content').style.display = 'block';
        }, 100); 
    },
    created: function() {
        if (window.location.hash) {
            this.currentPage = window.location.hash.substr(1);
        }
    },
    methods: {
        getData(){

        },
        addAlert(){
			this.selectedItem = {};
			this.showEditor = true;
        },
        gotoPage: function(newPage, baseObject, id) {
            this.baseObject = baseObject;
            this.baseId = id;
            this.currentPage = newPage;
            event.preventDefault();
            return false;
        },
        setPage: function(event) {
            this.meta = null;
            let data = event.target.getAttribute("data-page");
            this.currentPage = data;
            event.preventDefault();
            return false;
        },
		execute: function(item, action) {
			if(action.indexOf('execute ') == 0)
			{
				this.$emit('execute', action.substring(8), item);
			}
			else{
				this[action](item);
			}
		}
    },
});