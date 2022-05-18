<template>
  <div class="main" :style="{ height: `${height}px` }">
    <div class="flex title">
      <div class="title-text">• {{ item.title }}</div>
      <div @click="handleDelete">x</div>
    </div>
  </div>
</template>
<script>
export default {
  name: "drag",
  data() {
    return {
      item: {},
      height: 0,
    };
  },
  inject: ["getGraph", "getNode"],
  mounted() {
    const { item, height } = this.getNode().data;
    this.item = item;
    this.height = height;
  },
  methods: {
    handleDelete() {
      this.$confirm("确认删除?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$emit("parentnoderemove", this.getNode());
          this.getNode().remove();
          this.$message({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch();
    },
  },
};
</script>
<style lang="scss" scoped>
.flex {
  display: flex;
  align-items: center;
}
.main {
  width: 280px;
  padding: 20px;
  border-radius: 10px;
  background-color: #fff;
  box-sizing: border-box;
}
.title {
  height: 38px;
  align-items: flex-start;
  justify-content: space-between;
  .title-text {
    font-size: 18px;
    color: #444;
  }
  img {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
}
</style>
