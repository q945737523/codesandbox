<template>
  <div id="app">
    <div class="flex container">
      <div class="side">
        <div class="side-title">• 123</div>
        <div
          class="side-item"
          v-for="(item, index) in leftSide"
          :key="index"
          @mousedown="handleDrag(item, $event)"
        >
          {{ item.title }}
        </div>
      </div>
      <div class="main">
        <div class="tool">
          <div class="tool-btn" @click="handleSave">保存</div>
          <div class="flex magnifier" v-show="saveNodes.length">
            <img
              class="m-btn"
              @click="handleZoom('min')"
              src="./assets/image/min.png"
            />
            <div class="m-text">{{ zoom }}%</div>
            <img
              class="m-btn"
              @click="handleZoom('plus')"
              src="./assets/image/plus.png"
            />
          </div>
        </div>
        <div id="drag-container"></div>
        <div class="main-none-box" v-show="!saveNodes.length">
          <div class="flex main-none">
            <img src="@/assets/image/none.png" alt="" />
            <div class="none-tip">暂无内容，请进行条件拖拽</div>
          </div>
        </div>
      </div>
      <div class="side">
        <div class="side-title">• 456</div>
        <div
          class="side-item"
          v-for="(item, index) in leftSide"
          :key="index"
          :class="{ disabled: !saveNodes.length }"
          @mousedown="handleDrag(item, $event, 'weidu')"
        >
          {{ item.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "@antv/x6-vue-shape";
import Drag from "@/components/drag/drag.vue";
import Item from "@/components/drag/item.vue";
import { Graph, Line, Path, Curve, Addon } from "@antv/x6";

export default {
  data() {
    return {
      graph: null,
      dnd: null,
      waitEdgeNodes: [], // 用于连线
      selectLine: [], // 记录选择的edge
      createChildren: [],
      leftSide: [
        {
          title: "1",
        },
        {
          title: "2",
        },
        {
          title: "3",
        },
        {
          title: "4",
        },
        {
          title: "5",
        },
        {
          title: "6",
        },
      ],
      zoom: 100, // 缩放比例
      saveNodes: [], // 用于保存
      firstNode: null,
    };
  },
  mounted() {
    this.init();
  },
  beforeDestroy() {
    // 销毁
    this.graph.dispose();
  },
  methods: {
    init() {
      const that = this;
      // 创建画布
      this.graph = new Graph({
        container: document.getElementById("drag-container"),
        keyboard: true,
        scroller: {
          enabled: true,
          pannable: true, // 是否启用画布平移能力
        },
        selecting: {
          enabled: true,
          filter(node) {
            // 只选连接线(边)
            return that.graph.isEdge(node);
          },
        },
        translating: {
          restrict(view) {
            const cell = view.cell;
            if (cell.isNode()) {
              const parent = cell.getParent();
              if (parent) {
                // 限制子节点不能移动
                return {
                  x: cell.getBBox().x,
                  y: cell.getBBox().y,
                  width: 0,
                  height: 0,
                };
              }
            }
            return null;
          },
        },
      });
      // 连线规则，圆弧
      Graph.registerConnector(
        "smooth",
        (sourcePoint, targetPoint, routePoints, options) => {
          const line = new Line(sourcePoint, targetPoint);
          const diff = 5;
          const factor = 1;
          const vertice = line
            .pointAtLength(line.length() / 2 + 12 * factor * Math.ceil(diff))
            .rotate(90, line.getCenter());

          const points = [sourcePoint, vertice, targetPoint];
          const curves = Curve.throughPoints(points);
          const path = new Path(curves);
          return options.raw ? path : path.serialize();
        },
        true
      );
      // 选择连接线(边)事件  added是一个数组，当前选择的cell。  removed是一个数组，当前要取消选择的cell
      this.graph.on("selection:changed", ({ added, removed }) => {
        this.selectLine = added;
        added.forEach((cell) => {
          const args = { size: 15 };
          cell.setAttrs({
            line: {
              sourceMarker: {
                args,
                name: "block",
              },
              targetMarker: {
                args,
                name: "block",
              },
              stroke: "#2D8CF0",
              strokeWidth: 4,
            },
          });
        });
        removed.forEach((cell) => {
          const args = { size: 8 };
          cell.setAttrs({
            line: {
              sourceMarker: {
                args,
                name: "block",
              },
              targetMarker: {
                args,
                name: "block",
              },
              stroke: "#666",
              strokeWidth: 1,
            },
          });
        });
      });
      // 监听键盘删除键，删除连接线(边)
      this.graph.bindKey(["Backspace", "Delete"], (e) => {
        if (this.selectLine.length) {
          this.$confirm("确认删除连线吗?", "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }).then(() => {
            this.selectLine[0].remove();
            this.$message({
              type: "success",
              message: "删除成功!",
            });
          });
        }
      });
      // 拖拽
      this.dnd = new Addon.Dnd({
        target: this.graph,
        scaled: false,
        animation: true,
        getDropNode: that.handleEndDrag, // 拖拽结束
      });
      // 注册父组件
      Graph.registerVueComponent(
        "Drag",
        {
          template: '<drag @parentnoderemove="parentnoderemove"></drag>',
          methods: {
            parentnoderemove({ id }) {
              // 删除对应的节点
              that.saveNodes.splice(
                that.saveNodes.findIndex((item) => item.id === id),
                1
              );
            },
          },
          components: {
            Drag,
          },
        },
        true
      );
      // 注册子组件
      Graph.registerVueComponent(
        "Item",
        {
          template: '<item @edge="edge"></item>',
          methods: {
            edge: that.edge,
          },
          components: {
            Item,
          },
        },
        true
      );
      const json = JSON.parse(localStorage.getItem("test"));
      json && this.graph.fromJSON(json);
      json &&
        (this.saveNodes = this.graph
          .parseJSON(json)
          .filter((item) => item.component === "Drag"));
    },
    // 开始拖拽
    handleDrag(item, e, weidu) {
      if (weidu && !this.saveNodes.length)
        return this.$message.error("第一个必须是统计对象");
      // item请求。。
      this.createChildren = [1, 2, 3];
      this.handleCreateNode(item, e);
    },
    // 两个node之间连线
    edge(node) {
      // console.log('node', node.id)
      // console.log('AllEdges', this.graph.getEdges(node))
      const allEdges = this.graph.getEdges(node);
      this.waitEdgeNodes.push(node);
      if (this.waitEdgeNodes.length === 2) {
        // 改变active状态
        this.$store.dispatch(
          "callNodes",
          this.waitEdgeNodes.map((item) => item.id)
        );
        // 判断不是同一父级
        if (
          this.waitEdgeNodes.reduce(
            (acc, cur) => acc._parent.id !== cur._parent.id
          )
        ) {
          // 要连线的目标id和来源id
          const allTargetAndAllSource = allEdges.map((item) => [
            item.getTargetCellId(),
            item.getSourceCellId(),
          ]);
          const flag = allTargetAndAllSource.filter((item) =>
            this.waitEdgeNodes.every((ele) => item.includes(ele.id))
          );
          // 如果两个点已经连过线,
          if (flag.length) return (this.waitEdgeNodes.length = 0);
          const anchorFlag =
            this.waitEdgeNodes[0].getBBox().x <
            this.waitEdgeNodes[1].getBBox().x;
          const sourceAnchor = anchorFlag ? "right" : "left";
          const targetAnchor = anchorFlag ? "left" : "right";
          // 设置箭头的大小
          const args = {
            size: 8,
          };
          this.graph.addEdge({
            source: {
              cell: this.waitEdgeNodes[0],
              anchor: sourceAnchor,
              connectionPoint: "anchor",
            },
            target: {
              cell: this.waitEdgeNodes[1],
              anchor: targetAnchor,
              connectionPoint: "anchor",
            },
            connector: { name: "smooth" },
            attrs: {
              line: {
                strokeDasharray: "5 5",
                stroke: "#666",
                strokeWidth: 1,
                sourceMarker: {
                  args,
                  name: "block", // 实心箭头
                },
                targetMarker: {
                  args,
                  name: "block",
                },
              },
            },
          });
        }
        // 无论如何都清空
        this.waitEdgeNodes.length = 0;
      }
    },
    handleCreateNode(item, e) {
      const that = this;
      const parent = this.graph.createNode({
        shape: "vue-shape",
        x: 100,
        y: 100,
        height: that.createChildren.length * 60 + 58,
        data: {
          item,
          height: that.createChildren.length * 60 + 58,
        },
        component: "Drag",
      });
      // 开始拖拽
      this.dnd.start(parent, e);
    },
    // 拖拽结束，渲染节点之前，必须返回克隆的节点
    handleEndDrag(node) {
      const cloneNode = node.clone({ deep: true });
      const that = this;
      // 父节点渲染之后再执行，因为需要父节点的位置
      this.$nextTick(() => {
        console.log("getCellCount", that.graph.getCellCount());
        const { x, y } = cloneNode.position();
        // 是否第一个节点（父节点）
        const cellCount = that.graph.getCellCount();
        this.createChildren.forEach((item, index) => {
          const child = this.graph.addNode({
            shape: "vue-shape",
            x: x + 20,
            y: index === 0 ? y + 58 : y + (index * 60 + 58),
            width: 240,
            height: 46,
            data: {
              item,
            },
            component: "Item",
          });
          cloneNode.addChild(child);
        });
        this.saveNodes.push(cloneNode);
      });
      return cloneNode;
    },
    // 缩放
    handleZoom(type) {
      if (this.zoom === 20 && type === "min") return;
      this.zoom = type === "min" ? this.zoom - 20 : this.zoom + 20;
      this.graph.zoom(type === "min" ? -0.2 : 0.2);
    },
    handleSave() {
      const data = JSON.stringify(this.graph.toJSON({ deep: true }));
      console.log("this.gra", data);
      localStorage.setItem("test", data);
      this.$message.success("保存成功");
    },
  },
};
</script>

<style>
* {
  box-sizing: border-box;
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
<style lang="scss" scoped>
.flex {
  display: flex;
  align-items: center;
}
.container {
  align-items: flex-start;
  width: 100%;
  height: calc(100vh - 60px);
  padding: 20px;
  background-color: #F3F5F8;
  box-sizing: border-box;
  .side {
    width: 232px;
    height: 100%;
    padding: 26px 20px 0;
    background-color: #fff;
    overflow-y: auto;
    .side-title {
      margin-bottom: 24px;
      font-size: 18px;
      color: #2D8CF0;
    }
    .side-item {
      height: 50px;
      line-height: 50px;
      text-align: center;
      margin-bottom: 20px;
      background-color: #F9FAFC;
      border-radius: 10px;
      border: 1px solid #D4DAE3;
      box-shadow: 0 2px 6px 0 #ECEDEF;
      font-size: 16px;
      color: #444;
      &.active {
        border: 2px solid #2D8CF0;
        background-color: #EDF6FF;
      }
      &.disabled {
        color: #ccc;
        background-color: #EAEEF3;
      }
    }
  }
  .main {
    position: relative;
    width: calc(100vw - 464px);
    height: 100%;
    .tool {
      position: absolute;
      top: 0;
      right: 40px;
      font-size: 14px;
      z-index: 1001;
      .tool-btn {
        width: 100px;
        height: 34px;
        line-height: 34px;
        text-align: center;
        border-radius: 4px;
        color: #fff;
        background-color: #2D8CF0;
        margin-bottom: 14px;
        cursor: pointer;
      }
      .magnifier {
        justify-content: space-between;
        width: 100px;
        height: 40px;
        padding: 0 8px;
        color: #444;
        background-color: #fff;
        border-radius: 6px;
        .m-btn {
          width: 16px;
          height: 17px;
          cursor: pointer;
        }
      }
    }
    #drag-container {
      width: calc(100vw - 464px);
      height: calc(100vh - 100px);
    }
    .main-none-box {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999;
    }
    .main-none {
      width: 100%;
      height: 100%;
      flex-direction: column;
      justify-content: center;
      img {
        width: 240px;
        height: 176px;
      }
      .none-tip {
        margin-top: 30px;
        font-size: 18px;
        color: #93979B;
      }
    }
  }
}
</style>

