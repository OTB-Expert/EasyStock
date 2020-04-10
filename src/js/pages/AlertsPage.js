import otb from "../otb/otb.js";

Vue.component("page-alerts", {
    // export default {
        template: `
        <div>
            <div fluid class="grid-list-xl py-0 mt-n3">
                <div>			
                    <otb-expert-table
                        ref="otbExpertTable"
                        v-bind:is-mobile="isMobile"
                        v-on:editItem="editItem"
                        v-on:execute="execute"
                        type="alert"
                        :meta=meta
                    >
                    </otb-expert-table>
    
                    <otb-expert-editor v-show="showEditor" @close="showEditor = false"
                        ref="otbExpertEditor"
                        type="alert"
                        :selectedItem="selectedItem"
                        :meta=meta
                    >
                    </otb-expert-editor>
                    </app-card>
                </div>
            </div>
        </div>
        `,
        style: `
            .size_40{
                width: 40px;
                height: 40px;
            }
        `,
        data() {
            return {
                isMobile: false,
                loader: true,
                selected: [],
                meta:{
                    endpoints: {
                        reload: {
                            action: "GET",
                            endpoint: "alert/list"
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
                            name: "Edit",
                            class: "glyphicon glyphicon-edit",
                            link: null,
                            action: "editItem"
                        },
                        {
                            name: "Ticks",
                            class: "glyphicon glyphicon-list-alt",
                            action: "execute goto ticks" // Execute = execute on parent; goto = function name; ticks = parameter
                        }
                    ],
                    columns:[
                        { 
                            name: "Symbol", 
                            field: "symbol",
                            editor: "select",
                            help: "Select symbol!",
                            lookup: "symbols"
                         },
                        {
                            name: "Company",
                            align: "left",
                            field: "name",
                        },
                        { name: "Price", field: "price",
                        },
                        {
                            name: "Target",
                            field: "target",
                            editor: "input",
                            help: "The lower threshold to send you notification?",
                        },
                        {
                            name: "Price", 
                            field: "price",
                         },
                        { name: "Type", field: "type" },
                        { 
                            name: "Watch",
                            field: "email",
                            editor: "checkbox",
                            help: "Watch it on dashboard?", 
                        },
                        { 
                            name: "Email",
                            field: "email",
                            editor: "checkbox",
                            help: "Do you want email alert?", 
                        },
                        { 
                            name: "Quantity", 
                            field: "quantity",
                            editor: "input",
                            help: "How many shares you have?", 
                        },
                        {
                            name: "Price",
                            field: "price",
                            editor: "input",
                            help: "How much you invested?", 
                         },
                    ]
                },
                items: [],
    
                selectedItem: null,
                showEditor: false,
            };
        },
        methods: {
            editItem(item) {
                this.selectedItem = item;
                this.showEditor = true;
            },
            goto(item, params){
                this.$parent.gotoPage("page-" + params[0], item);
            },
            execute(parameters, item) {
                var action = parameters.split(' ')[0];
                var params = '';
                if(parameters.indexOf(' ') > 0){
                    params = parameters.substring(parameters.indexOf(' ') + 1);
                }
                switch(action)
                {
                    // Accepted actions
                    case "goto":
                        this[action](item, params.split(' '));
                        break;
                }
                this.selectedItem = item;
                this.showEditor = true;			
            },
        }
    });
    