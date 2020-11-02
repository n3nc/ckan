this.ckan.module('hierarchical-group-main', function() {
	let app = null;

	let main = {
		template: `
			<div class="row row2 box" style="padding: 20px; margin-left: 0px; margin-right: 0px; margin-top: -10px" ref="cradle">
				<div style="display: none; align-items: center; justify-content: flex-end; width: 100%; padding-bottom: 20px;">
					<label for="field-display-mode">보기 모드</label>
					<select id="field-display-mode" name="display_mode" v-model="display_mode" class="form-control" style="width: 15%">
						<option value="group">그룹 보기</option>
						<option value="list">리스트 보기</option>
					</select>
				</div>
				<div v-if="display_mode=='list' && groups.length != 0">
					<ul class="media-grid" style="position: relative;" :style="{'height':(Math.ceil(groups.length/item_column_count)*238+'px')}">
						<li class="media-item"
							:style="{'left': ((idx%item_column_count)*193)+'px', 'top': (15+Math.floor(idx/item_column_count)*204)+'px'}"
							style="position: absolute;"
							v-for="(g, idx) in groups"
							:key="g.name"
						>
							<img :src="g.image_url" :alt="g.name" class="img-responsive media-image">
							<h3 class="media-heading">{{g.title}}</h3>
							<span class="count">{{ g.group?((g.group.title || g.group.name) +' > ' + g.title):g.title }}</span><br>
							<span><strong>{{ g.package_count + ' 데이터셋' }}</strong></span>
							<a :href="'/group/'+g.name" :title="g.title + ' 보기'" class="media-view"><span>{{g.title + ' 보기'}}</span></a>
						</li>
					</ul>
				</div>
				<div v-else-if="groups.length != 0">
					<div style="display: flex;">
						<div v-for="c in categories" key="'tab-'+c.id"
							style="position:relative; height: 2.5em; width: 8em; 
							background-color: #fbfbfb; 
							text-align: center; 
							line-height: 2em; 
							cursor: pointer;"
							:style="(currentTab==c.name)?{'background-color': '#f3f3f3', 'border':'1px solid #dddddd'}:{'background-color': '#fdfdfd', 'border':'1px solid #fdfdfd'}"
						>
							<span>
								{{ c.title || c.name }}
							</span>
							<a href="#" :title="c.title" class="media-view" @click="doSelectTab(c.name)"></a>
						</div>
					</div>
					<ul class="media-grid" style="position: relative;" :style="{'height':(Math.ceil(categories[currentTab].children.length/item_column_count)*213+'px')}">
						<template v-if="categories[currentTab]">
							<li class="media-item" 
								:style="{'left': ((idx%item_column_count)*193)+'px', 'top': (15+Math.floor(idx/item_column_count)*194)+'px'}" 
								style="position: absolute;" 
								v-for="(g, idx) in categories[currentTab].children" 
								:key="g.name"
							>
								<img :src="g.image_url" :alt="g.title" class="img-responsive media-image">
								<h3 class="media-heading">{{g.title}}</h3>
								<span><strong>{{ g.package_count + ' 데이터셋' }}</strong></span>
								<a :href="'/group/'+g.name" :title="g.title + ' 보기'" class="media-view"><span>{{g.title + ' 보기'}}</span></a>
							</li>
						</template>
					</ul>
				</div>
			</div>
		`,
		data() {
			return {
				groups: [],
				display_mode: 'group',
				categories: {},
				currentTab: '',
				item_column_count: 4 
			}
		},
		methods: {
			doSelectTab(name) {
				console.log(name);
				this.currentTab = name;
				localStorage.setItem('currentTab', name);
			},
			updateData() {
				for(g of this.$root.groups) {
					console.log('G:', g);
					const group = (g.extras.length != 0 && g.extras[0].key == 'parent' )?g.extras[0].value: null;
	
					if (!group || group == '__root__')
					{
						if ( !(g.name in this.categories)) {
							this.categories[g.name] = {
								name: g.name,
								id: g.id,
								title: g.display_name,
								group: null,
								package_count: 0,
								image_url: g.image_display_url || '/base/images/placeholder-group.png',
								children: []
							}
						} else {
							this.categories[g.name].name = g.name;						
							this.categories[g.name].id = g.id;
							this.categories[g.name].title = g.display_name;
							this.categories[g.name].group = null;
							this.categories[g.name].package_count = 0;
							this.categories[g.name].image_url = g.image_display_url || '/base/images/placeholder-group.png';
					}
					} else {
						if ( group && !(group in this.categories)) {
							this.categories[group] = {
								name: group,
								children: []
							}
						}
						this.categories[group].children.push({
							id: g.id,
							name: g.name,
							title: g.display_name,
							group: this.categories[group],
							package_count: g.package_count,
							image_url: g.image_display_url || '/base/images/placeholder-group.png'
						});
					}
				}

				for(ci in this.categories) {
					const c = this.categories[ci];
					this.groups.push(c);
					for(childi in c.children) {
						const child = c.children[childi];
						this.groups.push(child);
					}
				}

				console.log(this.groups);
				console.log(this.categories);

			}
		},
		mounted() {
			const me = this;
			this.item_column_count = parseInt(this.$refs.cradle.offsetWidth / 193);
			this.currentTab = localStorage.getItem('currentTab');

			setTimeout(() => {
				me.updateData();
			}, 	100);

		}
	}

	return {
		options : {
			all: null,
			list: null
		},
		initialize: function () {
			const me = this;
			const groupasjson = this.options.all.replace(/: u\'/g, ':"').replace(/\'/g, '"').replace(/: False/g, ':false').replace(/: True/g, ':true');
			const selectedList = JSON.parse(this.options.list.replace(/u\'/g, '"').replace(/\'/g, '"').replace(/, False/g, ':false').replace(/, True/g, ':true'));
			const filterdList = JSON.parse(groupasjson).filter(x => selectedList.includes(x.name));
			app = new Vue({
				data() {
					return {
						sandbox: me.sandbox,
						groups: filterdList
					}
				},
				el: this.el[0],
				components: {
					'vue-main': main
				}
			});
		}
    }
});
