const VueTemp = new Vue({
    el: '#app',
    template:
        `<div id="app">
            <el-input placeholder="请输入swagger的 api-docs 地址查询数据" v-model="url" clearable class="swagger-url">
                <el-button slot="append" icon="el-icon-search" @click="searchUrlFn"></el-button>
            </el-input>
            <div class="result-block">
                <div class="left-block">
                    <div class="top-block">
                        <el-input placeholder="可搜索地址" v-model="searchTree" clearable class="search-tree">
                            <el-button slot="append" icon="el-icon-search" :disabled="!treeData.length" @click="searchTreeFn"></el-button>
                        </el-input>
                        <el-button type="success" plain icon="el-icon-plus" :disabled="!treeData.length" @click="addFn">加入右侧列表中</el-button>
                        <el-button type="primary" plain :disabled="!treeData.length" @click="allClickFn">全部导出</el-button>
                    </div>
                    <el-tree
                        class="lefe-tree"
                        ref="leftTree"
                        :data="treeData"
                        :props="defaultProps"
                        show-checkbox
                        node-key="defaultProps.id"
                        :filter-node-method="filterNode"
                        >
                    </el-tree>
                </div>
                <div class="right-block" v-show="treeData.length">
                    <div class="choose">
                        <el-switch v-model="isPrefix" active-text="接口添加变量前缀 URL"></el-switch>
                    </div>
                    <div class="handle-block">
                        <el-input placeholder="请输入生成的名称" v-model="filename" clearable >
                            <el-button slot="append" type="primary" plain @click="chooseClickFn">导出以下列表数据</el-button>
                        </el-input>
                        <el-button type="danger" plain :disabled="chooseNode.length == 0" @click="clearClickFn">清空列表</el-button>
                    </div>
                    <div class="choose-title">选中列表：</div>
                    <div class="list-block">
                        <p v-for="item in chooseNode" :key="item.id">{{item.name }}</p>
                    </div>
                </div>
            </div>
        </div>`,
    data: () => {
        return {
            url: "http://172.27.9.203:8483/v2/api-docs?group=%E9%BB%98%E8%AE%A4%E6%8E%A5%E5%8F%A3",
            searchTree: "",
            defaultProps: {
                children: "children",
                label: "name",
                id: "id"
            },
            treeData: [],
            isPrefix: true,
            filename: "",
            chooseNode: []
        }
    },
    methods: {
        searchUrlFn() {
            if (this.url) {
                const loading = this.$loading({
                    lock: true,
                    text: '数据处理中…',
                    spinner: 'el-icon-loading',
                    background: 'rgba(255, 255, 255, 0.9)'
                });
                this.resetAttr();
                $.ajax({
                    type: 'get',
                    url: 'http://localhost:8000/swaggerContent',
                    data: { path: this.url },
                    success: (data) => {
                        let { paths, tags } = data;
                        this.filterTreeData(paths, tags, loading);
                    },
                    error: function () {
                        loading.close();
                    }
                })
            }
        },
        filterTreeData(paths = {}, tags = [], loading) {
            // 匹配中文汉字和中文标点
            let rule = new RegExp(/[\u4e00-\u9fa5|\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/);
            let _tree = [];
            tags.forEach(el => {
                if (rule.test(el.name)) {
                    let _c = [];
                    for (let [key, value] of Object.entries(paths)) {
                        let _type = Object.keys(value)[0];
                        if (value[_type]?.tags[0] == el.name) {
                            _c.push({
                                id: key,
                                name: key + ' - ' + value[_type]?.summary,
                                method: _type,
                                summary: value[_type]?.summary,
                                consumes: value[_type]?.consumes || []
                            });
                        }
                    }
                    if (_c.length) {
                        _tree.push({
                            id: el.name,
                            name: el.name,
                            description: el.description,
                            children: _c
                        });
                    }

                }
            });
            this.treeData = [..._tree];
            loading.close();
        },
        searchTreeFn() {
            this.$refs.leftTree.filter(this.searchTree);
        },
        filterNode(value, data) {
            if (!value) return true;
            return data[this.defaultProps.label].indexOf(value) !== -1;
        },
        resetAttr() {
            this.searchTree = "";
            this.treeData = [];
            this.isPrefix = true;
            this.filename = "";
            this.chooseNode = [];
        },
        addFn() {
            this.chooseNode = [];
            let _node = this.$refs.leftTree.getCheckedNodes(true);
            if (_node.length) {
                this.chooseNode = _node;
            } else {
                this.$message.warning({
                    message: '请先勾选再加入',
                    showClose: true
                });
            }
        },
        chooseClickFn() {
            if (!this.filename) {
                this.$message.warning({
                    message: '请输入生成的文件名称',
                    showClose: true
                });
                return false;
            }
            if (!this.chooseNode.length) {
                this.$message.warning({
                    message: '请加入左侧数据再导出',
                    showClose: true
                });
                return false;
            }
            let _data = [
                {
                    id: new Date().getTime(),
                    name: this.filename,
                    description: this.filename,
                    children: this.chooseNode
                }
            ]
            this.createFn(_data);
        },
        allClickFn() {
            this.createFn(this.treeData);
        },
        clearClickFn() {
            this.chooseNode = [];
        },
        createFn(data) {
            let params = {
                isPrefix: this.isPrefix,
                list: JSON.stringify(data)
            }
            $.ajax({
                type: 'post',
                url: 'http://localhost:8000/createJs',
                data: params,
                success: (data) => {
                    this.$message.success({
                        message: '生成完毕！请在dist文件夹中查看',
                        showClose: true
                    });
                },
                error: function () {
                    console.log('error');
                }
            });
        }
    }
});
