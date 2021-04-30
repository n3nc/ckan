this.ckan.module('treemap-chart', function() {
    let app = null;

    let datasets = {
        props:['data'],
        template: `
        <ul class="dataset-list list-unstyled">
            <li class="dataset-item" v-for="d in data">
                <div class="dataset-content">
                    <h3 class="dataset-heading">
                        <span class="dataset-private label label-inverse" v-if="d.private">
                        <i class="fa fa-lock"></i>
                        개인
                        </span>
                        <a style="" :href="'/dataset/'+d.name">{{d.title}}</a>
                    </h3>
                    <div v-if="d.notes" style="margin-bottom: 5px;">{{ d.notes }}</div>
		    <ul class="dataset-resources list-unstyled">
		    <li v-for="r in d.resources" :key="r.id" style="padding: 0px 2px;"><a class="label label-default" :data-format="r.format.toLowerCase()" :href="'/dataset/'+d.name">{{r.format}}</a></li>
		    </ul>
                    <p v-else class="empty">이 데이터셋의 설명이 없습니다</p>
                <ul class="dataset-resources list-unstyled">
                </ul>
            </li>
        </ul>
        `
    };

	let main = {
        template: `
        <div>
            <div class="row row2 box" style="padding: 20px 0px; margin-left: 0px; margin-right: 0px; margin-top: -10px; border: 0px;">
                    <div class="col-md-6 col1" style="padding: 0px;">
                        <div class="module-shallow box" style="border: 0px;">
                            <div height='560px' ref='wordcloud1' style="height: 560px;"></div>
                        </div>
                    </div>
                    <div class="col-md-6 col2" style="padding: 0px;">
                        <div class="module-shallow box" style="width: 100%; border: 0px;">
                            <div height='540px' ref='treemap1' style="width: 548px; height: 540px;"></div>
                        </div>
                    </div>
            </div>
            <div class="row row1 box" style="padding: 20px 0px; margin-left: 0px; margin-right: 0px; margin-top: 25px; margin-bottom: 100px; border: 0px;">
                    <div class="col-md-12 col1">
                        <div class="module-shallow box" style="padding: 35px; border: 0px;" v-if="selected">


<header class="module-content page-header" style="padding: 20px 35px; padding-bottom: 0px;">
	<ul class="nav nav-tabs">
		<li class="active"><a href="#"><i class="fa fa-sitemap"></i>{{(type=='groups')?selected.title:selected.name}}</a></li>
	</ul>
</header>
    <h2 style="padding-top: 30px; padding-bottom: 50px;">{{ package_count }}개 데이터셋이 있습니다.</h2>

    <datasets style="display:block;" :data="packages">

</datasets>
                        </div>
                    </div>
            </div>
        </div>
        `,
        data() {
            return {
                selected: null,
                package_count: 0,
                packages: null,
                type: 'groups'
            }
        },
        methods: {
            doSearch(q, type) {
                const me = this;
                this.type = type;
                console.log(q, type);
                this.$root.sandbox.client.call('GET', 'package_search', `?include_private=true&q=${type}:"${q}"`, function(d) {
                    me.package_count = d.result.count;
                    me.packages = d.result.results;
                });
            },
            getTextAttrs(cfg) {
                return {
                    ...cfg.defaultStyle,
                    ...cfg.style,
                    fontSize: cfg.data.size,
                    text: cfg.data.text,
                    textAlign: 'center',
                    fontFamily: cfg.data.font,
                    fill: cfg.color || cfg.defaultStyle.stroke,
                    textBaseline: 'Alphabetic'
                };
            },
            renderWordCloud() {
                const me = this;
                G2.registerShape('point', 'cloud', {
                    draw(cfg, container) {
                        const attrs = me.getTextAttrs(cfg);
                        const textShape = container.addShape('text', {
                        attrs: {
                            ...attrs,
                            x: cfg.x,
                            y: cfg.y
                        }
                        });
                        if (cfg.data.rotate) {
                        G2.Util.rotate(textShape, cfg.data.rotate * Math.PI / 180);
                        }
                        return textShape;
                    }
                });
                G2.registerInteraction('my-event2', {
                    start: [{ trigger: 'element:click', action: (c) => {
                      console.log(c);
                      if (c.event.data.data == null) return;
                      me.selected = c.event.data.data;
                      me.doSearch(c.event.data.data.name, 'tags');
                    } }],
                });
                console.log("tags original: ", this.$root.tags);
                let data = this.$root.tags.map(cur => ({display_name: cur.display_name.substring(0, 10), name: cur.name, value: cur.count}));
                console.log("tags", data);
                const dv = new DataSet.View().source(data);
                const range = dv.range('value');
                const min = range[0];
                const max = range[1];
                dv.transform({
                    type: 'tag-cloud',
                    fields: ['display_name', 'value'],
                    size: [600, 500],
                    font: 'Verdana',
                    padding: 0,
                    timeInterval: 5000, // max execute time
                    rotate() {
                        let random = ~~(Math.random() * 4) % 4;
                        if (random === 2) {
                        random = 0;
                        }
                        return random * 90; // 0, 90, 270
                    },
                    fontSize(d) {
                        if (d.value) {
                        return ((d.value - min) / (max - min)) * (60 - 24) + 24;
                        }
                        return 0;
                    }
                });
                const chart = new G2.Chart({
                    container: this.$refs.wordcloud1,
                    autoFit: true,
                    height: 500,
                    padding: 0
                });
                chart.data(dv.rows);
                chart.scale({
                    x: { nice: false },
                    y: { nice: false }
                });
                chart.legend(false);
                chart.axis(false);
                chart.coordinate().reflect();
		chart.tooltip(false);
                /*chart.tooltip({
                    showTitle: false,
                    showMarkers: false,
                    itemTpl:
                        '<li style="list-style: none;">' +
                        '<span style="background-color:{color};" class="g2-tooltip-marker"></span>' +
                        '{name}<br/>' +
                        '<span style="padding-left: 16px">Datasets：{value}</span><br/>' +
                        '</li>',
                    });*/

                chart.point()
                .position('x*y')
                .color('CornflowerBlue')
                .shape('cloud')
		.tooltip(false)

                /*.tooltip('name*value', (name, value) => {
                    return {
                        name,
                        value
                    }
                })*/
                chart.interaction('element-active');
                chart.interaction('my-event2');
                chart.render();
            }
        },
        mounted() {
            const me = this;
            mobiles = {}
	    console.log(JSON.stringify(this.$root.groups));
            for(g of this.$root.groups) {
                const group = (g.extras.length != 0 && g.extras[0].key == 'parent' )?g.extras[0].value: null;

                if (!group || group == '__root__')
                {
                    if ( !(g.name in mobiles)) {
                        mobiles[g.name] = {
                            name: g.name,
                            title: g.display_name,
                            id: g.id,
                            brand: g.display_name,
                            total: 0,
                            children: []
                        }
                    } else {
                        mobiles[g.name].name = g.name;
                        mobiles[g.name].title = g.display_name;
                        mobiles[g.name].id = g.id;
                        mobiles[g.name].brand = g.display_name;
                    }
                } else {
                    if ( group && !(group in mobiles)) {
                        mobiles[group] = {
                            name: group,
                            brand: group,
                            total: 0,
                            children: []
                        }
                    }
                    mobiles[group].children.push({
                        id: g.id,
                        name: g.name,
                        title: g.display_name,
                        group: mobiles[group],
                        value: g.package_count,
                        image_url: g.image_display_url || '/base/images/placeholder-group.png'
                    });
                    mobiles[group].total += g.package_count;
                }
            }

            for(const name of Object.keys(mobiles)) {
                if(mobiles[name].total == 0) delete mobiles[name];
            }

            //const sortedData = Object.values(mobiles);
            //sortedData.sort((v1, v2) => v2.total - v1.total);
	    sortedData = this.$root.groups.filter(x => x.extras[0].value=="grp-gov-kor").sort((v1, v2) => v2.package_count - v1.package_count).map(v => ({name: v.name, value: v.package_count, brand: v.display_name, title: v.display_name}));
            console.log("result: ", sortedData);
            const { DataView } = DataSet;
            const data = {
            name: 'root',
            children: sortedData,
            };
            const dv = new DataView();
            dv.source(data, {
            type: 'hierarchy',
            }).transform({
            field: 'value',
            type: 'hierarchy.treemap',
            tile: 'treemapResquarify',
            as: ['x', 'y'],
            });
            const nodes = [];
            for (const node of dv.getAllNodes()) {
                if (!node.children) {
                    const eachNode = {
                    name: node.data.name,
                    title: node.data.title,
                    x: node.x,
                    y: node.y,
                    depth: node.depth,
                    value: node.value,
                    };
                    if (!node.data.brand && node.parent) {
                    eachNode.brand = node.parent.data.brand;
                    } else {
                    eachNode.brand = node.data.brand;
                    }

                    nodes.push(eachNode);
                }
            }

            this.selected = nodes.find(x => x.value != 0);
            this.doSearch(this.selected.name, 'groups');

		/*
            const nodes2 = [];
            for (const node of dv.getAllNodes()) {
                if (node.data.name === 'root') {
                    continue;
                }
                if (node.children) {
                    const eachNode = {
                        name: node.data.name,
                        title: node.data.title,
                        x: node.x,
                        y: node.y,
                        value: node.value,
                    };

                    nodes2.push(eachNode);
                }
            }
	    */

            const chart = new G2.Chart({
                container: this.$refs.treemap1,
                autoFit: true,
                height: 500,
                padding: 0,
            });
            chart.coordinate().scale(1, -1);
            chart.data(nodes);
            chart.axis(false);
            chart.legend(false);
	    chart.tooltip(false);

            /*chart.tooltip({
            showTitle: false,
            showMarkers: false,
            itemTpl:
                '<li style="margin-bottom: 10px;">' +
                '<span>{title} : {value}</span><br/>' +
                '</li>',
            });*/

            class CustomLabel extends G2.GeometryLabel {
                render(m, u) {
                    console.log("geometry: ", this.geometry);
                    const labelItems = this.getLabelItems(m);
                    console.log("mu", m, u);
                    console.log("items", labelItems);
                    const total = m.reduce( (acc, cur) => cur._origin.value + acc, 0);
                    for(const idx in m) {
                        const origin = m[idx]._origin;
                        const value = origin.value / total;
                        const w = (m[idx].x[1] - m[idx].x[0]) - 30;
                        const h = (m[idx].y[0] - m[idx].y[2]) - 30;
                        labelItems[idx].x -= w/2;
                        labelItems[idx].y -= h/2;
                        labelItems[idx].style.fontSize=value * 20 + 10;
                        labelItems[idx].content = origin.title + "\r\n" + (value * 100).toFixed(1) + "%";
                    }

                    const labelsRenderer = this.getLabelsRenderer();
                    const shapes = this.getGeometryShapes();
                    labelsRenderer.render(labelItems, shapes, u);
                }
            }
            G2.registerGeometryLabel('custom', CustomLabel);

            /*const view2 = chart.createView({
                container: 'container',
                autoFit: true,
                height: 500,
                padding: 0,
              });

              view2.data(nodes2);

              view2.axis(false);
              view2.legend(false);
              view2.tooltip(false);
              view2
              .polygon()
              .position('x*y')
              .style({
                  lineWidth: 1,
                  stroke: '#fff',
              })
              .label('name', {
                  type: "custom",
                  offset: 0,
                  style: {
                  textBaseline: 'top',
                  textAlign: 'left',
                  fontSize: 40
                  }
                });*/

            chart
            .polygon()
            .position('x*y')
            .color('brand')
	    .tooltip(false)

            /*.tooltip('name*value*title', function(name, value, title) {
                return {
                title,
                name,
                value,
                };
            })*/
            .style({
                lineWidth: 1,
                stroke: '#fff',
            })
            .label(
                'brand',
                {
		type: "custom",
                offset: 0,
                style: {
		    textBaseline: 'top',
		    textAlign: 'left',
		    fontSize: 40
                },
                layout: {
                    type: 'limit-in-shape'
                }
                }
            );
            G2.registerInteraction('my-event', {
                start: [{ trigger: 'element:click', action: (c) => {
                  console.log(c);
                  if (c.event.data.data) me.selected = c.event.data.data;
                  else return;
                  me.doSearch(me.selected.name, 'groups');
                } }],
            });
            chart.interaction('element-active');
            chart.interaction('my-event');
            chart.render();

            this.renderWordCloud();
        },
        components: {
            'datasets': datasets
        }
    };

	return {
		options : {
            all: null
		},
		initialize: function () {
            const me = this;
            console.log(this.options.all);
            const groupasjson = this.options.all.replace(/: u\'/g, ':"').replace(/\'/g, '"').replace(/: False/g, ':false').replace(/: True/g, ':true');
            const groups = JSON.parse(groupasjson);
            let tags = [];
            this.sandbox.client.call("GET", "package_search", "?include_private=true&facet.field=[%22tags%22]&rows=0", (d) => {
                console.log(d);
                tags = d.result.search_facets.tags.items;
                app = new Vue({
                    data() {
                        return {
                            sandbox: me.sandbox,
                            groups: groups,
                            tags: tags
                        }
                    },
                    el: this.el[0],
                    components: {
                        'vue-main': main
                    }
                });
            });
		}
    }
});
