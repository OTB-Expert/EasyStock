import services from "./../services/index.js"

window.Event = new Vue();

const OtbTable = Vue.component("otb-expert-last-news", {
  props: ["type", "meta", "selectedItem", "isMobile"]
});


export default {
	components: {
		OtbTable
	}
}