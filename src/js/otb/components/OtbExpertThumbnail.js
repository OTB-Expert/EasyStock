import services from "../services/index.js"
import { createChart } from '../../../lib/lightweight-charts/lightweight-charts.esm.development.js';
import { bindToDevicePixelRatio } from '../../../lib/fancy-canvas/coordinate-space.js';


window.Event = new Vue();

// 
const OtbTable = Vue.component("otb-expert-thumbnail", {
  props: ["heading", "message", "onConfirm", "type", "meta", "isMobile"],
  template: `
  <div class="v-data-table theme--light">
	<div class="v-data-table__wrapper" style="" v-on:scroll.passive="handleScroll($event)">
	<div>		
		<div>
			<span v-if="meta && meta.topActions">
				<span v-for="(action, actionIndex) in meta.topActions" :key="actionIndex">
					<span v-if="!isMobile || action.isMobile" :class="action.boxClass">
						<a 
							:title="action.name" 
							v-bind:class="action" 
							:class="action.linkClass"
							:href="action.link ? action.link : '#'" 
							v-on:click="action.action ? execute(null, action) : $parent.setPage"
							><i :class="action.class"></i> {{ action.name }}</a>
					</span>
				</span>
			</span>
		</div>
	</div>
	
	<input v-model="searchText" v-on:keyup.enter="fetchItems()"/>		

	
		<div :class="isMobile ? 'thumbnails': 'calendar'">
			<ul class="days">
				<li v-for="(symbol, index) in filteredItems"  v-bind:key="symbol.symbolId">
					<h5 class="title">
				<span v-if="!isMobile && items[index] && items[index].intraday">{{items[index].intraday.length}}</span>
						<span v-if="!symbol.news" class="pill waiting">-</span>
						<span v-if="symbol.news && symbol.news.length > 0">						
							<v-popover placement="left" style='width: 95%'>
								<span class="pill success">{{ symbol.news.length }}</span>
								<template slot="popover">
									<table style='font-size: 12px'>
										<template v-for="(news, nix) in symbol.news" v-if="!isMobile || nix < 5">
											<tr>
												<td class="news-td"><img :src="news.image" class="news-img"/></td>
												<td class="news-td"><span class="news-text"><b><a :href="news.url" class="news-link" target="_blank">{{news.headline}}</a></b><br>{{news.summary}}</span></td>
											</tr>
										</template>
									</table>
									<a v-close-popover>Close</a>
								</template>
							</v-popover>
						</span>
						<span :title="symbol.symbolName">{{ symbol.code }} <span v-if="!isMobile">({{ symbol.symbolId }})</span> </span>
						<div>
							<span v-if="!isMobile">{{items[index].intraday[items[index].intraday.length-1].value}}$ </span>
							<span class="pill" :class="getPercentage(index) < 0 ? 'down': 'up'"> {{ getPercentage(index) }}% </span>
						</div>
								
				<div v-if="meta && meta.actions">
					<span v-for="(action, actionIndex) in meta.actions" v-if="!isMobile || action.isMobile" :key="actionIndex">
						<span :class="action.boxClass">
							<a 
								:title="action.name" 
								v-bind:class="action" 
								:class="action.linkClass"
								:href="action.link ? action.link : '#'" 
								v-on:click="action.action ? execute(symbol, action) : $parent.setPage"
								><i :class="action.class"></i> {{ action.name }}</a>
						</span>
					</span>
				</div>
					</h5>
					<div 
						:id="'graph_' + symbol.symbolId" 
						v-show="show(index)"
						:class="isMobile ? 'graphGridItem_mobile_thumbnails' : 'graphGridItem_001'"
					>
					</div>
					<div class="graphGridItem_001 missing" v-if="!show(index)"> 
						<span v-if="symbol.loading" class="action success">
							<img class="loader glyphicon" v-if="symbol.loading" src="./js/otb/img/loading-red.svg" alt="loading"/>
						</span>					
						<i v-else v-on:click="api_collect(filteredItems[index])" class="glyphicon glyphicon-refresh"> Reload for {{ date }}</i>
					</div>
			</li>
			</ul>
		</div>
	</div>
</div>
  `,
  style: `
  
  `,
  model: {
    event: 'edit'
  },
  data() {
	return {
		debug: false,
		items_news: [],
		// isMobile: true,
		isLoading_news: false,
		isPooling: false,
		date: null,
		items: [],
			take: 20,
			skip: 0,
			sortingBy: null,
			selectedDate: null,
			sortingUp: null,
			searchText: "",
			lastSearch: null,
			selectedItemsCount: 0,
			forceComputeNews: false,
			open: false,
			loader: true,
			isLoading: false,
            isMore: false,
			search: "",
			selected: [],
			response: {
				timestamps: {
					apiResponse: null,
					apiRequest: null
				}
			},
			
			today: moment(),
			dateContext: moment(),
			days: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
			lastRequest: null
		};
	},
	mounted() {
		var initialDate = new Date();
		while(initialDate.getDay() == 6 || initialDate.getDay() == 0)
		{
			initialDate.setDate(initialDate.getDate() - 1);
		}
		this.selectedDate = initialDate;
		this.date = moment(initialDate).format('YYYY-MM-DD');
		this.fetchItems();
		this.fetchNews();
	},
	filters: {
		columnFormat: (value, format) => { 
		switch(format)
		{
			case 'json':
			return JSON.stringify(value, null, 2);
			// break;
			case 'date':
			var t = new Date(0, 0, 0); // Epoch
			var h = services.util.human(t.setSeconds(value - (1900*31536000)));
			return value ? h : '';
			//break;
			default:
			return value;
		}
		}
	},
	computed:{
		getPercentage(){
			return (index) => { 
				var c = index;
				var init = this.items[index].intraday[0].value;
				var last = this.items[index].intraday[this.items[index].intraday.length - 1].value;
				if(!last || !init)
				{
					return 0;
				}
				var percent = init < last ? (100 - (init * 100 / last)) : (100 - (last * 100 / init)) * -1;
				return percent.toFixed(2);
			}
		},
    graphsData(){                         
      this.data.forEach( function(item, index){
          // that.updateCharts(item.symbolName, item.intraday)
      })
    },
    show(){
      return (index) => {
		  if(this.filteredItems[index] && this.filteredItems[index].deleted){ return false; }        
            return this.items[index] && this.items[index].intraday && this.items[index].intraday.length > 0;
      }
    },
		getTicks(){
			return date => this.item ? this.items.find(p=>p.date.indexOf('-' + date + 'T') > -1) ?  this.items.find(p=>p.date.indexOf('-' + date + 'T') > -1).samples : null : null;
		},
    filteredItems() {
		if(this.lastSearch && this.lastSearch != this.searchText)
		{
			this.fetchItems(this.date).then(p=>{
				this.attachNews();
			});
		}
		this.lastSearch = this.searchText;
		return this.items && this.items.length > 0 ? this.items.filter(item => {
			return !this.items || !this.searchTerm 
				|| (item.symbolName && item.symbolName.toLowerCase().includes(this.searchText.toLowerCase()))
		}): null;
    },
		timestamp() {
			return services.util.human(this.response.timestamps.apiResponse);
		},		
		elapsed() {
			return this.response.timestamps.apiResponse - this.response.timestamps.apiRequest;
		},

		
		year: function () {
			var t = this;
			return t.dateContext.format('Y');
		},
		month: function () {
			var t = this;
			return t.dateContext.format('MMMM');
		},
		//Previous Code Above
		daysInMonth: function () {
			var t = this;
			return t.dateContext.daysInMonth();
		},
		currentDate: function () {
			var t = this;
			return t.dateContext.get('date');
		},
		firstDayOfMonth: function () {
			var t = this;
			var firstDay = moment(t.dateContext).subtract((t.currentDate - 1), 'days');
			return firstDay.weekday();
		},
		//Previous Code Above
	   initialDate: function () {
			var t = this;
			return t.today.get('date');
		},
		initialMonth: function () {
			var t = this;
			return t.today.format('MMMM');
		},
		initialYear: function () {
			var t = this;
			return t.today.format('Y');
		}
	},
	methods: {
		api_collect(alert) {
			if(alert.intraday.length > 0)
			{
				return;
			}
			alert.loading = true;
			var meta = {};
			var filter = {};
			services.api.get(this, "stock/symbol/" + alert.symbolId + "/pool/" + moment(this.selectedDate).format('YYYY-MM-DD'),	meta, filter, true).then(r => {
				// var date = this.virtualItems.find(p => r.data == p.date);
				// date.loading = false;
				// date.samples = r.data.samples;
			});
		},
		attachNews(){
			if(!this.items_news || !this.items){
				return;
			}
			this.items.forEach(s => {
				var news = this.items_news.filter(p=>p.symbolId === s.symbolId);
				if(news.length)
				{
					s.news = news.length > 0 ? news : null;
				}
			});
		},
		fetchNews(){
			var collectionName = "news";
			var meta = { 
			};
				  services.api.get(this, 
				  (this.meta.endpoints[collectionName].endpoint ? this.meta.endpoints[collectionName].endpoint : (this.type + "/list")), meta).then(r => {
					  r.data.data.forEach(p=>{
						  if(!p.id)
						  {
							  p.id = p['newsId'];
							  p.deleted = false;
							  p.readed = false;
						  }
						  p.selected = false;
					});
					this.items_news = r.data.data;
				}).then(r=>{
					this.attachNews();
				});
		},
    updateCharts(symbol, data){
      if(!symbol.intraday || symbol.intraday.length === 0)
      {
        return;
	  }
	  var element = document.getElementById("graph_" + symbol.symbolId);
	  if(!element || window.getComputedStyle(element).display !== 'block')
	  {
        return;
	  }
        const chart = createChart("graph_" + symbol.symbolId, { height: 100, width: (this.isMobile ? 100 : 200) });
        const lineSeries = chart.addLineSeries  ({          
          price: 39.0,
          color: 'red',
          lineWidth: 2,
          axisLabelVisible: false,
        });
		lineSeries.setData(data);
		chart.timeScale().fitContent();
		chart.applyOptions({
			priceScale: {
				lastValueVisible: false,
				position: 'none'
			},
			  timeScale: {
				borderVisible: false,
				visible: false,
				timeVisible: false
			},			
			handleScroll: {
				mouseWheel: true,
				pressedMouseMove: true,
			},
			handleScale: {
				axisPressedMouseMove: false,
				mouseWheel: false,
				pinch: false,
			},
		});
    },
		loadCompleted(items){        
      var that = this;              
      items.forEach( function(item, index){
        // that.alerts.push(item.symbolName);
        that.$forceUpdate();
		var current_datetime = new Date();
          item.intraday = item.intraday.map((val, index) => {
            // var current_datetime = new Date(val[0] * 1000);
            current_datetime.setDate(current_datetime.getDate() + 1 );
            let formatted_date = current_datetime.getFullYear() + "-" + ((current_datetime.getMonth() + 1) < 10 ? '0': '') + (current_datetime.getMonth() + 1) +  (current_datetime.getDate() < 10 ? "-0" : '-') + current_datetime.getDate();// + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds() 
            return {
              time: formatted_date, 
              value: val[1]
              };
          }, this);
          that.$nextTick(() => {
            that.updateCharts(item, item.intraday);
          });
      });
		},
		fetchItems(){
			this.fetchItems(moment(this.selectedDate).format('YYYY-MM-DD'));
		},
		fetchItems(date, context = null) {
			if(!date)
			{
				date = moment(this.selectedDate).format('YYYY-MM-DD');
			}
			if(context && !this.isPooling)
			{
				return;
			}
			if(!context)
			{
				context = this;
			}
			if(this.meta && this.meta.endpoints && this.meta.endpoints.reload.endpoint && this.meta.endpoints.reload.action == 'POST')
			{
				return this.postItems(date);
			}
			else
			{
				this.getItems(date);
			}
			if(this.isPooling){
				this.lastRequest = new Date();
				setTimeout(function(){ context.fetchItems(date, context); }, 3000);
			}
		},
		getItems(date) {
			var collectionName = "01";
			var meta = { 
				collection: "items_" + collectionName, 
				loading: "isLoading_" + collectionName 
			};
			services.api.get(this, 
			(this.meta.endpoints.reload.endpoint ? this.meta.endpoints.reload.endpoint 
				+ (date ? '/' + date : '') 
				+ "/skip/5/take/20"
				: (this.type + "/list")), meta).then(r => {
					r.data.data.forEach(p=>{
						if(this.meta && this.meta.mapping){
							this.meta.mapping.forEach(m=>{
								p[m[0]] = "" + p[m[1]];
							});
						}
						if(!p.id)
						{
							p.id = p[this.type+'Id'];
						}
						p.action = { 						
							cycle_name: (p.active ? "Stop Polling": "Start Polling"), 
							cycle_class: (p.active ? "glyphicon glyphicon-pause": "glyphicon glyphicon-play")
						};
						p.selected = false;
						p.news = [];
					});
					if(r.data)
					{
							this.items = r.data.data;
							this.loadCompleted(this.items);
					}
						}).then(p=>{
						});
					},
		postItems(date) {
			var meta = { 
			};
			var filter = { take: this.take, skip: this.skip, filter: this.searchText, skipEmpty: true };
			return services.api.post(this, 
			(this.meta.endpoints.reload.endpoint ? this.meta.endpoints.reload.endpoint + (date? '/' + date : '') : (this.type + "/list")),
			meta, filter, true).then(r => {
				r.data.data.forEach(p=>{
					if(this.meta && this.meta.mapping){
						this.meta.mapping.forEach(m=>{
							p[m[0]] = "" + p[m[1]];
						});
					}
					if(!p.id)
					{
						p.id = p[this.type+'Id'];
					}
					p.action = { 						
						cycle_name: (p.active ? "Stop Polling": "Start Polling"), 
						cycle_class: (p.active ? "glyphicon glyphicon-pause": "glyphicon glyphicon-play")
					};
					p.selected = false;
					p.news = [];
				});
				if(r.data)
				{
						this.items = r.data;
						this.loadCompleted(this.items);
				}
					}).then(p=>{
					});
				},
		reload(alert) {
			alert.loading = true;
			var meta = {};
			var filter = {};
			services.api.get(this, "symbol/" + alert.symbolId + "/collect/" + moment(this.selectedDate).format('YYYY-MM-DD'),	meta, filter, true).then(r => {
				var date = this.filteredItems.find(p => r.data.symbolId == p.symbolId);
				date.loading = false;
				date.samples = 1;
			});
		},
		sortItems(column) {
			if(column == this.sortingBy)
			{
				this.sortingUp = !this.sortingUp;
			}
			else
			{
				this.sortingBy = column;
				this.sortingUp = true;
			}
		},
		updateCount(id, isSelected) {
            let item = this.items.find(function(elem) {
                return elem.id === id;
            });
            if (item) {
				item.selected = !item.selected;
				this.selectedItemsCount += isSelected ? 1 : -1;
            }
		},
		openDialog() {
			this.open = true;
		},
		close() {
			this.open = false;
		},
		handleScroll: function (event) {
			if(event.target.scrollHeight - event.target.scrollTop -  event.target.offsetHeight == 0 && !this.isMore && this.items.length % this.take === 0)
			{
				this.isMore = true;
				this.skip += this.take;
				this.getItems();
			}
		},
		selectItem: function(item) {
			// this.selectedItem = item;
		},
		editItem: function(item) {
			this.$emit('editItem', item);
			item.selected = true;
		},
		remove: function(item){
			var existentItem = null; 
			existentItem = this.items.find(p=>p.symbolId == item.symbol.symbolId);
			if(existentItem){
				existentItem.deleted = true;
			}
		},
		execute: function(item, action) {
			this.selectedItem = item;
			var options = action.action.substring(8);
			var type = options.split(' ')[0];
			var params = options.substring(options.indexOf(' ') + 1);
			switch(type){
				case 'each':						
					this[params] = !this[params];
					action.class = this[params] ? "glyphicon glyphicon-pause": "glyphicon glyphicon-play";
					action.name = this[params] ? "Stop " + action.name : action.name.substring(action.name.indexOf(' ') + 1);
					if(this["api_"+params]){
						if(action.action.indexOf(" collect") > 0){
							this.items.forEach(item => {
								this["api_"+params](item);
							});
						}
					}
					return;
				case 'cycle':						
					this[params] = !this[params];
					action.class = this[params] ? "glyphicon glyphicon-pause": "glyphicon glyphicon-play";
					action.name = this[params] ? "Stop " + action.name : action.name.substring(action.name.indexOf(' ') + 1);
					if(this[params]){
						if(action.action.indexOf(" isPooling") > 0){
							this.fetchItems(this.date);
						}
					}
					return;
				case 'request':
					var request = this.meta.endpoints[params];
					var that = this;
					var handler = params;
					if(request)
					{						
						var endpoint = request.endpoint;
						if(this.selectedItem){
							endpoint = endpoint.replace('{id}', this.selectedItem.id);
						}
						if(this.selectedDate){
							endpoint += '/' + moment(this.selectedDate).format('YYYY-MM-DD');
						}
						if(request.action == 'POST'){
							services.api.get(this, endpoint, null, false).then(p=>{
								that[request.params]();
							});
						}
						if(request.action == 'GET'){
							services.api.get(this, endpoint, false).then(p=>{
								if(p.data){
									that[handler](p.data);
								}
							}, this);
						}
					}
					return;
			}
			this.$emit('execute', action.action.substring(8), item);
		},
		
		addMonth: function () {
			var t = this;
			t.dateContext = moment(t.dateContext).add(1, 'month');
		},
		subtractMonth: function () {
			var t = this;
			t.dateContext = moment(t.dateContext).subtract(1, 'month');
		},
  }
});


export default {
	components: {
		OtbTable
	}
}