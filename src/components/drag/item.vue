<template>
  <div class="item" :class="{ active }" @click="handleClick">{{ item }}</div>
</template>
<script>
import store from "@/store";
export default {
  name: "item",
  data() {
    return {
      item: "",
      active: false,
      timer: 0,
    };
  },
  inject: ["getGraph", "getNode"],
  mounted() {
    const { item } = this.getNode().data;
    this.item = item;
  },
  computed: {
    nodes() {
      return store.state.nodes;
    },
  },
  watch: {
    nodes: {
      handler(newVal) {
        this.$nextTick(() => {
          this.timer = setTimeout(() => {
            // 判断是当前点击高亮的两个node的id才进行改变。否则会影响全部
            if (newVal.includes(this.getNode().id)) {
              this.active = !this.active;
              clearTimeout(this.timer);
            }
          }, 500);
        });
      },
      deep: true,
    },
  },
  methods: {
    handleClick() {
      this.active = !this.active;
      this.$emit("edge", this.getNode());
    },
  },
};
</script>
<style scoped>
.item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: #444;
  padding: 16px 14px;
  border: 1px solid #C8CED5;
  border-radius: 6px;
}
.active {
  border: 2px solid #2D8CF0;
  background-color: #EDF6FF;
}
</style>
