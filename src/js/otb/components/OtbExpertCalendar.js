import services from "./../services/index.js"

window.Event = new Vue();

// 
const OtbTable = Vue.component("otb-expert-calendar", {
  props: ["heading", "message", "onConfirm", "type", "meta", "baseObject", "isMobile"]
});


export default {
	components: {
		OtbTable
	}
}