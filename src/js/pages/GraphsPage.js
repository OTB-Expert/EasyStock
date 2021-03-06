import otb from "../otb/otb.js";

var GraphsPage = Vue.component("page-graphs", {
//	props: ["isMobile"],
// export default {
	template: `
	<div>
		<div fluid class="grid-list-xl py-0 mt-n3">
			<div>
			
			<otb-expert-chart
				ref="otbExpertSelector"
				v-bind:is-mobile="isMobile"
				type="symbol"
				v-on:selectItem="selectItem"
				v-on:execute="execute"
				:meta=meta
			>
			</otb-expert-chart>
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
				mapping:[
					["id", "SymbolId"]
				],
				endpoints: {
					reload: {
						action: "GET",
						endpoint: "demo/day/date/"
					},
					collect: {
						action: "GET",
						endpoint: "stock/charts/"
					},
					remove: {
						action: "GET",
						endpoint: "alert/{id}/suspend"
					},
					news: {
						action: "POST",
						endpoint: "news/last"
					},
				},
				topActions:
				[
					{
						name: "Thumbnails",
						isMobile: true,
						linkClass: "red",
						boxClass: "action-box",
						class: "glyphicon glyphicon-list-alt",
						action: "execute goto thumbnails" // Execute = execute on parent; goto = function name; ticks = parameter
					},
					{
						name: "Desktop",
						class: "glyphicon glyphicon-phone",
						// isMobile: true,
						linkClass: "red",
						boxClass: "action-box",
						action: "execute cycle isMobile" // Execute = execute on parent; goto = function name; ticks = parameter
					},
					{
						name: "Table",
						class: "glyphicon glyphicon-stats",
						// isMobile: true,
						linkClass: "red",
						boxClass: "action-box",
						action: "execute cycle isGraph" // Execute = execute on parent; goto = function name; ticks = parameter
					},
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
						name: "Remove",
						isMobile: true,
						linkClass: "red",
						class: "glyphicon glyphicon-remove-circle",
						action: "execute request remove" // Execute = execute on parent; goto = function name; ticks = parameter
					}
				],
				columns:[
					{ name: "Symbol", field: "code" },
					{
						name: "Company",
						align: "left",
						field: "name",
						editor: "select"
					},
					{ name: "Market", field: "market" },
					{ name: "Currency", field: "currency.name" },
					{ name: "Region", field: "region" },
					{ name: "Type", field: "type" },
					{ name: "Updated", field: "updated", format: "date" },
				]
			},
			items: [],
			selectorItems: [],
			selectedItem: null,
			selector:{
				selectedItem: null
			}
		};
	},
	mounted() {
		this.initialize(); 
	},
	methods: {
		initialize(){
			// this.meta.endpoints.listing.endpoint = '';
		},
		selectItem(item){
			this.selector.selectedItem = item;
		},
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
	},
});

export default {
	components: {
		GraphsPage
	},
}