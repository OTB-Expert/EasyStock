import services from "./../services/index.js"
import { createChart } from './../../../lib/lightweight-charts/lightweight-charts.esm.development.js';
import { bindToDevicePixelRatio } from './../../../lib/fancy-canvas/coordinate-space.js';


window.Event = new Vue();

// 
const OtbTable = Vue.component("otb-expert-chart", {
  props: ["heading", "message", "onConfirm", "type", "meta", "isMobile"],
  template: `
  <div class="v-data-table theme--light">
	<div class="v-data-table__wrapper" style="" v-on:scroll.passive="handleScroll($event)">
	
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

    <table class="mobile-table">
            <tr v-for="(symbol, index) in filteredSymbols" v-bind:key="symbol.SymbolId">
            <td v-if="!isMobile" height="100">
			  <h5> {{ symbol.SymbolName }} <span v-if="!isMobile"> ({{ symbol.SymbolId }}) {{ lastRequest }} </span> </h5>
			  
				<span v-if="meta && meta.actions">
					<span v-for="(action, actionIndex) in meta.actions" :key="actionIndex">
						<span v-if="!isMobile || action.isMobile" :class="action.boxClass">
							<a 
								:title="action.name" 
								v-bind:class="action" 
								:class="action.linkClass"
								:href="action.link ? action.link : '#'" 
								v-on:click="action.action ? execute(symbol, action) : $parent.setPage"
								><i :class="action.class"></i> {{ action.name }}</a>
						</span>
					</span>
				</span>

              <div :id="'graph_03_' + symbol.SymbolId" 
              v-show="true && show(3, index)"
              class="graphGridItem_03"
              ></div>
              <div class="graphGridItem_03 missing" v-if="false && (!filteredItems_03[index] || !filteredItems_03[index].Intraday || !filteredItems_03[index].Intraday.length)"> 
                <span v-if="symbol.loading" class="action success">
                  <img class="loader glyphicon" v-if="symbol.loading" src="./js/otb/img/loading-red.svg" alt="loading"/>
                </span>					
                <i v-if="(!filteredItems_03[index] || !filteredItems_03[index].Intraday.length) && !symbol.loading" v-on:click="api_collect(filteredItems_03[index])" class="glyphicon glyphicon-refresh"> Reload for {{ date_03 }}</i>
              </div>
            </td>
            <td v-if="!isMobile" height="100">
			  <h5> {{ symbol.SymbolName }} ({{ symbol.SymbolId }})  
				<span v-if="filteredItems_02[index] && filteredItems_02[index].Intraday">{{filteredItems_02[index].Intraday.length}}</span>
				</h5>
              <div :id="'graph_02_' + symbol.SymbolId"  
              v-show="true && show(2, index)"
              class="graphGridItem_02"
              ></div>
              <div class="graphGridItem_02 missing" v-if="false && (!filteredItems_02 || !filteredItems_02[index] || !filteredItems_02[index].Intraday || !filteredItems_02[index].Intraday.length)"> 
                <span v-if="symbol.loading" class="action success">
                  <img class="loader glyphicon" v-if="symbol.loading" src="./js/otb/img/loading-red.svg" alt="loading"/>
                </span>					
                <i v-if="(!filteredItems_02[index] || !filteredItems_02[index].Intraday.length) && !symbol.loading" v-on:click="reload(filteredItems_02[index])" class="glyphicon glyphicon-refresh"> Reload for {{ date_02 }}</i>
              </div>
            </td>
            <td height="100">
				<h5> {{ symbol.SymbolName }}
					<span v-if="!isMobile">
						({{ symbol.SymbolId }}) 		  
						<span v-if="filteredItems_01[index] && filteredItems_01[index].Intraday">{{filteredItems_01[index].Intraday.length}}</span>
					</span>	
					
			  
				<span v-if="meta && meta.actions">
					<span v-for="(action, actionIndex) in meta.actions" :key="actionIndex">
						<span v-if="!isMobile || action.isMobile" :class="action.boxClass">
							<a 
								:title="action.name" 
								v-bind:class="action" 
								:class="action.linkClass"
								:href="action.link ? action.link : '#'" 
								v-on:click="action.action ? execute(symbol, action) : $parent.setPage"
								><i :class="action.class"></i> <span v-if="!isMobile">{{ action.name }}</span></a>
						</span>
					</span>
				</span>				

				</h5>
				
				<span v-show="isGraph">
				
			  <div 
				:id="'graph_01_' + symbol.SymbolId"  
				v-show="true && show(1, index)"
				:class="isMobile ? 'graphGridItem_mobile' : 'graphGridItem_01'"
			  ></div>
			  
				</span>
			  <div 
				:class="isMobile ? 'graphGridItem_mobile' : 'graphGridItem_01'"
				class="missing"
				v-if="false && (!filteredItems_01 || !filteredItems_01[index] || !filteredItems_01[index].Intraday || !filteredItems_01[index].Intraday.length)"
			  > 
                <span v-if="symbol.loading" class="action success">
                  <img class="loader glyphicon" v-if="symbol.loading" src="./js/otb/img/loading-red.svg" alt="loading"/>
                </span>					
                <i v-if="(!filteredItems_01[index] || !filteredItems_01[index].Intraday.length) && !symbol.loading" v-on:click="reload(filteredItems_01[index])" class="glyphicon glyphicon-refresh"> Reload for {{ date_01 }}</i>
			 
				
				</div>
            </td>
            </tr>
      </table>
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
		simulate: false,
		items_news: [],
		init_01: [],
		last_01: [],
		debug: true,
		isPolling: true,
		isGraph: true,
		// isMobile: true,
		randomSeed: 0,
		charts_01: [],
		series_01: [],
		date_01: null,
		date_02: null,
		date_03: null,
		last_items_01: [],
		last_items_02: [],
		last_items_03: [],
		items_01: [],
		items_02: [],
		items_03: [],
		take: 20,
		skip: 0,
		searchTerm: null,
		sortingBy: null,
		sortingUp: null,
		searchText: "",
		selectedItemsCount: 0,
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

		virtualItems: [],
		
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
		// initialDate.setDate(initialDate.getDate() - 1);
		this.date_01 = moment(initialDate).format('YYYY-MM-DD');
		initialDate.setDate(initialDate.getDate() - 1);
		while(initialDate.getDay() == 6 || initialDate.getDay() == 0)
		{
			initialDate.setDate(initialDate.getDate() - 1);
		}
		this.date_02 = moment(initialDate).format('YYYY-MM-DD');
		initialDate.setDate(initialDate.getDate() - 1);
		while(initialDate.getDay() == 6 || initialDate.getDay() == 0)
		{
			initialDate.setDate(initialDate.getDate() - 1);
		}
		this.date_03 = moment(initialDate).format('YYYY-MM-DD');
		this.fetchItems("01", this.date_01);
		this.fetchItems("02", this.date_02);
		this.fetchItems("03", this.date_03);
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
		getLast(){
			return (value) => { 
				return value;
			}
		},
		getIds(){
			return () => { 
				return this.items_01.map(s => {
					return s.id;
				  })
				  .join();
			}
		},
		getPercentage(){
			return (index) => { 
				var c = index;
				var init = this.init_01[index];
				var last = this.last_01[index];
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
          // that.updateCharts(item.SymbolName, item.Intraday)
      })
    },
    show(){
      return (collectionIndex, index) => {
		  if(this.filteredItems_02[index].deleted){ return false; }
        switch(collectionIndex)
        {
          case 1:
            return this.items_01[index] && this.items_01[index].Intraday && this.items_01[index].Intraday.length
            break;
          case 2:
            return this.items_02[index] && this.items_02[index].Intraday && this.items_02[index].Intraday.length
            break;
          case 3:
            return this.items_03[index] && this.items_03[index].Intraday && this.items_03[index].Intraday.length
            break;
        }
      }
    },
		getTicks(){
			return date => this.item ? this.items.find(p=>p.date.indexOf('-' + date + 'T') > -1) ?  this.items.find(p=>p.date.indexOf('-' + date + 'T') > -1).samples : null : null;
		},
    filteredSymbols() {
			var searchTerm = this.searchText.toLowerCase();
      return this.items_02.filter(item => {
        if(this.items_01) return !item.deleted && (!searchTerm 
            || (item.name && item.name.toLowerCase().includes(searchTerm))
            || (item.name && item.name.toLowerCase().includes(searchTerm)));
        if(this.items_02) return !item.deleted && (!searchTerm 
            || (item.name && item.name.toLowerCase().includes(searchTerm))
            || (item.name && item.name.toLowerCase().includes(searchTerm)));
        if(this.items_03) return !item.deleted && (!searchTerm 
            || (item.name && item.name.toLowerCase().includes(searchTerm))
            || (item.name && item.name.toLowerCase().includes(searchTerm)));
        return true;
      });
    },
    filteredItems_01() {
			var searchTerm = this.searchText.toLowerCase();
      return this.items_01.filter(item => {
          return !this.items_01 || !searchTerm 
              || (item.name && item.name.toLowerCase().includes(searchTerm))
              || (item.name && item.name.toLowerCase().includes(searchTerm))
      });
    },
    filteredItems_02() {
			var searchTerm = this.searchText.toLowerCase();
      return this.items_02.filter(item => {
          return !this.items_02 || !searchTerm 
              || (item.name && item.name.toLowerCase().includes(searchTerm))
              || (item.name && item.name.toLowerCase().includes(searchTerm))
      });
    },
    filteredItems_03() {
			var searchTerm = this.searchText.toLowerCase();
      return this.items_03.filter(item => {
          return !this.items_03 || !searchTerm 
              || (item.name && item.name.toLowerCase().includes(searchTerm))
              || (item.name && item.name.toLowerCase().includes(searchTerm))
      });
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
    	updateCharts(collectionIndex, symbol, data, index){
      if(!symbol.Intraday || symbol.Intraday.length === 0)
      {
        return;
	  }
	  var element = document.getElementById("graph_0" + collectionIndex + "_" + symbol.SymbolId);
	  if(!element || window.getComputedStyle(element).display !== 'block')
	  {
        return;
	  }
      if(collectionIndex == 1){	
		  var gIndex = index;	 
			if(this.series_01[gIndex]) {
				if(this.items_01[gIndex].Intraday.length < data.length)
				{
					for(var i = this.items_01[gIndex].Intraday.length; i < data.length; i++)
					{
						if(this.isGraph){
							this.series_01[gIndex].update(data[i]);
						}
						this.last_01[index] = data[data.length - 1].value;
						this.items_01[gIndex].Intraday.push(data[i]);
						this.charts_01[index].timeScale().fitContent();
					}
				}
			}
		  	else{
				this.init_01.push(data[0].value);
				this.last_01.push(data[0].value);
				this.items_01[index].Intraday = data;
			  if(!this.isGraph)
			  {
				  // return;
			  }
				var chart_01 = createChart("graph_01_" + symbol.SymbolId, { height: 200, width: (this.isMobile ? window.innerWidth - 30 :400) });
				const lineSeries_01 = chart_01.addLineSeries  ({          
				price: 39.0,
				color: 'red',
				lineWidth: 2,
				axisLabelVisible: false,
				});	
				lineSeries_01.setData(data);
				this.charts_01.push(chart_01);
				this.series_01.push(lineSeries_01);
				
						
				chart_01.applyOptions({	
					handleScroll: {
						mouseWheel: true,
						pressedMouseMove: true,
					},
					handleScale: {
						axisPressedMouseMove: false,
						mouseWheel: true,
						pinch: false,
					},
				});
			}
      }
      
      if(collectionIndex == 2){
        const chart_02 = createChart("graph_02_" + symbol.SymbolId, { height: 200, width: 400 });
        const lineSeries_02 = chart_02.addLineSeries({          
          price: 39.0,
          color: 'blue',
          lineWidth: 2,
          axisLabelVisible: false,
        });
        lineSeries_02.setData(data);
      }
      
      if(collectionIndex ==3){
        const chart_03 = createChart("graph_03_" + symbol.SymbolId, { height: 200, width: 600 });
        const lineSeries_03 = chart_03.addLineSeries({          
          price: 39.0,
          color: 'green',
          lineWidth: 2,
          axisLabelVisible: false,
        });
        lineSeries_03.setData(data);
      }
    },
		loadCompleted(index, items){
      var collectionIndex = index;          
      var that = this;              
      items.forEach( function(item, index){
        // that.alerts.push(item.SymbolName);
        that.$forceUpdate();
		var current_datetime = new Date();
          item.Intraday = item.Intraday.map((val, index) => {
            // var current_datetime = new Date(val[0] * 1000);
            current_datetime.setDate(current_datetime.getDate() + 1 );
            let formatted_date = current_datetime.getFullYear() + "-" + ((current_datetime.getMonth() + 1) < 10 ? '0': '') + (current_datetime.getMonth() + 1) +  (current_datetime.getDate() < 10 ? "-0" : '-') + current_datetime.getDate();// + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds() 
            return {
              time: formatted_date, 
              value: val[1]
              };
          }, this);
          that.$nextTick(() => {
            that.updateCharts(collectionIndex, item, item.Intraday, index);
          });
	  });
	},
	addRandom(collectionName, date, context = null) {
		if(!this.items_01)
		{
			return;
		}
		this.randomSeed += 1;
		var item = this.items_01[0];
		
		item.Intraday.push({"time":{"day": this.randomSeed,"month":4,"year":2020},"value": 10*this.randomSeed});
		this.updateCharts(1, item, item.Intraday, 1);
	},
	fetchItems(collectionName, date, context = null) {
			if(context && !this.isPolling && collectionName == '01')
			{
				return;
			}
			if(!context)
			{
				context = this;
			}
			if(this.meta && this.meta.endpoints && this.meta.endpoints.reload.endpoint && this.meta.endpoints.reload.action == 'POST')
			{
				this.postItems(collectionName, date);
			}
			else
			{
				this.getItems(collectionName, date);
			}
			if(this.isPolling && collectionName == '01'){
				this.lastRequest = new Date();
				setTimeout(function(){ context.fetchItems(collectionName, date, context); }, this.debug ? 5000: 10000);
				// setInterval(function(){ context.addRandom(collectionName, date, context); }, 1000);
			}
		},
		getItems(collectionName, date) {
      var meta = { 
        collection: "items_" + collectionName, 
        loading: "isLoading_" + collectionName 
      };
	  		var ids = this.getIds();
			services.api.get(this, 
			(this.meta.endpoints.reload.endpoint ? this.meta.endpoints.reload.endpoint + date + (false && ids.length > 0 ? ('/' + ids) : '') : (this.type + "/list")), meta).then(r => {
				r.data.forEach(p=>{
					if(this.meta && this.meta.mapping){
						this.meta.mapping.forEach(m=>{
							p[m[0]] = "" + p[m[1]];
						});
					}
					if(!p.id)
					{
						p.id = p[this.type+'Id'];
						p.deleted = false;
					}
					p.selected = false;
        });
		if(r.data)
		{
			switch(r.data[0].Date.substring(0, 10)){
			case this.date_01:
				if(this.debug)
				{
					r.data.forEach((item, index) => {
						if(!this.items_01[index])
						{
							this.items_01[index] = { 
								id: item.SymbolId,
								SymbolName: item.SymbolName,
								Date: item.Date,
								SymbolId: item.SymbolId,
								Intraday: [ item.Intraday[0] ]
							 };
						}
						var s = this.simulate ? 1 : 
						this.items_01[index].Intraday.length > 1 ? 2 : 
						item.Intraday.length > 3 ?
						3 : 4;

						item.Intraday = this.simulate ? item.Intraday.splice(0, this.items_01[index].Intraday.length + 1) : 
						this.items_01[index].Intraday.length > 1 ? item.Intraday.splice(0, this.items_01[index].Intraday.length + 1) : 
						item.Intraday.length > 3 ?
						item.Intraday.splice(0, item.Intraday.length - 3) : item.Intraday;
					});
				}
				this.loadCompleted(1, r.data);
				break;
			case this.date_02:
				this.items_02 = r.data;
				this.loadCompleted(2, this.items_02);
				break;
			case this.date_03:
				this.items_03 = r.data;
				this.loadCompleted(3, this.items_03);
				break;
			}
		}
			}).then(p=>{
			});;
		},
		postItems(collectionName) {
			var meta = {};
			var filter = { take: this.take, skip: this.skip, filter: this.searchTerm };
			services.api.post(this, 
			(this.meta.endpoints.reload.endpoint ? this.meta.endpoints.reload.endpoint : (this.type + "/list")),
			meta, filter, true).then(r => {
				r.data.forEach(p=>{
					if(this.meta && this.meta.mapping){
						this.meta.mapping.forEach(m=>{
							p[m[0]] = "" + p[m[1]];
						});
					}
					if(!p.id)
					{
						p.id = p[type+'Id'];
						p.deleted = false;
					}
					p.selected = false;
				});
				this.items = r.data;
			}).then(p=>{ 
				this.loadCompleted();
			});;
		},
		api_collect(alert) {
			alert.loading = true;
			var meta = {};
			var filter = {};
			services.api.get(this, "symbol/" + alert.SymbolId + "/collect/" + moment(alert.Date).format('YYYY-MM-DD'),	meta, filter, true).then(r => {
				var date = this.virtualItems.find(p => r.data == p.date);
				// date.loading = false;
				// date.samples = r.data.samples;
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
			existentItem = this.items_01.find(p=>p.SymbolId == item.symbol.symbolId);
			if(existentItem){
				existentItem.deleted = true;
			}
			existentItem = this.items_02.find(p=>p.SymbolId == item.symbol.symbolId);
			{				
				existentItem.deleted = true;
			}
			existentItem = this.items_03.find(p=>p.SymbolId == item.symbol.symbolId);
			{
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
							this.items_01.forEach(item => {
								this["api_"+params](item);
							});
						}
					}
					return;
				case 'cycle':						
					// if(this[params])
					{
						if(action.action.indexOf(" isPolling") > 0){
							this[params] = !this[params];
							action.class = this[params] ? "glyphicon glyphicon-pause": "glyphicon glyphicon-play";
							action.name = this[params] ? "Stop " + action.name : action.name.substring(action.name.indexOf(' ') + 1);
							this.fetchItems('01', this.date_01);
						}
						if(action.action.indexOf(" isMobile") > 0){
							this.isMobile = this.isMobile ? false : true;
							action.class = this.isMobile ? "glyphicon glyphicon-phone": "glyphicon glyphicon-fullscreen";
							action.name = this.isMobile ? "Desktop" : "Mobile";
						}
						if(action.action.indexOf(" isGraph") > 0){
							this.isGraph = this.isGraph ? false : true;
							action.class = this.isGraph ? "glyphicon glyphicon-table": "glyphicon glyphicon-stats";
							action.name = this.isGraph ? "Table" : "Monitor";
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